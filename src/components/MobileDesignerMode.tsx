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

  const resetLayout = () => {
    onMobileLayoutChange(defaultMobileLayout);
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
        
        {/* Test Box - Should Always Be Visible */}
        <div 
          className="absolute bg-blue-500 text-white p-4 rounded"
          style={{ 
            top: '20px', 
            left: '20px', 
            width: '120px', 
            height: '80px',
            zIndex: 999 
          }}
        >
          TEST BOX
        </div>

        {/* Another Test Box */}
        <div 
          className="absolute bg-green-500 text-white p-4 rounded"
          style={{ 
            top: '120px', 
            left: '20px', 
            width: '120px', 
            height: '80px',
            zIndex: 998 
          }}
        >
          TEST 2
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
        {Object.entries(mobileLayout).map(([key, config]) => (
          <div
            key={key}
            className="absolute bg-white border-2 border-gray-400 p-2 cursor-move"
            style={{
              left: `${(config.x / 20) * 100}%`,
              top: `${(config.y / 15) * 100}%`,
              width: `${(config.width / 20) * 100}%`,
              height: `${(config.height / 15) * 100}%`,
              minWidth: '60px',
              minHeight: '40px',
              zIndex: config.zIndex
            }}
            onClick={() => setSelectedElement(key as keyof MobileLayoutConfig)}
          >
            <div className="text-xs font-bold text-center">
              {key}
            </div>
            <div className="text-xs text-gray-500 text-center">
              {config.width}×{config.height}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MobileDesignerMode; 