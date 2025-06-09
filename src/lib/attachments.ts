import { supabase } from './supabase'
import type { Database } from './supabase'

type Attachment = Database['public']['Tables']['attachments']['Row']

export interface UploadAttachmentData {
  file: File
  userId: string
}

export interface AttachmentMetadata {
  filename: string
  file_type: string
  file_size: number
  storage_path: string
}

class AttachmentService {
  private readonly BUCKET_NAME = 'attachments'
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  private readonly ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/json'
  ]

  /**
   * Check if file type is allowed
   */
  private isFileTypeAllowed(fileType: string): boolean {
    return this.ALLOWED_TYPES.includes(fileType)
  }

  /**
   * Check if file size is within limits
   */
  private isFileSizeAllowed(fileSize: number): boolean {
    return fileSize <= this.MAX_FILE_SIZE
  }

  /**
   * Generate unique file path
   */
  private generateFilePath(userId: string, filename: string): string {
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const extension = filename.split('.').pop()
    return `${userId}/${timestamp}-${randomId}.${extension}`
  }

  /**
   * Upload a file and create attachment record
   */
  async uploadAttachment(data: UploadAttachmentData): Promise<Attachment> {
    const { file, userId } = data

    // Validate file type
    if (!this.isFileTypeAllowed(file.type)) {
      throw new Error(`File type ${file.type} is not allowed`)
    }

    // Validate file size
    if (!this.isFileSizeAllowed(file.size)) {
      throw new Error(`File size exceeds ${this.MAX_FILE_SIZE / 1024 / 1024}MB limit`)
    }

    // Generate unique file path
    const filePath = this.generateFilePath(userId, file.name)

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(this.BUCKET_NAME)
      .upload(filePath, file)

    if (uploadError) throw uploadError

    // Create attachment record in database
    const attachmentData = {
      user_id: userId,
      filename: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_path: filePath
    }

    const { data: attachment, error: dbError } = await supabase
      .from('attachments')
      .insert(attachmentData)
      .select()
      .single()

    if (dbError) {
      // If database insert fails, clean up uploaded file
      await this.deleteFile(filePath)
      throw dbError
    }

    return attachment
  }

  /**
   * Get attachment by ID
   */
  async getAttachment(id: string): Promise<Attachment | null> {
    const { data, error } = await supabase
      .from('attachments')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Get user's attachments
   */
  async getUserAttachments(userId: string): Promise<Attachment[]> {
    const { data, error } = await supabase
      .from('attachments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Get download URL for an attachment
   */
  async getDownloadUrl(storagePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .createSignedUrl(storagePath, 3600) // 1 hour expiry

    if (error) throw error
    return data.signedUrl
  }

  /**
   * Get public URL for an attachment (for images)
   */
  getPublicUrl(storagePath: string): string {
    const { data } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(storagePath)

    return data.publicUrl
  }

  /**
   * Delete an attachment
   */
  async deleteAttachment(id: string): Promise<void> {
    // Get attachment to get storage path
    const attachment = await this.getAttachment(id)
    if (!attachment) throw new Error('Attachment not found')

    // Delete from storage
    await this.deleteFile(attachment.storage_path)

    // Delete from database
    const { error } = await supabase
      .from('attachments')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  /**
   * Delete file from storage
   */
  private async deleteFile(storagePath: string): Promise<void> {
    const { error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .remove([storagePath])

    if (error) throw error
  }

  /**
   * Process image for optimization (basic implementation)
   */
  async processImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions (max 1200px width/height)
        const maxSize = 1200
        let { width, height } = img

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height * maxSize) / width
            width = maxSize
          } else {
            width = (width * maxSize) / height
            height = maxSize
          }
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const processedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              })
              resolve(processedFile)
            } else {
              reject(new Error('Failed to process image'))
            }
          },
          file.type,
          0.8 // 80% quality
        )
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * Validate and process file before upload
   */
  async prepareFile(file: File): Promise<File> {
    // For images, process and optimize
    if (file.type.startsWith('image/')) {
      return await this.processImage(file)
    }

    // For other files, return as-is
    return file
  }

  /**
   * Get attachment metadata without downloading
   */
  async getAttachmentMetadata(id: string): Promise<AttachmentMetadata | null> {
    const attachment = await this.getAttachment(id)
    if (!attachment) return null

    return {
      filename: attachment.filename,
      file_type: attachment.file_type,
      file_size: attachment.file_size,
      storage_path: attachment.storage_path
    }
  }

  /**
   * Check storage usage for user
   */
  async getUserStorageUsage(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('attachments')
      .select('file_size')
      .eq('user_id', userId)

    if (error) throw error

    return data?.reduce((total, attachment) => total + attachment.file_size, 0) || 0
  }
}

export const attachmentService = new AttachmentService() 