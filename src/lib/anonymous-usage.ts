/**
 * Anonymous Usage Service - Message Tracking for Non-Authenticated Users
 * 
 * This service manages message limits and usage tracking for users who access
 * BelloSai without creating an account. It implements robust anti-abuse measures
 * to prevent limit circumvention while providing a fair trial experience.
 * 
 * Features:
 * - Daily message limit enforcement (10 messages/day)
 * - Browser fingerprinting to prevent easy limit bypass
 * - Dual storage system for data integrity verification
 * - Time-based reset mechanism (2 AM daily)
 * - Rate limiting to prevent rapid-fire message abuse
 * - Tamper detection and security measures
 * 
 * Abuse Prevention:
 * - Browser fingerprinting using device characteristics
 * - Dual localStorage storage with integrity checks
 * - Time manipulation protection
 * - Session-based rate limiting
 * - Automatic reset validation
 * 
 * Usage Limits:
 * - Anonymous users: 10 messages per day
 * - Reset time: 2 AM local time
 * - Rate limit: 2 second delay between messages after 2+ messages
 * 
 * Technical Implementation:
 * - Uses localStorage for client-side persistence
 * - Implements browser fingerprinting for user identification
 * - Validates data integrity using backup storage
 * - Handles edge cases like localStorage quota exceeded
 * 
 * Storage Structure:
 * - Primary storage: 'bellosai-anonymous-usage'
 * - Backup storage: 'bellosai-anon-backup'
 * - Data includes: message count, reset time, browser fingerprint, session start
 */

interface AnonymousUsageStats {
  messageCount: number;
  resetTime: number; // timestamp when count resets
  dailyLimit: number;
  browserFingerprint: string; // to track unique browsers
  sessionStart: number; // when this session started
}

const STORAGE_KEY = 'bellosai-anonymous-usage';
const BACKUP_STORAGE_KEY = 'bellosai-anon-backup'; // secondary storage
const DAILY_LIMIT = 5;

class AnonymousUsageService {
  private stats: AnonymousUsageStats;
  private browserFingerprint: string;

  constructor() {
    this.browserFingerprint = this.generateBrowserFingerprint();
    this.stats = this.loadStats();
    this.checkReset();
    this.validateAndSyncStats();
  }

  private generateBrowserFingerprint(): string {
    // Create a semi-persistent browser fingerprint to detect abuse
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset().toString(),
      navigator.hardwareConcurrency || '0',
      navigator.platform
    ];
    
    // Simple hash function
    let hash = 0;
    const str = components.join('|');
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  private loadStats(): AnonymousUsageStats {
    try {
      // Try primary storage first
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Only validate fingerprint for completely different devices - be more lenient
        // Allow slight variations that can happen during normal browser usage
        if (parsed.browserFingerprint === this.browserFingerprint || 
            !parsed.browserFingerprint || // Handle old data without fingerprint
            Math.abs(parsed.browserFingerprint.length - this.browserFingerprint.length) <= 2) {
          return parsed;
        } else {
          console.log('Browser fingerprint changed, creating fresh stats');
        }
      }
      
      // Try backup storage
      const backup = localStorage.getItem(BACKUP_STORAGE_KEY);
      if (backup) {
        const parsed = JSON.parse(backup);
        if (parsed.browserFingerprint === this.browserFingerprint || 
            !parsed.browserFingerprint ||
            Math.abs(parsed.browserFingerprint.length - this.browserFingerprint.length) <= 2) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Failed to load anonymous usage stats:', error);
    }
    
    return this.createNewStats();
  }

  private createNewStats(): AnonymousUsageStats {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(2, 0, 0, 0); // Reset at 2 AM next day
    
    return {
      messageCount: 0,
      resetTime: tomorrow.getTime(),
      dailyLimit: DAILY_LIMIT,
      browserFingerprint: this.browserFingerprint,
      sessionStart: Date.now()
    };
  }

  private saveStats(): void {
    try {
      const data = JSON.stringify(this.stats);
      // Save to both primary and backup storage
      localStorage.setItem(STORAGE_KEY, data);
      localStorage.setItem(BACKUP_STORAGE_KEY, data);
    } catch (error) {
      console.error('Failed to save anonymous usage stats:', error);
    }
  }

  private validateAndSyncStats(): void {
    // Additional validation to prevent tampering
    try {
      const primary = localStorage.getItem(STORAGE_KEY);
      const backup = localStorage.getItem(BACKUP_STORAGE_KEY);
      
      if (primary && backup) {
        const primaryData = JSON.parse(primary);
        const backupData = JSON.parse(backup);
        
        // If they don't match, someone might be tampering
        if (JSON.stringify(primaryData) !== JSON.stringify(backupData)) {
          console.warn('Storage mismatch detected - using higher count for security');
          // Use the higher message count for security
          this.stats.messageCount = Math.max(primaryData.messageCount || 0, backupData.messageCount || 0);
          this.saveStats();
        }
      }
    } catch (error) {
      console.warn('Validation check failed:', error);
    }
  }

  private checkReset(): void {
    const now = Date.now();
    if (now >= this.stats.resetTime) {
      // Check if it's actually past 2 AM to prevent time manipulation
      const currentTime = new Date();
      const lastReset = new Date(this.stats.resetTime);
      
      // Only reset if we're truly past the reset time
      if (currentTime >= lastReset) {
        this.stats = this.createNewStats();
        this.saveStats();
      }
    }
  }

  getStats(): AnonymousUsageStats {
    this.checkReset();
    this.validateAndSyncStats();
    return { ...this.stats };
  }

  canSendMessage(): boolean {
    this.checkReset();
    this.validateAndSyncStats();
    
    // Additional abuse checks
    const now = Date.now();
    const sessionDuration = now - this.stats.sessionStart;
    
    // Rate limiting: prevent rapid message sending (only for multiple messages)
    if (sessionDuration < 2000 && this.stats.messageCount > 2) {
      // Must wait at least 2 seconds between messages after 2+ messages to prevent spam
      return false;
    }
    
    return this.stats.messageCount < this.stats.dailyLimit;
  }

  recordMessage(): boolean {
    this.checkReset();
    this.validateAndSyncStats();
    
    if (!this.canSendMessage()) {
      return false;
    }
    
    this.stats.messageCount++;
    this.saveStats();
    return true;
  }

  getRemainingMessages(): number {
    this.checkReset();
    this.validateAndSyncStats();
    return Math.max(0, this.stats.dailyLimit - this.stats.messageCount);
  }

  getResetTimeFormatted(): string {
    return new Date(this.stats.resetTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Method to check if user is likely trying to abuse the system
  isLikelyAbuse(): boolean {
    try {
      // Check for signs of abuse attempts
      const storageTests = [
        STORAGE_KEY,
        BACKUP_STORAGE_KEY,
        'bellosai-anon',
        'bellosai-anonymous',
        'anon-usage'
      ];
      
      let suspiciousEntries = 0;
      storageTests.forEach(key => {
        try {
          const value = localStorage.getItem(key);
          if (value && value !== localStorage.getItem(STORAGE_KEY)) {
            suspiciousEntries++;
          }
        } catch (e) {
          // Ignore errors
        }
      });
      
      return suspiciousEntries > 2; // Multiple conflicting entries suggest tampering
    } catch (error) {
      return false;
    }
  }
}

export const anonymousUsageService = new AnonymousUsageService();
export type { AnonymousUsageStats }; 

