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
  const isNearLimit = remaining <= 2;

  const statusPalette = isAtLimit
    ? { base: '#ef4444', text: '#dc2626' }
    : isNearLimit
      ? { base: '#f97316', text: '#c2410c' }
      : { base: '#f59e0b', text: '#b45309' };

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
          {isAtLimit ? 'Daily limit reached' : `${remaining} messages left today`}
        </span>
      </div>
      
      {isAtLimit ? (
        <div className="space-y-3">
          <p className="text-sm text-theme">
            You've reached your daily limit of <strong>{stats.dailyLimit} free messages</strong>. 
            Create an account to get more messages!
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
              Create Account - Get 20 Messages Daily
            </button>
            
            <div className="text-center">
              <button
                onClick={onLoginClick}
              className="inline-flex items-center gap-1 text-xs font-medium text-theme hover:text-theme"
              >
                <Sparkles className="w-3 h-3" />
                Or upgrade to Pro for unlimited messages
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-xs text-theme-muted">
            <div className="flex items-center gap-1 mb-1">
              <Clock className="w-3 h-3" />
              <span>Resets at {anonymousUsageService.getResetTimeFormatted()}</span>
            </div>
            <div>
              {stats.messageCount} of {stats.dailyLimit} messages used today
            </div>
          </div>

          {isNearLimit && (
            <p className="text-xs font-medium" style={{ color: statusPalette.text }}>
              Running low! Create an account for 20 messages daily.
            </p>
          )}

          <button
            onClick={onLoginClick}
            className="flex items-center gap-2 text-xs rounded-theme px-3 py-1.5 transition-all duration-200 hover:scale-[1.02]"
            style={{
              background: surfaceTint(26),
              borderColor: borderTint(28),
              borderWidth: '1px',
              borderStyle: 'solid',
              color: statusPalette.text
            }}
          >
            <LogIn className="w-3 h-3" />
            Create account for more messages
          </button>
        </div>
      )}
    </div>
  );
};

export default AnonymousUsageIndicator; 
