/**
 * Anonymous Usage Service
 * Manages message limits and usage tracking for non-logged-in users
 */

interface AnonymousUsageStats {
  messageCount: number;
  resetTime: number; // timestamp when count resets
  dailyLimit: number;
}

const STORAGE_KEY = 'bellosai-anonymous-usage';
const DAILY_LIMIT = 10;

class AnonymousUsageService {
  private stats: AnonymousUsageStats;

  constructor() {
    this.stats = this.loadStats();
    this.checkReset();
  }

  private loadStats(): AnonymousUsageStats {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
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
      dailyLimit: DAILY_LIMIT
    };
  }

  private saveStats(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.stats));
    } catch (error) {
      console.error('Failed to save anonymous usage stats:', error);
    }
  }

  private checkReset(): void {
    const now = Date.now();
    if (now >= this.stats.resetTime) {
      this.stats = this.createNewStats();
      this.saveStats();
    }
  }

  getStats(): AnonymousUsageStats {
    this.checkReset();
    return { ...this.stats };
  }

  canSendMessage(): boolean {
    this.checkReset();
    return this.stats.messageCount < this.stats.dailyLimit;
  }

  recordMessage(): boolean {
    this.checkReset();
    
    if (!this.canSendMessage()) {
      return false;
    }
    
    this.stats.messageCount++;
    this.saveStats();
    return true;
  }

  getRemainingMessages(): number {
    this.checkReset();
    return Math.max(0, this.stats.dailyLimit - this.stats.messageCount);
  }

  getResetTimeFormatted(): string {
    return new Date(this.stats.resetTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

export const anonymousUsageService = new AnonymousUsageService();
export type { AnonymousUsageStats }; 

