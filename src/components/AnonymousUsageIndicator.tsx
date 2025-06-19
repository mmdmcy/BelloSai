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

  const getStatusColor = () => {
    if (isAtLimit) return 'text-red-500';
    if (isNearLimit) return 'text-orange-500';
    return 'text-yellow-500';
  };

  const getBackgroundColor = () => {
    if (isAtLimit) return 'bg-red-50 border-red-200';
    if (isNearLimit) return 'bg-orange-50 border-orange-200';
    return 'bg-yellow-50 border-yellow-200';
  };

  return (
    <div className={`p-4 rounded-lg border ${getBackgroundColor()} mb-4`}>
      <div className="flex items-center gap-2 mb-2">
        {isAtLimit ? (
          <AlertTriangle className="w-4 h-4 text-red-500" />
        ) : (
          <MessageCircle className={`w-4 h-4 ${getStatusColor()}`} />
        )}
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {isAtLimit ? 'Daily limit reached' : `${remaining} messages left today`}
        </span>
      </div>
      
      {isAtLimit ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            You've reached your daily limit of <strong>{stats.dailyLimit} free messages</strong>. 
            Create an account to get more messages!
          </p>
          
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Clock className="w-3 h-3" />
            <span>Resets at {anonymousUsageService.getResetTimeFormatted()}</span>
          </div>
          
          <div className="space-y-2">
            <button
              onClick={onLoginClick}
              className="w-full flex items-center justify-center gap-2 text-sm bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Create Account - Get 20 Messages Daily
            </button>
            
            <div className="text-center">
              <button
                onClick={onLoginClick}
                className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-medium"
              >
                <Sparkles className="w-3 h-3" />
                Or upgrade to Pro for unlimited messages
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-xs text-gray-600">
            <div className="flex items-center gap-1 mb-1">
              <Clock className="w-3 h-3" />
              <span>Resets at {anonymousUsageService.getResetTimeFormatted()}</span>
            </div>
            <div>
              {stats.messageCount} of {stats.dailyLimit} messages used today
            </div>
          </div>

          {isNearLimit && (
            <p className="text-xs text-orange-600 font-medium">
              Running low! Create an account for 20 messages daily.
            </p>
          )}

          <button
            onClick={onLoginClick}
            className="flex items-center gap-2 text-xs bg-blue-500 text-white px-3 py-1.5 rounded-md hover:bg-blue-600 transition-colors"
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
