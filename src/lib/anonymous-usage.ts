/**
 * Anonymous Usage Service
 * Manages message limits and usage tracking for non-logged-in users
 */

const ANONYMOUS_STORAGE_KEY = 'bellosai-anonymous-usage';
const DAILY_MESSAGE_LIMIT = 10;

interface AnonymousUsage {
  messageCount: number;
  lastResetDate: string; // ISO date string
  firstUsageDate: string; // ISO date string
}

class AnonymousUsageService {
  /**
   * Get current anonymous usage data
   */
  private getUsageData(): AnonymousUsage {
    try {
      const stored = localStorage.getItem(ANONYMOUS_STORAGE_KEY);
      if (!stored) {
        return this.createNewUsageData();
      }
      
      const data: AnonymousUsage = JSON.parse(stored);
      
      // Check if we need to reset daily counter
      const today = new Date().toDateString();
      const lastReset = new Date(data.lastResetDate).toDateString();
      
      if (today !== lastReset) {
        // Reset daily counter
        data.messageCount = 0;
        data.lastResetDate = new Date().toISOString();
        this.saveUsageData(data);
      }
      
      return data;
    } catch (error) {
      console.error('Error reading anonymous usage data:', error);
      return this.createNewUsageData();
    }
  }

  /**
   * Create new usage data for first-time anonymous user
   */
  private createNewUsageData(): AnonymousUsage {
    const now = new Date().toISOString();
    const data: AnonymousUsage = {
      messageCount: 0,
      lastResetDate: now,
      firstUsageDate: now
    };
    this.saveUsageData(data);
    return data;
  }

  /**
   * Save usage data to localStorage
   */
  private saveUsageData(data: AnonymousUsage): void {
    try {
      localStorage.setItem(ANONYMOUS_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving anonymous usage data:', error);
    }
  }

  /**
   * Check if user can send a message (within daily limit)
   */
  canSendMessage(): boolean {
    const data = this.getUsageData();
    return data.messageCount < DAILY_MESSAGE_LIMIT;
  }

  /**
   * Get remaining messages for today
   */
  getRemainingMessages(): number {
    const data = this.getUsageData();
    return Math.max(0, DAILY_MESSAGE_LIMIT - data.messageCount);
  }

  /**
   * Get total messages sent today
   */
  getMessagesUsedToday(): number {
    const data = this.getUsageData();
    return data.messageCount;
  }

  /**
   * Increment message count (call when user sends a message)
   */
  incrementMessageCount(): void {
    const data = this.getUsageData();
    data.messageCount += 1;
    this.saveUsageData(data);
  }

  /**
   * Get daily limit
   */
  getDailyLimit(): number {
    return DAILY_MESSAGE_LIMIT;
  }

  /**
   * Get usage statistics for display
   */
  getUsageStats(): {
    used: number;
    remaining: number;
    limit: number;
    resetTime: string;
  } {
    const data = this.getUsageData();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    return {
      used: data.messageCount,
      remaining: this.getRemainingMessages(),
      limit: DAILY_MESSAGE_LIMIT,
      resetTime: tomorrow.toLocaleString()
    };
  }

  /**
   * Clear all anonymous usage data (for testing or reset)
   */
  clearUsageData(): void {
    try {
      localStorage.removeItem(ANONYMOUS_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing anonymous usage data:', error);
    }
  }
}

export const anonymousUsageService = new AnonymousUsageService(); 