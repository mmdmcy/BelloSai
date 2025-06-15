/**
 * Advanced Chat Features Service
 * 
 * Handles advanced chat functionality including:
 * - Chat branching and alternative conversation paths
 * - Chat sharing with public links
 * - Web search integration
 * - Image generation capabilities
 * - Resumable streams and conversation persistence
 * - Bring Your Own Key (BYOK) functionality
 */

import { supabase } from './supabase';
import { attachmentService } from './attachments';

export interface ChatBranch {
  id: string;
  conversation_id: string;
  parent_message_id: string;
  title: string;
  created_at: string;
}

export interface SharedChat {
  id: string;
  share_id: string;
  title: string;
  is_public: boolean;
  expires_at?: string;
  view_count: number;
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

export interface ImageGenerationRequest {
  prompt: string;
  style?: 'realistic' | 'artistic' | 'cartoon' | 'abstract';
  size?: '512x512' | '1024x1024' | '1024x1792' | '1792x1024';
  quality?: 'standard' | 'hd';
}

export interface UserAPIKeys {
  openai_key?: string;
  anthropic_key?: string;
  deepseek_key?: string;
  google_key?: string;
  encrypted: boolean;
}

class ChatFeaturesService {
  
  // ========================================
  // CHAT BRANCHING
  // ========================================
  
  /**
   * Create a new conversation branch from a specific message
   */
  async createBranch(conversationId: string, parentMessageId: string, title: string): Promise<ChatBranch> {
    const { data, error } = await supabase
      .from('conversation_branches')
      .insert({
        conversation_id: conversationId,
        parent_message_id: parentMessageId,
        title: title
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get all branches for a conversation
   */
  async getConversationBranches(conversationId: string): Promise<ChatBranch[]> {
    const { data, error } = await supabase
      .from('conversation_branches')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get messages for a specific branch
   */
  async getBranchMessages(conversationId: string, branchId?: string) {
    let query = supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId);

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // ========================================
  // CHAT SHARING
  // ========================================

  /**
   * Share a conversation publicly
   */
  async shareConversation(conversationId: string, expiresInDays?: number): Promise<SharedChat> {
    const shareId = this.generateShareId();
    const expiresAt = expiresInDays 
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data, error } = await supabase
      .from('conversations')
      .update({
        is_shared: true,
        share_id: shareId,
        expires_at: expiresAt
      })
      .eq('id', conversationId)
      .select('id, share_id, title, is_shared, expires_at')
      .single();

    if (error) throw error;

    return {
      ...data,
      is_public: true,
      view_count: 0
    };
  }

  /**
   * Get shared conversation by share ID
   */
  async getSharedConversation(shareId: string) {
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('share_id', shareId)
      .eq('is_shared', true)
      .single();

    if (convError) throw convError;

    // Check if expired
    if (conversation.expires_at && new Date(conversation.expires_at) < new Date()) {
      throw new Error('Shared conversation has expired');
    }

    // Get messages
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    if (msgError) throw msgError;

    // Increment view count
    await this.incrementViewCount(shareId);

    return {
      conversation,
      messages: messages || []
    };
  }

  /**
   * Unshare a conversation
   */
  async unshareConversation(conversationId: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({
        is_shared: false,
        share_id: null,
        expires_at: null
      })
      .eq('id', conversationId);

    if (error) throw error;
  }

  private generateShareId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  private async incrementViewCount(shareId: string): Promise<void> {
    await supabase.rpc('increment_share_view_count', { share_id: shareId });
  }

  // ========================================
  // WEB SEARCH INTEGRATION
  // ========================================

  /**
   * Perform web search and return results
   */
  async performWebSearch(query: string, maxResults: number = 5): Promise<WebSearchResult[]> {
    try {
      // Using Brave Search API (free tier available)
      const response = await fetch('/api/web-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, maxResults })
      });

      if (!response.ok) {
        throw new Error('Web search failed');
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Web search error:', error);
      return [];
    }
  }

  /**
   * Search and summarize results for AI context
   */
  async searchAndSummarize(query: string): Promise<string> {
    const results = await this.performWebSearch(query);
    
    if (results.length === 0) {
      return `No web search results found for: ${query}`;
    }

    let summary = `Web search results for "${query}":\n\n`;
    results.forEach((result, index) => {
      summary += `${index + 1}. **${result.title}**\n`;
      summary += `   ${result.snippet}\n`;
      summary += `   Source: ${result.url}\n\n`;
    });

    return summary;
  }

  // ========================================
  // IMAGE GENERATION
  // ========================================

  /**
   * Generate image using AI
   */
  async generateImage(request: ImageGenerationRequest, userId: string): Promise<string> {
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          userId
        })
      });

