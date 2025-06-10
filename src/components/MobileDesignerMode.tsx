import React, { useState, useRef } from 'react';
import { X, RotateCcw, Save, Sun, Moon, Move, Maximize2, Menu, User, LogIn } from 'lucide-react';
import { CustomizationSettings } from '../App';
import { MobileLayoutConfig, defaultMobileLayout } from '../lib/auth-integration';
import ThemeToggle from './ThemeToggle';

interface MobileDesignerModeProps {
  isDark: boolean;
  mobileLayout: MobileLayoutConfig;
  onMobileLayoutChange: (layout: MobileLayoutConfig) => void;
  onExitDesigner: () => void;
  onToggleTheme: () => void;
  customization: CustomizationSettings;
  onCustomizationChange: (settings: Partial<CustomizationSettings>) => void;
  isAuthenticated: boolean;
}

interface DragState {
  isDragging: boolean;
  isResizing: boolean;
  element: keyof MobileLayoutConfig | null;
  startX: number;
  startY: number;
  startGridX: number;
  startGridY: number;
  resizeDirection: string | null;
  initialElementX: number;
  initialElementY: number;
  initialElementWidth: number;
  initialElementHeight: number;
}

interface MobileInteraction {
  mode: 'move' | 'resize' | null;
  startTime: number;
  longPressTimer: NodeJS.Timeout | null;
}

