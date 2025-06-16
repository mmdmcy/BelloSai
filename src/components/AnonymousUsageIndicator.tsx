import React from 'react';
import { MessageCircle, Clock, LogIn } from 'lucide-react';
import { anonymousUsageService } from '../lib/anonymous-usage';

interface AnonymousUsageIndicatorProps {
  onLoginClick: () => void;
}

const AnonymousUsageIndicator: React.FC<AnonymousUsageIndicatorProps> = ({ onLoginClick }) => {
  const stats = anonymousUsageService.getUsageStats();
  
  // Don't show if user has plenty of messages left
  if (stats.remaining > 5) {
    return null;
  }

  const getStatusColor = () => {
    if (stats.remaining === 0) return 'text-red-500';
    if (stats.remaining <= 2) return 'text-orange-500';
    return 'text-yellow-500';
  };

  const getBackgroundColor = () => {
    if (stats.remaining === 0) return 'bg-red-50 border-red-200';
    if (stats.remaining <= 2) return 'bg-orange-50 border-orange-200';
    return 'bg-yellow-50 border-yellow-200';
  };

  return (
    <div className={`p-3 rounded-lg border ${getBackgroundColor()} mb-4`}>
      <div className="flex items-center gap-2 mb-2">
        <MessageCircle className={`w-4 h-4 ${getStatusColor()}`} />
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {stats.remaining === 0 ? 'Dagelijkse limiet bereikt' : `${stats.remaining} berichten over`}
        </span>
      </div>
      
      <div className="text-xs text-gray-600 mb-3">
        <div className="flex items-center gap-1 mb-1">
          <Clock className="w-3 h-3" />
          <span>Reset om {new Date(stats.resetTime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div>
          {stats.used} van {stats.limit} berichten gebruikt vandaag
        </div>
      </div>

      <button
        onClick={onLoginClick}
        className="flex items-center gap-2 text-xs bg-blue-500 text-white px-3 py-1.5 rounded-md hover:bg-blue-600 transition-colors"
      >
        <LogIn className="w-3 h-3" />
        Log in voor onbeperkt gebruik
      </button>
    </div>
  );
};

export default AnonymousUsageIndicator; 