      if (!response.ok) {
        throw new Error('Image generation failed');
      }

      const data = await response.json();
      return data.imageUrl;
    } catch (error) {
      console.error('Image generation error:', error);
      throw error;
    }
  }

  /**
   * Save generated image as attachment
   */
  async saveGeneratedImage(imageUrl: string, prompt: string, userId: string) {
    try {
      // Download image
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Create file object
      const file = new File([blob], `generated-${Date.now()}.png`, { type: 'image/png' });
      
      // Upload as attachment
      const attachment = await attachmentService.uploadAttachment({
        file,
        userId
      });

      // Add metadata
      await supabase
        .from('attachments')
        .update({
          metadata: {
            type: 'generated_image',
            prompt: prompt,
            generated_at: new Date().toISOString()
          }
        })
        .eq('id', attachment.id);

      return attachment;
    } catch (error) {
      console.error('Error saving generated image:', error);
      throw error;
    }
  }

  // ========================================
  // RESUMABLE STREAMS
  // ========================================

  /**
   * Save stream state for resumability
   */
  async saveStreamState(conversationId: string, messageId: string, partialContent: string): Promise<void> {
    await supabase
      .from('stream_states')
      .upsert({
        conversation_id: conversationId,
        message_id: messageId,
        partial_content: partialContent,
        updated_at: new Date().toISOString()
      });
  }

  /**
   * Resume stream from saved state
   */
  async resumeStream(conversationId: string, messageId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('stream_states')
      .select('partial_content')
      .eq('conversation_id', conversationId)
      .eq('message_id', messageId)
      .single();

    if (error) return null;
    return data?.partial_content || null;
  }

  /**
   * Clear stream state after completion
   */
  async clearStreamState(conversationId: string, messageId: string): Promise<void> {
    await supabase
      .from('stream_states')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('message_id', messageId);
  }

  // ========================================
  // BRING YOUR OWN KEY (BYOK)
  // ========================================

  /**
   * Save user's API keys (encrypted)
   */
  async saveUserAPIKeys(userId: string, keys: Partial<UserAPIKeys>): Promise<void> {
    // Encrypt keys before storing
    const encryptedKeys = await this.encryptAPIKeys(keys);
    
    const { error } = await supabase
      .from('user_api_keys')
      .upsert({
        user_id: userId,
        ...encryptedKeys,
        encrypted: true,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  /**
   * Get user's API keys (decrypted)
   */
  async getUserAPIKeys(userId: string): Promise<UserAPIKeys | null> {
    const { data, error } = await supabase
      .from('user_api_keys')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) return null;
    if (!data) return null;

    // Decrypt keys
    return await this.decryptAPIKeys(data);
  }

  /**
   * Test API key validity
   */
  async testAPIKey(provider: string, apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('/api/test-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider, apiKey })
      });

      const data = await response.json();
      return data.valid === true;
    } catch (error) {
      console.error('API key test error:', error);
      return false;
    }
  }

  private async encryptAPIKeys(keys: Partial<UserAPIKeys>): Promise<any> {
    // Simple encryption - in production, use proper encryption
    const encrypted: any = {};
    for (const [key, value] of Object.entries(keys)) {
      if (value && typeof value === 'string') {
        encrypted[key] = btoa(value); // Base64 encoding (use proper encryption in production)
      }
    }
    return encrypted;
  }

  private async decryptAPIKeys(encryptedData: any): Promise<UserAPIKeys> {
    const decrypted: any = {};
    for (const [key, value] of Object.entries(encryptedData)) {
      if (value && typeof value === 'string' && key.endsWith('_key')) {
        try {
          decrypted[key] = atob(value as string); // Base64 decoding
        } catch (error) {
          console.error(`Failed to decrypt ${key}:`, error);
        }
      }
    }
    return { ...decrypted, encrypted: true };
  }

  // ========================================
  // SYNTAX HIGHLIGHTING
  // ========================================

  /**
   * Detect programming language from code
   */
  detectLanguage(code: string): string {
    // Simple language detection based on patterns
    if (code.includes('import React') || code.includes('useState')) return 'javascript';
    if (code.includes('def ') || code.includes('import numpy')) return 'python';
    if (code.includes('SELECT') || code.includes('FROM')) return 'sql';
    if (code.includes('<!DOCTYPE') || code.includes('<html')) return 'html';
    if (code.includes('body {') || code.includes('.class')) return 'css';
    if (code.includes('package main') || code.includes('func main')) return 'go';
    if (code.includes('public class') || code.includes('System.out')) return 'java';
    if (code.includes('#include') || code.includes('int main')) return 'cpp';
    if (code.includes('fn main') || code.includes('let mut')) return 'rust';
    
    return 'text';
  }

  /**
   * Format code with syntax highlighting
   */
  formatCodeBlock(code: string, language?: string): string {
    const detectedLang = language || this.detectLanguage(code);
    return `\`\`\`${detectedLang}\n${code}\n\`\`\``;
  }

  // ========================================
  // CONVERSATION MANAGEMENT
  // ========================================

  /**
   * Create new conversation with proper initialization
   */
  async createConversation(userId: string, title: string, model: string) {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        title: title,
        model: model
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get user's conversations with metadata
   */
  async getUserConversations(userId: string) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Update conversation title
   */
  async updateConversationTitle(conversationId: string, title: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    if (error) throw error;
  }

  /**
   * Delete conversation and all related data
   */
  async deleteConversation(conversationId: string): Promise<void> {
    // Delete in order: stream_states, messages, branches, conversation
    await supabase.from('stream_states').delete().eq('conversation_id', conversationId);
    await supabase.from('messages').delete().eq('conversation_id', conversationId);
    await supabase.from('conversation_branches').delete().eq('conversation_id', conversationId);
    
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (error) throw error;
  }

  /**
   * Save a message to a conversation
   */
  async saveMessage(conversationId: string, role: 'user' | 'assistant', content: string) {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: role,
        content: content
      })
      .select()
      .single();

    if (error) throw error;
    
    // Update conversation's updated_at timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return data;
  }

  /**
   * Get messages for a conversation
   */
  async getConversationMessages(conversationId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Generate an AI-powered conversation title based on the content
   */
  async generateConversationTitle(messages: Array<{role: string, content: string}>): Promise<string> {
    if (messages.length === 0) return 'Nieuwe Conversatie';
    
    // Take first few messages to understand the topic
    const contextMessages = messages.slice(0, 4); // First 4 messages for context
    const conversationContext = contextMessages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
    
    // Truncate if too long
    const truncatedContext = conversationContext.length > 500 
      ? conversationContext.substring(0, 500) + '...'
      : conversationContext;
    
    try {
      // Get current session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.log('No authentication for title generation, using fallback');
        return this.generateFallbackTitle(messages[0].content);
      }

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deepseek-chat`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'Je bent een assistent die korte, informatieve titels maakt voor gesprekken. Maak een titel van maximaal 40 karakters die het hoofdonderwerp van de conversatie weergeeft. Antwoord alleen met de titel, geen verdere uitleg.'
            },
            {
              role: 'user',
              content: `Maak een korte, informatieve titel voor deze conversatie:\n\n${truncatedContext}`
            }
          ],
          model: 'DeepSeek-V3',
          stream: false
        })
      });

      if (response.ok) {
        const data = await response.json();
        const generatedTitle = data.response?.trim() || '';
        
        // Clean up the title and ensure it's not too long
        let title = generatedTitle
          .replace(/^["']|["']$/g, '') // Remove quotes
          .replace(/\n/g, ' ') // Replace newlines with spaces
          .trim();
        
        if (title.length > 40) {
          title = title.substring(0, 37) + '...';
        }
        
        return title || this.generateFallbackTitle(messages[0].content);
      }
    } catch (error) {
      console.log('AI title generation failed, using fallback');
    }
    
    // Fallback to first message method
    return this.generateFallbackTitle(messages[0].content);
  }

  /**
   * Generate fallback title from first message
   */
  private generateFallbackTitle(firstMessage: string): string {
    const title = firstMessage.trim().slice(0, 40);
    return title.length < firstMessage.trim().length ? title + '...' : title;
  }
}

export const chatFeaturesService = new ChatFeaturesService(); 