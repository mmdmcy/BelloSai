import React from 'react';
import { MessageCircle, Clock, LogIn, Sparkles, AlertTriangle } from 'lucide-react';
import { anonymousUsageService } from '../lib/anonymous-usage';

interface AnonymousUsageIndicatorProps {
  onLoginClick: () => void;
  isLimitReached?: boolean;
  showAlways?: boolean;
}

const AnonymousUsageIndicator: React.FC<AnonymousUsageIndicatorProps> = ({ 
  onLoginClick, 
  isLimitReached = false,
  showAlways = false 
}) => {
  const stats = anonymousUsageService.getStats();
  const remaining = anonymousUsageService.getRemainingMessages();
  
  // Don't show if user has plenty of messages left, unless forced to show
  if (!showAlways && remaining > 5 && !isLimitReached) {
    return null;
  }

  const isAtLimit = remaining === 0 || isLimitReached;

  if (!isAtLimit) {
    return null;
  }

  const statusPalette = { base: '#ef4444', text: '#dc2626' };

  const surfaceTint = (amount: number) => `color-mix(in srgb, ${statusPalette.base} ${amount}%, var(--color-surface) ${100 - amount}%)`;
  const borderTint = (amount: number) => `color-mix(in srgb, ${statusPalette.base} ${amount}%, var(--color-border) ${100 - amount}%)`;

  return (
    <div
      className="p-4 rounded-theme border shadow-theme-soft mb-4"
      style={{
        background: surfaceTint(14),
        borderColor: borderTint(38)
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        {isAtLimit ? (
          <AlertTriangle className="w-4 h-4" style={{ color: statusPalette.text }} />
        ) : (
          <MessageCircle className="w-4 h-4" style={{ color: statusPalette.text }} />
        )}
        <span className="text-sm font-medium" style={{ color: statusPalette.text }}>
          Daily limit reached
        </span>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-theme">
          You've reached your daily limit of <strong>{stats.dailyLimit} free messages</strong>.
        </p>

        <div className="flex items-center gap-1 text-xs text-theme-muted">
          <Clock className="w-3 h-3" />
          <span>Resets at {anonymousUsageService.getResetTimeFormatted()}</span>
        </div>

        <div className="space-y-2">
          <button
            onClick={onLoginClick}
            className="w-full flex items-center justify-center gap-2 text-sm rounded-theme transition-all duration-200 hover:scale-[1.02] bg-theme-accent text-theme-inverse shadow-theme-soft"
            style={{
              background: `linear-gradient(135deg, ${statusPalette.base}, ${surfaceTint(32)})`,
              color: 'var(--color-text-inverse)'
            }}
          >
            <LogIn className="w-4 h-4" />
            Create Account - Unlock More Messages
          </button>

          <div className="text-center">
            <button
              onClick={onLoginClick}
              className="inline-flex items-center gap-1 text-xs font-medium text-theme hover:text-theme"
            >
              <Sparkles className="w-3 h-3" />
              Upgrade to Pro for unlimited chatting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnonymousUsageIndicator; 
