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

  const GRID_COLS = 20;
  const GRID_ROWS = 15;

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
    
    // Set up long press detection for resize mode
    const longPressTimer = setTimeout(() => {
      setMobileInteraction(prev => ({ ...prev, mode: 'resize' }));
      // Vibrate if available
      if (navigator.vibrate) {
        navigator.vibrate([50, 50, 50]);
      }
    }, 300);
    
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
    const touch = e.touches[0];
    const currentElement = mobileLayout[dragState.element];
    
    if (mobileInteraction.mode === 'move') {
      // MOVE MODE
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
      // RESIZE MODE
      const deltaX = Math.floor((touch.clientX - dragState.startX) / 40); // Rough grid size
      const deltaY = Math.floor((touch.clientY - dragState.startY) / 40);
      
      const newWidth = Math.max(1, Math.min(GRID_COLS, dragState.initialElementWidth + deltaX));
      const newHeight = Math.max(1, Math.min(GRID_ROWS, dragState.initialElementHeight + deltaY));
      
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
      mobileNewChat: 'New Chat',
      mobileNewGame: 'New Game',
      mobileSearch: 'Search',
      mobileDesignerMode: 'Designer Mode'
    };
    return names[element] || element;
  };

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
            Tap to select • Drag to move • Hold 0.3s & drag to resize
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

      {/* Mobile Grid Preview */}
      <div 
        ref={gridRef}
        className="h-full w-full grid relative bg-white dark:bg-gray-800"
        style={{
          gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
          paddingTop: '64px' // Account for header
        }}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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

        {/* Mobile UI Elements */}
        {(Object.entries(mobileLayout) as [keyof MobileLayoutConfig, any][]).map(([key, config]) => (
          <div
            key={key}
            className={`
              relative border-2 transition-all cursor-move flex items-center justify-center
              ${selectedElement === key 
                ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/50' 
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-blue-300'
              }
            `}
            style={{
              gridColumn: `${config.x + 1} / ${config.x + config.width + 1}`,
              gridRow: `${config.y + 1} / ${config.y + config.height + 1}`,
              zIndex: config.zIndex
            }}
            onTouchStart={(e) => handleTouchStart(e, key)}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedElement(key);
            }}
          >
            <div className="text-center p-2">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {getElementDisplayName(key)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {config.width}×{config.height}
              </div>
              
              {selectedElement === key && mobileInteraction.mode && (
                <div className={`text-xs mt-1 flex items-center justify-center gap-1 px-2 py-1 rounded ${
                  mobileInteraction.mode === 'resize' ? 'bg-yellow-500' : 'bg-blue-500'
                }`}>
                  {mobileInteraction.mode === 'move' && (
                    <>
                      <Move className="w-3 h-3" />
                      <span className="font-bold">MOVE</span>
                    </>
                  )}
                  {mobileInteraction.mode === 'resize' && (
                    <>
                      <Maximize2 className="w-3 h-3" />
                      <span className="font-bold">RESIZE</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Show preview of actual element */}
            {key === 'mobileHeader' && (
              <div className="absolute inset-1 bg-purple-600 text-white flex items-center justify-between px-2 text-xs rounded">
                <Menu className="w-4 h-4" />
                <span>BelloSai</span>
                <User className="w-4 h-4" />
              </div>
            )}
            {key === 'mobileMainContent' && (
              <div className="absolute inset-1 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                <div className="text-gray-500 text-xs">Chat Content</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MobileDesignerMode; 