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
  const [selectedElement, setSelectedElement] = useState<keyof MobileLayoutConfig | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, elementX: 0, elementY: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, elementWidth: 0, elementHeight: 0 });
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  const resetLayout = () => {
    onMobileLayoutChange(defaultMobileLayout);
  };

  const handleTouchStart = (e: React.TouchEvent, elementKey: keyof MobileLayoutConfig) => {
    e.preventDefault();
    e.stopPropagation();
    
    const touch = e.touches[0];
    const element = mobileLayout[elementKey];
    
    setSelectedElement(elementKey);
    
    // Clear any existing timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
    }
    
    // Set up for dragging
    setDragStart({
      x: touch.clientX,
      y: touch.clientY,
      elementX: element.x,
      elementY: element.y
    });
    
    setResizeStart({
      x: touch.clientX,
      y: touch.clientY,
      elementWidth: element.width,
      elementHeight: element.height
    });
    
    // Long press timer for resize mode (500ms)
    const timer = setTimeout(() => {
      setIsResizing(true);
      if (navigator.vibrate) {
        navigator.vibrate(100); // Vibration feedback
      }
    }, 500);
    
    setLongPressTimer(timer);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !selectedElement) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const touch = e.touches[0];
    const element = mobileLayout[selectedElement];
    
    // Clear long press timer if user moves (prevents accidental resize)
    const deltaX = Math.abs(touch.clientX - dragStart.x);
    const deltaY = Math.abs(touch.clientY - dragStart.y);
    if ((deltaX > 10 || deltaY > 10) && longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    if (isResizing) {
      // RESIZE MODE
      const widthDelta = Math.round((touch.clientX - resizeStart.x) / 20); // Rough grid calculation
      const heightDelta = Math.round((touch.clientY - resizeStart.y) / 20);
      
      const newWidth = Math.max(1, Math.min(20, resizeStart.elementWidth + widthDelta));
      const newHeight = Math.max(1, Math.min(15, resizeStart.elementHeight + heightDelta));
      
      // Make sure element doesn't go out of bounds
      const maxWidth = 20 - element.x;
      const maxHeight = 15 - element.y;
      
      const updatedLayout = {
        ...mobileLayout,
        [selectedElement]: {
          ...element,
          width: Math.min(newWidth, maxWidth),
          height: Math.min(newHeight, maxHeight)
        }
      };
      
      onMobileLayoutChange(updatedLayout);
    } else {
      // MOVE MODE
      const gridDeltaX = Math.round((touch.clientX - dragStart.x) / 20); // Rough grid calculation
      const gridDeltaY = Math.round((touch.clientY - dragStart.y) / 20);
      
      const newX = Math.max(0, Math.min(20 - element.width, dragStart.elementX + gridDeltaX));
      const newY = Math.max(0, Math.min(15 - element.height, dragStart.elementY + gridDeltaY));
      
      const updatedLayout = {
        ...mobileLayout,
        [selectedElement]: {
          ...element,
          x: newX,
          y: newY
        }
      };
      
      onMobileLayoutChange(updatedLayout);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    setIsDragging(false);
    setIsResizing(false);
  };

  return (
    <div className={`h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Header */}
      <div 
        className="h-16 flex items-center justify-between px-4 text-white"
        style={{
          background: customization.gradientEnabled 
            ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
            : customization.primaryColor
        }}
      >
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Mobile Designer</h1>
          <span className="text-xs">Elements: {Object.keys(mobileLayout).length}</span>
          {isResizing && <span className="text-xs bg-yellow-500 px-2 py-1 rounded">RESIZE MODE</span>}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetLayout}
            className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg"
          >
            Reset
          </button>
          <button
            onClick={onExitDesigner}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="h-full bg-red-200 relative" style={{ height: 'calc(100vh - 64px)' }}>
        
        {/* Instructions */}
        <div className="absolute top-2 right-2 bg-black/80 text-white p-2 rounded text-xs z-50">
          Tap to select • Drag to move • Hold 0.5s + drag to resize
        </div>

        {/* Grid Background */}
        <div className="absolute inset-0 opacity-30">
          {Array.from({ length: 21 }).map((_, i) => (
            <div
              key={`v-${i}`}
              className="absolute top-0 bottom-0 w-px bg-black"
              style={{ left: `${(i / 20) * 100}%` }}
            />
          ))}
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={`h-${i}`}
              className="absolute left-0 right-0 h-px bg-black"
              style={{ top: `${(i / 15) * 100}%` }}
            />
          ))}
        </div>

        {/* Mobile Elements */}
        {Object.entries(mobileLayout).map(([key, config]) => {
          const isSelected = selectedElement === key;
          const elementKey = key as keyof MobileLayoutConfig;
          
          return (
            <div
              key={key}
              className={`absolute p-2 cursor-move border-2 ${
                isSelected 
                  ? (isResizing ? 'border-yellow-400 bg-yellow-100' : 'border-blue-400 bg-blue-100')
                  : 'border-gray-400 bg-white hover:border-blue-300'
              }`}
              style={{
                left: `${(config.x / 20) * 100}%`,
                top: `${(config.y / 15) * 100}%`,
                width: `${(config.width / 20) * 100}%`,
                height: `${(config.height / 15) * 100}%`,
                minWidth: '60px',
                minHeight: '40px',
                zIndex: isSelected ? 999 : config.zIndex,
                touchAction: 'none' // Prevent default touch behaviors
              }}
              onTouchStart={(e) => handleTouchStart(e, elementKey)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="text-xs font-bold text-center truncate">
                {key.replace('mobile', '')}
              </div>
              <div className="text-xs text-gray-500 text-center">
                {config.width}×{config.height}
              </div>
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MobileDesignerMode; 