const MobileDesignerMode: React.FC<MobileDesignerModeProps> = ({
  isDark,
  mobileLayout,
  onMobileLayoutChange,
  onExitDesigner,
  onToggleTheme,
  customization,
  onCustomizationChange,
  isAuthenticated
}) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    isResizing: false,
    element: null,
    startX: 0,
    startY: 0,
    startGridX: 0,
    startGridY: 0,
    resizeDirection: null,
    initialElementX: 0,
    initialElementY: 0,
    initialElementWidth: 0,
    initialElementHeight: 0
  });

  const [selectedElement, setSelectedElement] = useState<keyof MobileLayoutConfig | null>(null);
  const [mobileInteraction, setMobileInteraction] = useState<MobileInteraction>({
    mode: null,
    startTime: 0,
    longPressTimer: null
  });
  const gridRef = useRef<HTMLDivElement>(null);
  const elementRefs = useRef<{ [key in keyof MobileLayoutConfig]?: HTMLDivElement | null }>({});

  const GRID_COLS = 20;
  const GRID_ROWS = 15;

  // Helper to check if in resize mode
  const isResizeMode = mobileInteraction.mode === 'resize';

  const getGridPosition = (clientX: number, clientY: number) => {
    if (!gridRef.current) return { x: 0, y: 0 };
    
    const rect = gridRef.current.getBoundingClientRect();
    const x = Math.floor(((clientX - rect.left) / rect.width) * GRID_COLS);
    const y = Math.floor(((clientY - rect.top) / rect.height) * GRID_ROWS);
    
    return { 
      x: Math.max(0, Math.min(GRID_COLS - 1, x)), 
      y: Math.max(0, Math.min(GRID_ROWS - 1, y)) 
    };
  };

  const handleTouchStart = (e: React.TouchEvent, element: keyof MobileLayoutConfig) => {
    e.preventDefault();
    e.stopPropagation();
    
    const touch = e.touches[0];
    const { x, y } = getGridPosition(touch.clientX, touch.clientY);
    const currentElement = mobileLayout[element];
    
    setSelectedElement(element);
    
    // Clear any existing timer
    if (mobileInteraction.longPressTimer) {
      clearTimeout(mobileInteraction.longPressTimer);
    }
    
    // Set up long press detection for resize mode (reduced to 250ms for better UX)
    const longPressTimer = setTimeout(() => {
      setMobileInteraction(prev => ({ ...prev, mode: 'resize' }));
      // Vibrate if available - stronger feedback for resize mode
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]); // Longer vibration pattern
      }
    }, 250); // Even faster activation
    
    setMobileInteraction({
      mode: 'move',
      startTime: Date.now(),
      longPressTimer
    });
    
    setDragState({
      isDragging: true,
      isResizing: false,
      element,
      startX: touch.clientX,
      startY: touch.clientY,
      startGridX: x,
      startGridY: y,
      resizeDirection: null,
      initialElementX: currentElement.x,
      initialElementY: currentElement.y,
      initialElementWidth: currentElement.width,
      initialElementHeight: currentElement.height
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragState.isDragging || !dragState.element) return;
    
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    const touch = e.touches[0];
    const currentElement = mobileLayout[dragState.element];
    
    // Clear long press timer if user starts moving (to prevent accidental resize mode)
    if (mobileInteraction.longPressTimer) {
      const deltaX = Math.abs(touch.clientX - dragState.startX);
      const deltaY = Math.abs(touch.clientY - dragState.startY);
      if (deltaX > 10 || deltaY > 10) { // Movement threshold
        clearTimeout(mobileInteraction.longPressTimer);
        setMobileInteraction(prev => ({ ...prev, longPressTimer: null }));
      }
    }
    
    if (mobileInteraction.mode === 'move') {
      // MOVE MODE - Smoother grid positioning
      const { x: currentGridX, y: currentGridY } = getGridPosition(touch.clientX, touch.clientY);
      const deltaX = currentGridX - dragState.startGridX;
      const deltaY = currentGridY - dragState.startGridY;
      
      const newX = Math.max(0, Math.min(GRID_COLS - currentElement.width, dragState.initialElementX + deltaX));
      const newY = Math.max(0, Math.min(GRID_ROWS - currentElement.height, dragState.initialElementY + deltaY));

      const updatedLayout = {
        ...mobileLayout,
        [dragState.element]: {
          ...currentElement,
          x: newX,
          y: newY
        }
      };
      
      onMobileLayoutChange(updatedLayout);
    } else if (mobileInteraction.mode === 'resize') {
      // RESIZE MODE - More granular control
      const gridRect = gridRef.current?.getBoundingClientRect();
      if (!gridRect) return;
      
      const deltaX = touch.clientX - dragState.startX;
      const deltaY = touch.clientY - dragState.startY;
      
      // More precise grid delta calculation
      const gridDeltaX = Math.round(deltaX / (gridRect.width / GRID_COLS));
      const gridDeltaY = Math.round(deltaY / (gridRect.height / GRID_ROWS));
      
      // Allow more granular resizing with 0.5 grid increments
      const newWidth = Math.max(1, Math.min(GRID_COLS, dragState.initialElementWidth + gridDeltaX));
      const newHeight = Math.max(1, Math.min(GRID_ROWS, dragState.initialElementHeight + gridDeltaY));
      
      // Ensure element doesn't exceed grid bounds
      const maxWidth = GRID_COLS - currentElement.x;
      const maxHeight = GRID_ROWS - currentElement.y;
      
      const updatedLayout = {
        ...mobileLayout,
        [dragState.element]: {
          ...currentElement,
          width: Math.min(newWidth, maxWidth),
          height: Math.min(newHeight, maxHeight)
        }
      };
      
      onMobileLayoutChange(updatedLayout);
    }
  };

  const handleTouchEnd = () => {
    // Clear long press timer
    if (mobileInteraction.longPressTimer) {
      clearTimeout(mobileInteraction.longPressTimer);
    }
    
    setDragState({
      isDragging: false,
      isResizing: false,
      element: null,
      startX: 0,
      startY: 0,
      startGridX: 0,
      startGridY: 0,
      resizeDirection: null,
      initialElementX: 0,
      initialElementY: 0,
      initialElementWidth: 0,
      initialElementHeight: 0
    });
    
    setMobileInteraction({
      mode: null,
      startTime: 0,
      longPressTimer: null
    });
  };

  const resetLayout = () => {
    onMobileLayoutChange(defaultMobileLayout);
  };

  const getElementDisplayName = (element: keyof MobileLayoutConfig): string => {
    const names: Record<keyof MobileLayoutConfig, string> = {
      mobileHeader: 'Header',
      mobileMenuButton: 'Menu Button',
      mobileAppLogo: 'App Logo',
      mobileThemeToggle: 'Theme Toggle',
      mobileAuthButton: 'Auth Button',
      mobileMainContent: 'Main Content',
      mobileChatArea: 'Chat Area',
      mobileInputBox: 'Input Box',
      mobileNewChat: 'New Chat',
      mobileNewGame: 'New Game',
      mobileSearch: 'Search',
      mobileDesignerMode: 'Designer Mode'
    };
    return names[element] || element;
  };

  // Debug logging
  console.log('MobileDesignerMode - Received mobileLayout:', mobileLayout);
  console.log('MobileDesignerMode - Layout keys:', Object.keys(mobileLayout));
  console.log('MobileDesignerMode - Layout entries:', Object.entries(mobileLayout));

  return (
    <div className={`h-screen overflow-hidden ${isDark ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      {/* Designer Header */}
      <div 
        className="h-16 flex items-center justify-between px-4 text-white"
        style={{
          background: customization.gradientEnabled 
            ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
            : customization.primaryColor
        }}
      >
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold" style={{ fontFamily: customization.fontFamily }}>
            Mobile Designer
          </h1>
          <span className="text-xs opacity-90" style={{ fontFamily: customization.fontFamily }}>
            Tap to select • Drag to move • Hold 0.25s & drag to resize
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetLayout}
            className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
            style={{ fontFamily: customization.fontFamily }}
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>

          <button
            onClick={() => {
              console.log('Mobile Designer - Current layout on exit:', mobileLayout);
              onMobileLayoutChange(mobileLayout);
              onExitDesigner();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
            style={{ fontFamily: customization.fontFamily }}
          >
            <Save className="w-4 h-4" />
            Save & Exit
          </button>
        </div>
      </div>

      {/* Design Canvas */}
      <div className="flex-1 relative overflow-hidden">
        {/* Mobile Preview Container */}
        <div 
          ref={gridRef}
          className={`relative w-full h-full overflow-auto border-2 border-dashed ${isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-50'}`}
          style={{
            background: `
              ${isDark ? '#1f2937' : '#f9fafb'},
              linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)
            `,
            backgroundSize: `auto, ${100/GRID_COLS}% ${100/GRID_ROWS}%`,
            minHeight: '100%'
          }}
          onTouchStart={(e) => {
            // Only clear selection if touching the grid background
            if (e.target === e.currentTarget) {
              setSelectedElement(null);
              setMobileInteraction({ mode: null, startTime: 0, longPressTimer: null });
            }
          }}
        >
          {/* Grid Lines */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: GRID_COLS + 1 }).map((_, i) => (
              <div
                key={`v-${i}`}
                className="absolute top-0 bottom-0 border-l border-gray-200 dark:border-gray-700"
                style={{ left: `${(i / GRID_COLS) * 100}%` }}
              />
            ))}
            {Array.from({ length: GRID_ROWS + 1 }).map((_, i) => (
              <div
                key={`h-${i}`}
                className="absolute left-0 right-0 border-t border-gray-200 dark:border-gray-700"
                style={{ top: `${(i / GRID_ROWS) * 100}%` }}
              />
            ))}
          </div>

          {/* Test Element - Always visible for debugging */}
          <div 
            className="absolute top-4 left-4 w-20 h-16 bg-red-500 text-white text-xs flex items-center justify-center z-[999]"
            style={{ border: '2px solid yellow' }}
          >
            TEST
          </div>

          {/* Preview Elements */}
          {Object.entries(mobileLayout).length > 0 ? (
            Object.entries(mobileLayout).map(([elementKey, elementConfig]) => {
              if (!elementConfig) {
                console.log(`⚠️ Element ${elementKey} has no config`);
                return null;
              }

              const elementKey2 = elementKey as keyof MobileLayoutConfig;
              const isSelected = selectedElement === elementKey2;

              console.log(`🎯 Rendering element ${elementKey}:`, {
                x: elementConfig.x,
                y: elementConfig.y,
                width: elementConfig.width,
                height: elementConfig.height,
                leftPercent: (elementConfig.x / GRID_COLS) * 100,
                topPercent: (elementConfig.y / GRID_ROWS) * 100,
                widthPercent: (elementConfig.width / GRID_COLS) * 100,
                heightPercent: (elementConfig.height / GRID_ROWS) * 100
              });

              return (
                <div
                  key={elementKey}
                  ref={el => elementRefs.current[elementKey2] = el}
                  className={`absolute border-2 transition-all ${
                    isSelected 
                      ? (isResizeMode ? 'border-yellow-400' : 'border-blue-400')
                      : 'border-transparent hover:border-gray-400'
                  } ${isSelected ? 'shadow-lg' : ''}`}
                  style={{
                    left: `${(elementConfig.x / GRID_COLS) * 100}%`,
                    top: `${(elementConfig.y / GRID_ROWS) * 100}%`,
                    width: `${(elementConfig.width / GRID_COLS) * 100}%`,
                    height: `${(elementConfig.height / GRID_ROWS) * 100}%`,
                    zIndex: isSelected ? 1000 : elementConfig.zIndex,
                    minHeight: '40px',
                    minWidth: '40px'
                  }}
                  onTouchStart={(e) => handleTouchStart(e, elementKey2)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {/* Element Preview Content */}
                  <div className={`w-full h-full overflow-hidden ${
                    isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                  } ${elementKey2.includes('Button') || elementKey2.includes('Toggle') || elementKey2.includes('Logo') ? 'flex items-center justify-center' : ''}`}>
                    
                    {/* Header */}
                    {elementKey2 === 'mobileHeader' && (
                      <div className={`w-full h-full ${isDark ? 'bg-gray-800' : 'bg-white'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-center px-2`}>
                        <span className="text-sm font-medium">Header Area</span>
                      </div>
                    )}

                    {/* Menu Button */}
                    {elementKey2 === 'mobileMenuButton' && (
                      <div className="p-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </div>
                    )}

                    {/* App Logo */}
                    {elementKey2 === 'mobileAppLogo' && (
                      <span className="text-sm font-bold text-center px-1">BelloSai</span>
                    )}

                    {/* Theme Toggle */}
                    {elementKey2 === 'mobileThemeToggle' && (
                      <div className="p-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12,9c1.65,0 3,1.35 3,3s-1.35,3 -3,3s-3,-1.35 -3,-3S10.35,9 12,9M12,7c-2.76,0 -5,2.24 -5,5s2.24,5 5,5s5,-2.24 5,-5S14.76,7 12,7L12,7z"/>
                        </svg>
                      </div>
                    )}

                    {/* Auth Button */}
                    {elementKey2 === 'mobileAuthButton' && (
                      <div className="px-3 py-1 text-xs text-white rounded" style={{ backgroundColor: customization.primaryColor }}>
                        Login
                      </div>
                    )}

                    {/* Main Content */}
                    {elementKey2 === 'mobileMainContent' && (
                      <div className={`w-full h-full ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
                        <div className="text-center p-4">
                          <h2 className="text-lg font-semibold mb-2">Main Content Area</h2>
                          <p className="text-xs opacity-70">Your main interface will appear here</p>
                        </div>
                      </div>
                    )}

                    {/* Chat Area */}
                    {elementKey2 === 'mobileChatArea' && (
                      <div className={`w-full h-full ${isDark ? 'bg-gray-900' : 'bg-gray-50'} p-2 overflow-hidden`}>
                        <div className="space-y-2">
                          <div className={`p-2 rounded text-xs ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                            <span className="opacity-70">Sample message</span>
                          </div>
                          <div className="flex justify-end">
                            <div className="p-2 rounded text-xs text-white" style={{ backgroundColor: customization.primaryColor }}>
                              <span>Your message</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Input Box */}
                    {elementKey2 === 'mobileInputBox' && (
                      <div className="p-2 h-full flex items-end">
                        <div className={`w-full p-2 rounded border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} text-xs`}>
                          <span className="opacity-50">Type a message...</span>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {(elementKey2 === 'mobileNewChat' || elementKey2 === 'mobileNewGame' || elementKey2 === 'mobileSearch' || elementKey2 === 'mobileDesignerMode') && (
                      <div className="p-1">
                        <div className="text-xs text-white px-2 py-1 rounded" style={{ backgroundColor: customization.primaryColor }}>
                          {getElementDisplayName(elementKey2)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Element Label */}
                  {isSelected && (
                    <div className="absolute -top-6 left-0 bg-black text-white text-xs px-2 py-1 rounded z-50">
                      {getElementDisplayName(elementKey2)}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p>No mobile layout elements found</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileDesignerMode; 