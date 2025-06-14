import React from 'react';
import { CustomizationSettings, Message } from '../App';
import { ExtendedLayoutConfig } from '../lib/auth-integration';
import { AuthUser } from '../lib/auth';
import { LogIn, UserPlus, User, Edit3, Settings, Search, MessageSquare, Gamepad2, Sun, Moon } from 'lucide-react';

interface GridLayoutProps {
  layout: ExtendedLayoutConfig;
  isDark: boolean;
  customization: CustomizationSettings;
  user: AuthUser | null;
  currentView: 'chat' | 'game';
  messages: Message[];
  isGenerating: boolean;
  selectedModel: string;
  availableModels: string[];
  onToggleTheme: () => void;
  onToggleDesigner: () => void;
  onToggleAccount: () => void;
  onShowLogin: () => void;
  onShowSignup: () => void;
  onSendMessage: (message: string) => void;
  onRegenerateResponse: () => void;
  onModelChange: (model: string) => void;
  onNewChat: () => void;
  onNewGame: () => void;
  onBackToChat: () => void;
  onSearch: () => void;
  getUserDisplayName: () => string;
  getUserInitial: () => string;
}

const GridLayout: React.FC<GridLayoutProps> = ({
  layout,
  isDark,
  customization,
  user,
  currentView,
  messages,
  isGenerating,
  selectedModel,
  availableModels,
  onToggleTheme,
  onToggleDesigner,
  onToggleAccount,
  onShowLogin,
  onShowSignup,
  onSendMessage,
  onRegenerateResponse,
  onModelChange,
  onNewChat,
  onNewGame,
  onBackToChat,
  onSearch,
  getUserDisplayName,
  getUserInitial
}) => {
  const GRID_COLS = 20;
  const GRID_ROWS = 16;

  const renderGridElement = (key: keyof ExtendedLayoutConfig, config: any) => {
    const baseClasses = `absolute flex items-center justify-center transition-all duration-200`;
    const position = {
      left: `${(config.x / GRID_COLS) * 100}%`,
      top: `${(config.y / GRID_ROWS) * 100}%`,
      width: `${(config.width / GRID_COLS) * 100}%`,
      height: `${(config.height / GRID_ROWS) * 100}%`,
      zIndex: config.zIndex
    };

    switch (key) {
      case 'topBar':
        return (
          <div
            key={key}
            className={`${baseClasses} text-white rounded-lg m-1`}
            style={{
              ...position,
              background: customization.gradientEnabled 
                ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                : customization.primaryColor
            }}
          >
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-lg font-semibold">
                Top Bar
              </span>
              <span className="text-xs ml-2 opacity-75">({config.width}×{config.height})</span>
            </div>
          </div>
        );

      case 'appLogo':
        return (
          <div
            key={key}
            className={`${baseClasses} ${isDark ? 'bg-blue-600' : 'bg-blue-500'} text-white rounded-lg m-1 cursor-pointer hover:opacity-90`}
            style={position}
            onClick={onNewChat}
          >
            <div className="text-center">
              <div className="font-bold text-sm">App Logo</div>
              <div className="text-xs opacity-90">{config.width}×{config.height}</div>
            </div>
          </div>
        );

      case 'newGameButton':
        return (
          <div
            key={key}
            className={`${baseClasses} bg-red-500 text-white rounded-lg m-1 cursor-pointer hover:opacity-90`}
            style={position}
            onClick={onNewGame}
          >
            <div className="text-center">
              <Gamepad2 className="w-4 h-4 mx-auto mb-1" />
              <div className="font-bold text-xs">New Game Button</div>
              <div className="text-xs opacity-90">{config.width}×{config.height}</div>
            </div>
          </div>
        );

      case 'newChatButton':
        return (
          <div
            key={key}
            className={`${baseClasses} bg-green-500 text-white rounded-lg m-1 cursor-pointer hover:opacity-90`}
            style={position}
            onClick={onNewChat}
          >
            <div className="text-center">
              <MessageSquare className="w-4 h-4 mx-auto mb-1" />
              <div className="font-bold text-xs">New Chat Button</div>
              <div className="text-xs opacity-90">{config.width}×{config.height}</div>
            </div>
          </div>
        );

      case 'searchButton':
        return (
          <div
            key={key}
            className={`${baseClasses} bg-cyan-500 text-white rounded-lg m-1 cursor-pointer hover:opacity-90`}
            style={position}
            onClick={onSearch}
          >
            <div className="text-center">
              <Search className="w-4 h-4 mx-auto mb-1" />
              <div className="font-bold text-xs">Search Button</div>
              <div className="text-xs opacity-90">{config.width}×{config.height}</div>
            </div>
          </div>
        );

      case 'sidebar':
        return (
          <div
            key={key}
            className={`${baseClasses} bg-blue-500 text-white rounded-lg m-1`}
            style={position}
          >
            <div className="w-full h-full p-2 overflow-hidden">
              <div className="text-center">
                <div className="font-bold text-sm mb-2">Sidebar</div>
                <div className="text-xs opacity-90">{config.width}×{config.height}</div>
              </div>
            </div>
          </div>
        );

      case 'mainContent':
        return (
          <div
            key={key}
            className={`${baseClasses} bg-green-500 text-white rounded-lg m-1`}
            style={position}
          >
            <div className="w-full h-full p-4 overflow-hidden">
              {currentView === 'chat' ? (
                messages.length > 0 ? (
                  <div className="w-full h-full">
                    <div className="text-center mb-4">
                      <div className="font-bold text-lg">Main Content</div>
                      <div className="text-sm opacity-90">{config.width}×{config.height}</div>
                    </div>
                    <div className="text-xs opacity-80">Chat messages would appear here...</div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="font-bold text-lg">Main Content</div>
                      <div className="text-sm opacity-90">{config.width}×{config.height}</div>
                      <div className="text-xs opacity-80 mt-2">Welcome screen would appear here</div>
                    </div>
                  </div>
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="font-bold text-lg">Main Content</div>
                    <div className="text-sm opacity-90">{config.width}×{config.height}</div>
                    <div className="text-xs opacity-80 mt-2">Game section would appear here</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'inputBox':
        return (
          <div
            key={key}
            className={`${baseClasses} bg-orange-500 text-white rounded-lg m-1`}
            style={position}
          >
            <div className="w-full h-full p-2 flex items-center justify-center">
              <div className="text-center">
                <div className="font-bold text-sm">Input Box</div>
                <div className="text-xs opacity-90">{config.width}×{config.height}</div>
              </div>
            </div>
          </div>
        );

      case 'accountPanel':
        return (
          <div
            key={key}
            className={`${baseClasses} bg-yellow-500 text-white rounded-lg m-1 cursor-pointer hover:opacity-90`}
            style={position}
            onClick={onToggleAccount}
          >
            <div className="text-center">
              <div className="font-bold text-xs">Account Panel</div>
              <div className="text-xs opacity-90">{config.width}×{config.height}</div>
            </div>
          </div>
        );

      case 'loginButton':
        return (
          <div
            key={key}
            className={`${baseClasses} bg-blue-600 text-white rounded-lg m-1 cursor-pointer hover:opacity-90`}
            style={position}
            onClick={onShowLogin}
          >
            <div className="text-center">
              <LogIn className="w-4 h-4 mx-auto mb-1" />
              <div className="font-bold text-xs">Login Button</div>
              <div className="text-xs opacity-90">{config.width}×{config.height}</div>
            </div>
          </div>
        );

      case 'signupButton':
        return (
          <div
            key={key}
            className={`${baseClasses} bg-green-600 text-white rounded-lg m-1 cursor-pointer hover:opacity-90`}
            style={position}
            onClick={onShowSignup}
          >
            <div className="text-center">
              <UserPlus className="w-4 h-4 mx-auto mb-1" />
              <div className="font-bold text-xs">Signup Button</div>
              <div className="text-xs opacity-90">{config.width}×{config.height}</div>
            </div>
          </div>
        );

      case 'accountButton':
        return (
          <div
            key={key}
            className={`${baseClasses} bg-orange-600 text-white rounded-lg m-1 cursor-pointer hover:opacity-90`}
            style={position}
            onClick={onToggleAccount}
          >
            <div className="text-center">
              <User className="w-4 h-4 mx-auto mb-1" />
              <div className="font-bold text-xs">Account Button</div>
              <div className="text-xs opacity-90">{config.width}×{config.height}</div>
            </div>
          </div>
        );

      case 'themeToggle':
        return (
          <div
            key={key}
            className={`${baseClasses} bg-teal-600 text-white rounded-lg m-1 cursor-pointer hover:opacity-90`}
            style={position}
            onClick={onToggleTheme}
          >
            <div className="text-center">
              {isDark ? <Sun className="w-4 h-4 mx-auto mb-1" /> : <Moon className="w-4 h-4 mx-auto mb-1" />}
              <div className="font-bold text-xs">Theme Toggle</div>
              <div className="text-xs opacity-90">{config.width}×{config.height}</div>
            </div>
          </div>
        );

      case 'settingsButton':
        return (
          <div
            key={key}
            className={`${baseClasses} bg-teal-600 text-white rounded-lg m-1 cursor-pointer hover:opacity-90`}
            style={position}
          >
            <div className="text-center">
              <Settings className="w-4 h-4 mx-auto mb-1" />
              <div className="font-bold text-xs">Settings Button</div>
              <div className="text-xs opacity-90">{config.width}×{config.height}</div>
            </div>
          </div>
        );

      case 'designerButton':
        return (
          <div
            key={key}
            className={`${baseClasses} bg-pink-600 text-white rounded-lg m-1 cursor-pointer hover:opacity-90`}
            style={position}
            onClick={onToggleDesigner}
          >
            <div className="text-center">
              <Edit3 className="w-4 h-4 mx-auto mb-1" />
              <div className="font-bold text-xs">Designer Button</div>
              <div className="text-xs opacity-90">{config.width}×{config.height}</div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div 
      className={`w-full h-screen relative ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}
      style={{
        fontFamily: customization.fontFamily
      }}
    >
      {/* Grid Background (optional, for debugging) */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        {Array.from({ length: GRID_COLS * GRID_ROWS }).map((_, i) => (
          <div 
            key={i} 
            className={`absolute border ${isDark ? 'border-gray-600' : 'border-gray-400'}`}
            style={{
              left: `${((i % GRID_COLS) / GRID_COLS) * 100}%`,
              top: `${(Math.floor(i / GRID_COLS) / GRID_ROWS) * 100}%`,
              width: `${(1 / GRID_COLS) * 100}%`,
              height: `${(1 / GRID_ROWS) * 100}%`
            }}
          />
        ))}
      </div>

      {/* Render all grid elements */}
      {Object.entries(layout)
        .sort(([, a], [, b]) => (a as any).zIndex - (b as any).zIndex)
        .map(([key, config]) => renderGridElement(key as keyof ExtendedLayoutConfig, config))}
    </div>
  );
};

export default GridLayout; 