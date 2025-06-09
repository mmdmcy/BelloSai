import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import MainContent from './components/MainContent';
import ThemeToggle from './components/ThemeToggle';
import DesignerMode from './components/DesignerMode';
import AccountMenu from './components/AccountMenu';
import GameSection from './components/GameSection';

export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export interface LayoutConfig {
  sidebar: { x: number; y: number; width: number; height: number; zIndex: number };
  mainContent: { x: number; y: number; width: number; height: number; zIndex: number };
  themeToggle: { x: number; y: number; width: number; height: number; zIndex: number };
  topBar: { x: number; y: number; width: number; height: number; zIndex: number };
  inputBox: { x: number; y: number; width: number; height: number; zIndex: number };
  designerButton: { x: number; y: number; width: number; height: number; zIndex: number };
  settingsButton: { x: number; y: number; width: number; height: number; zIndex: number };
}

export interface CustomizationSettings {
  showQuestions: boolean;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  gradientEnabled: boolean;
  gradientColors: string[];
}

function App() {
  const [isDark, setIsDark] = useState(false);
  const [isDesignerMode, setIsDesignerMode] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState<'chat' | 'game'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedModel, setSelectedModel] = useState('Gemini 2.5 Flash');
  const [messageCount, setMessageCount] = useState(0);

  const [customization, setCustomization] = useState<CustomizationSettings>({
    showQuestions: true,
    primaryColor: '#7c3aed',
    secondaryColor: '#a855f7',
    fontFamily: 'Inter',
    gradientEnabled: false,
    gradientColors: ['#7c3aed', '#a855f7']
  });

  const [layout, setLayout] = useState<LayoutConfig>({
    sidebar: { x: 0, y: 1, width: 3, height: 15, zIndex: 1 },
    mainContent: { x: 3, y: 1, width: 15, height: 12, zIndex: 1 },
    themeToggle: { x: 17, y: 0, width: 1, height: 1, zIndex: 4 },
    topBar: { x: 0, y: 0, width: 20, height: 1, zIndex: 2 },
    inputBox: { x: 4, y: 13, width: 12, height: 3, zIndex: 1 },
    designerButton: { x: 19, y: 0, width: 1, height: 1, zIndex: 999 },
    settingsButton: { x: 18, y: 0, width: 1, height: 1, zIndex: 4 }
  });

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const toggleDesignerMode = () => {
    setIsDesignerMode(!isDesignerMode);
  };

  const toggleAccountMenu = () => {
    setIsAccountMenuOpen(!isAccountMenuOpen);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const sendMessage = (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessageCount(prev => prev + 1);

    // Simulate AI response after a short delay
    setTimeout(() => {
      let aiResponse: Message;
      
      if (messageCount === 0) {
        // First response
        aiResponse = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: 'Hello! How can I help you today?',
          timestamp: new Date()
        };
      } else {
        // Second and subsequent responses with code
        aiResponse = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: 'Here\'s a simple Python "Hello, World!" script:\n\n```python\nprint("Hello, world!")\n```',
          timestamp: new Date()
        };
      }

      setMessages(prev => [...prev, aiResponse]);
    }, 500);
  };

  const availableModels = [
    'Gemini 2.5 Flash',
    'GPT-4 Turbo',
    'Claude 3.5 Sonnet',
    'Llama 3.1 70B',
    'Mistral Large'
  ];

  const updateLayout = (newLayout: LayoutConfig) => {
    // Ensure designer button always stays at top layer
    const updatedLayout = {
      ...newLayout,
      designerButton: {
        ...newLayout.designerButton,
        zIndex: 999
      }
    };
    setLayout(updatedLayout);
  };

  const updateCustomization = (newSettings: Partial<CustomizationSettings>) => {
    setCustomization(prev => ({ ...prev, ...newSettings }));
  };

  const handleBackToChat = () => {
    setCurrentView('chat');
  };

  const handleNewGame = () => {
    setCurrentView('game');
  };

  if (isDesignerMode) {
    return (
      <DesignerMode
        isDark={isDark}
        layout={layout}
        onLayoutChange={updateLayout}
        onExitDesigner={() => setIsDesignerMode(false)}
        onToggleTheme={toggleTheme}
        customization={customization}
        onCustomizationChange={updateCustomization}
      />
    );
  }

  // Show game section
  if (currentView === 'game') {
    return (
      <GameSection
        isDark={isDark}
        customization={customization}
        onBackToChat={handleBackToChat}
        onToggleTheme={toggleTheme}
      />
    );
  }

  // Calculate the actual used grid area to eliminate empty space
  const getUsedGridArea = () => {
    const elements = Object.values(layout);
    const maxX = Math.max(...elements.map(el => el.x + el.width));
    const maxY = Math.max(...elements.map(el => el.y + el.height));
    return { maxX, maxY };
  };

  const { maxX, maxY } = getUsedGridArea();

  return (
    <div 
      className={`h-screen overflow-hidden ${isDark ? 'dark bg-gray-900' : 'bg-purple-50'}`}
      style={{ fontFamily: customization.fontFamily }}
    >
      {/* Dynamic Grid Container - only uses necessary space */}
      <div 
        className="h-full w-full grid"
        style={{
          gridTemplateColumns: `repeat(${maxX}, 1fr)`,
          gridTemplateRows: `repeat(${maxY}, 1fr)`
        }}
      >
        {/* Top Header Bar - Uses gradient when enabled */}
        <div 
          className="text-white"
          style={{
            background: customization.gradientEnabled 
              ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
              : customization.primaryColor,
            gridColumn: `${layout.topBar.x + 1} / ${Math.min(layout.topBar.x + layout.topBar.width + 1, maxX + 1)}`,
            gridRow: `${layout.topBar.y + 1} / ${Math.min(layout.topBar.y + layout.topBar.height + 1, maxY + 1)}`,
            zIndex: layout.topBar.zIndex
          }}
        ></div>
        
        {/* Sidebar */}
        <div 
          style={{
            gridColumn: `${layout.sidebar.x + 1} / ${Math.min(layout.sidebar.x + layout.sidebar.width + 1, maxX + 1)}`,
            gridRow: `${layout.sidebar.y + 1} / ${Math.min(layout.sidebar.y + layout.sidebar.height + 1, maxY + 1)}`,
            zIndex: layout.sidebar.zIndex
          }}
        >
          <Sidebar 
            isDark={isDark} 
            onAccountClick={toggleAccountMenu}
            customization={customization}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={toggleSidebar}
            onSendMessage={sendMessage}
            onNewGame={handleNewGame}
          />
        </div>

        {/* Main Content */}
        <div 
          className={isDark ? 'bg-gray-900' : 'bg-purple-50'}
          style={{
            gridColumn: `${layout.mainContent.x + 1} / ${Math.min(layout.mainContent.x + layout.mainContent.width + 1, maxX + 1)}`,
            gridRow: `${layout.mainContent.y + 1} / ${Math.min(layout.mainContent.y + layout.mainContent.height + 1, maxY + 1)}`,
            zIndex: layout.mainContent.zIndex
          }}
        >
          {messages.length === 0 ? (
            <MainContent 
              isDark={isDark} 
              onSendMessage={sendMessage}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              availableModels={availableModels}
              hideInput={true}
              customization={customization}
            />
          ) : (
            <ChatView 
              isDark={isDark} 
              messages={messages}
              onSendMessage={sendMessage}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              availableModels={availableModels}
              hideInput={true}
              customization={customization}
            />
          )}
        </div>

        {/* Input Box */}
        <div 
          className={`${isDark ? 'bg-gray-900' : 'bg-purple-50'} p-4`}
          style={{
            gridColumn: `${layout.inputBox.x + 1} / ${Math.min(layout.inputBox.x + layout.inputBox.width + 1, maxX + 1)}`,
            gridRow: `${layout.inputBox.y + 1} / ${Math.min(layout.inputBox.y + layout.inputBox.height + 1, maxY + 1)}`,
            zIndex: layout.inputBox.zIndex
          }}
        >
          {messages.length === 0 ? (
            <MainContent 
              isDark={isDark} 
              onSendMessage={sendMessage}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              availableModels={availableModels}
              inputOnly={true}
              customization={customization}
            />
          ) : (
            <ChatView 
              isDark={isDark} 
              messages={messages}
              onSendMessage={sendMessage}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              availableModels={availableModels}
              inputOnly={true}
              customization={customization}
            />
          )}
        </div>

        {/* Theme Toggle - with top bar background */}
        <div 
          className="flex items-center justify-center"
          style={{
            background: customization.gradientEnabled 
              ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
              : customization.primaryColor,
            gridColumn: `${layout.themeToggle.x + 1} / ${Math.min(layout.themeToggle.x + layout.themeToggle.width + 1, maxX + 1)}`,
            gridRow: `${layout.themeToggle.y + 1} / ${Math.min(layout.themeToggle.y + layout.themeToggle.height + 1, maxY + 1)}`,
            zIndex: layout.themeToggle.zIndex
          }}
        >
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
        </div>

        {/* Settings Button */}
        <div 
          className="flex items-center justify-center"
          style={{
            background: customization.gradientEnabled 
              ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
              : customization.primaryColor,
            gridColumn: `${layout.settingsButton.x + 1} / ${Math.min(layout.settingsButton.x + layout.settingsButton.width + 1, maxX + 1)}`,
            gridRow: `${layout.settingsButton.y + 1} / ${Math.min(layout.settingsButton.y + layout.settingsButton.height + 1, maxY + 1)}`,
            zIndex: layout.settingsButton.zIndex
          }}
        >
          <button
            onClick={toggleAccountMenu}
            className={`p-2.5 rounded-lg transition-colors ${
              isDark 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                : 'bg-white text-gray-800 hover:bg-gray-50 border border-white/20'
            }`}
            title="Settings"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/>
            </svg>
          </button>
        </div>

        {/* Designer Mode Toggle - with top bar background and locked to top layer */}
        <div 
          className="flex items-center justify-center"
          style={{
            background: customization.gradientEnabled 
              ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
              : customization.primaryColor,
            gridColumn: `${layout.designerButton.x + 1} / ${Math.min(layout.designerButton.x + layout.designerButton.width + 1, maxX + 1)}`,
            gridRow: `${layout.designerButton.y + 1} / ${Math.min(layout.designerButton.y + layout.designerButton.height + 1, maxY + 1)}`,
            zIndex: 999 // Always on top
          }}
        >
          <button
            onClick={toggleDesignerMode}
            className={`p-2.5 rounded-lg transition-colors ${
              isDark 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                : 'bg-white text-gray-800 hover:bg-gray-50 border border-white/20'
            }`}
            title="Designer Mode"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Account Menu Overlay */}
      {isAccountMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={(e) => {
            // Close menu when clicking outside
            if (e.target === e.currentTarget) {
              setIsAccountMenuOpen(false);
            }
          }}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <AccountMenu
              isDark={isDark}
              onClose={() => setIsAccountMenuOpen(false)}
              customization={customization}
              onCustomizationChange={updateCustomization}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;