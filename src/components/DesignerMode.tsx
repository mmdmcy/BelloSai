import React, { useState, useRef } from 'react';
import { X, RotateCcw, Save, Sun, Moon, Plus, Minus, ChevronUp, ChevronDown, GripVertical, Palette, Type, Eye, EyeOff, Move, Maximize2, Sparkles } from 'lucide-react';
import { CustomizationSettings, Theme } from '../types/app';
import { AVAILABLE_THEMES } from '../theme/registry';
import type { LayoutConfig } from '../lib/auth-integration';
import { defaultLayoutWithAuth, layoutManager, ExtendedLayoutConfig } from '../lib/auth-integration';

interface DesignerModeProps {
  isDark: boolean;
  layout: ExtendedLayoutConfig;
  onLayoutChange: (layout: ExtendedLayoutConfig) => void;
  onExitDesigner: () => void;
  onToggleTheme: () => void;
  customization: CustomizationSettings;
  onCustomizationChange: (settings: Partial<CustomizationSettings>) => void;
  onApplyTheme?: (themeId: string) => void;
}

interface DragState {
  isDragging: boolean;
  isResizing: boolean;
  element: keyof LayoutConfig | null;
  startX: number;
  startY: number;
  startGridX: number;
  startGridY: number;
  resizeDirection: 'width' | 'height' | 'left' | 'top' | null;
  initialElementX: number;
  initialElementY: number;
  initialElementWidth: number;
  initialElementHeight: number;
}

interface LayerDragState {
  isDragging: boolean;
  draggedElement: keyof LayoutConfig | null;
  startY: number;
  dragOverElement: keyof LayoutConfig | null;
}



export default function DesignerMode({ 
  isDark, 
  layout, 
  onLayoutChange, 
  onExitDesigner,
  onToggleTheme,
  customization,
  onCustomizationChange,
  onApplyTheme
}: DesignerModeProps) {
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

  const [layerDragState, setLayerDragState] = useState<LayerDragState>({
    isDragging: false,
    draggedElement: null,
    startY: 0,
    dragOverElement: null
  });

  const [selectedElement, setSelectedElement] = useState<keyof LayoutConfig | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const GRID_COLS = 20;
  const GRID_ROWS = 18;

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

  const handleMouseDown = (e: React.MouseEvent, element: keyof LayoutConfig) => {
    e.preventDefault();
    e.stopPropagation();
    
    const { x, y } = getGridPosition(e.clientX, e.clientY);
    const currentElement = layout[element];
    
    setSelectedElement(element);
    setDragState({
      isDragging: true,
      isResizing: false,
      element,
      startX: e.clientX,
      startY: e.clientY,
      startGridX: x,
      startGridY: y,
      resizeDirection: null,
      initialElementX: currentElement.x,
      initialElementY: currentElement.y,
      initialElementWidth: currentElement.width,
      initialElementHeight: currentElement.height
    });
  };

  const handleResizeStart = (e: React.MouseEvent, element: keyof LayoutConfig, direction: 'width' | 'height' | 'left' | 'top') => {
    e.preventDefault();
    e.stopPropagation();
    
    const currentElement = layout[element];
    
    setSelectedElement(element);
    setDragState({
      isDragging: false,
      isResizing: true,
      element,
      startX: e.clientX,
      startY: e.clientY,
      startGridX: 0,
      startGridY: 0,
      resizeDirection: direction,
      initialElementX: currentElement.x,
      initialElementY: currentElement.y,
      initialElementWidth: currentElement.width,
      initialElementHeight: currentElement.height
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.element) return;

    const currentElement = layout[dragState.element];

    if (dragState.isDragging) {
      // Calculate offset from initial click position
      const { x: currentGridX, y: currentGridY } = getGridPosition(e.clientX, e.clientY);
      const deltaX = currentGridX - dragState.startGridX;
      const deltaY = currentGridY - dragState.startGridY;
      
      // Apply offset to initial element position
      const newX = Math.max(0, Math.min(GRID_COLS - currentElement.width, dragState.initialElementX + deltaX));
      const newY = Math.max(0, Math.min(GRID_ROWS - currentElement.height, dragState.initialElementY + deltaY));

      if (newX !== currentElement.x || newY !== currentElement.y) {
        const updatedLayout = {
          ...layout,
          [dragState.element]: {
            ...currentElement,
            x: newX,
            y: newY
          }
        };
        
        // Ensure designer button stays at top layer
        if (dragState.element === 'designerButton') {
          updatedLayout.designerButton.zIndex = 999;
        }
        
        onLayoutChange(updatedLayout);
      }
    } else if (dragState.isResizing && dragState.resizeDirection) {
      // Handle resizing with improved responsiveness
      const deltaX = e.clientX - dragState.startX;
      const deltaY = e.clientY - dragState.startY;
      
      if (dragState.resizeDirection === 'width') {
        const gridDelta = Math.round(deltaX / (gridRef.current!.getBoundingClientRect().width / GRID_COLS));
        const newWidth = Math.max(1, Math.min(GRID_COLS - currentElement.x, dragState.initialElementWidth + gridDelta));
        
        if (newWidth !== currentElement.width) {
          onLayoutChange({
            ...layout,
            [dragState.element]: {
              ...currentElement,
              width: newWidth
            }
          });
        }
      } else if (dragState.resizeDirection === 'height') {
        const gridDelta = Math.round(deltaY / (gridRef.current!.getBoundingClientRect().height / GRID_ROWS));
        const newHeight = Math.max(1, Math.min(GRID_ROWS - currentElement.y, dragState.initialElementHeight + gridDelta));
        
        if (newHeight !== currentElement.height) {
          onLayoutChange({
            ...layout,
            [dragState.element]: {
              ...currentElement,
              height: newHeight
            }
          });
        }
      } else if (dragState.resizeDirection === 'left') {
        const gridDelta = Math.round(deltaX / (gridRef.current!.getBoundingClientRect().width / GRID_COLS));
        const newX = Math.max(0, dragState.initialElementX + gridDelta);
        const newWidth = Math.max(1, dragState.initialElementWidth - gridDelta);
        
        if (newX !== currentElement.x || newWidth !== currentElement.width) {
          onLayoutChange({
            ...layout,
            [dragState.element]: {
              ...currentElement,
              x: newX,
              width: newWidth
            }
          });
        }
      } else if (dragState.resizeDirection === 'top') {
        const gridDelta = Math.round(deltaY / (gridRef.current!.getBoundingClientRect().height / GRID_ROWS));
        const newY = Math.max(0, dragState.initialElementY + gridDelta);
        const newHeight = Math.max(1, dragState.initialElementHeight - gridDelta);
        
        if (newY !== currentElement.y || newHeight !== currentElement.height) {
          onLayoutChange({
            ...layout,
            [dragState.element]: {
              ...currentElement,
              y: newY,
              height: newHeight
            }
          });
        }
      }
    }
  };

  const handleMouseUp = () => {
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
  };

  const resetLayout = () => {
    // Reset layout to defaults with auth buttons included
    onLayoutChange(defaultLayoutWithAuth);
    
    // Reset customization to defaults
    onCustomizationChange({
      showQuestions: true,
      primaryColor: '#7c3aed',
      secondaryColor: '#a855f7',
      fontFamily: 'Inter',
      gradientEnabled: false,
      gradientColors: ['#7c3aed', '#a855f7']
    });
    
    setSelectedElement(null);
  };

  const adjustElementSize = (element: keyof LayoutConfig, dimension: 'width' | 'height', delta: number) => {
    const currentElement = layout[element];
    const maxWidth = GRID_COLS - currentElement.x;
    const maxHeight = GRID_ROWS - currentElement.y;
    
    let newValue;
    if (dimension === 'width') {
      newValue = Math.max(1, Math.min(maxWidth, currentElement.width + delta));
    } else {
      newValue = Math.max(1, Math.min(maxHeight, currentElement.height + delta));
    }

    onLayoutChange({
      ...layout,
      [element]: {
        ...currentElement,
        [dimension]: newValue
      }
    });
  };

  const adjustZIndex = (element: keyof LayoutConfig, delta: number) => {
    // Don't allow changing designer button z-index
    if (element === 'designerButton') return;
    
    const currentElement = layout[element];
    const newZIndex = Math.max(1, Math.min(10, currentElement.zIndex + delta));

    onLayoutChange({
      ...layout,
      [element]: {
        ...currentElement,
        zIndex: newZIndex
      }
    });
  };

  // Layer reordering functions
  const handleLayerDragStart = (e: React.DragEvent, element: keyof LayoutConfig) => {
    // Don't allow dragging designer button
    if (element === 'designerButton') {
      e.preventDefault();
      return;
    }
    
    setLayerDragState({
      isDragging: true,
      draggedElement: element,
      startY: e.clientY,
      dragOverElement: null
    });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleLayerDragOver = (e: React.DragEvent, element: keyof LayoutConfig) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setLayerDragState(prev => ({
      ...prev,
      dragOverElement: element
    }));
  };

  const handleLayerDrop = (e: React.DragEvent, targetElement: keyof LayoutConfig) => {
    e.preventDefault();
    
    if (!layerDragState.draggedElement || layerDragState.draggedElement === targetElement || targetElement === 'designerButton') {
      setLayerDragState({
        isDragging: false,
        draggedElement: null,
        startY: 0,
        dragOverElement: null
      });
      return;
    }

    const elements = Object.keys(layout).filter(key => key !== 'designerButton') as (keyof LayoutConfig)[];
    const sortedElements = elements.sort((a, b) => layout[b].zIndex - layout[a].zIndex);
    
    const draggedIndex = sortedElements.indexOf(layerDragState.draggedElement);
    const targetIndex = sortedElements.indexOf(targetElement);
    
    // Reorder the array
    const newOrder = [...sortedElements];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, layerDragState.draggedElement);
    
    // Update z-indexes based on new order
    const newLayout = { ...layout };
    newOrder.forEach((element, index) => {
      newLayout[element] = {
        ...newLayout[element],
        zIndex: newOrder.length - index
      };
    });
    
    // Ensure designer button stays at top
    newLayout.designerButton.zIndex = 999;
    
    onLayoutChange(newLayout);
    
    setLayerDragState({
      isDragging: false,
      draggedElement: null,
      startY: 0,
      dragOverElement: null
    });
  };

  const elementColors = {
    sidebar: isDark ? 'bg-blue-600/90' : 'bg-blue-500/90',
    mainContent: isDark ? 'bg-green-600/90' : 'bg-green-500/90',
    themeToggle: isDark ? 'bg-yellow-600/90' : 'bg-yellow-500/90',
    topBar: isDark ? 'bg-purple-600/90' : 'bg-purple-500/90',
    inputBox: isDark ? 'bg-orange-600/90' : 'bg-orange-500/90',
    designerButton: isDark ? 'bg-pink-600/90' : 'bg-pink-500/90',
    settingsButton: isDark ? 'bg-teal-600/90' : 'bg-teal-500/90',
    // New detached components
    appLogo: isDark ? 'bg-indigo-600/90' : 'bg-indigo-500/90',
    newChatButton: isDark ? 'bg-emerald-600/90' : 'bg-emerald-500/90',
    newGameButton: isDark ? 'bg-rose-600/90' : 'bg-rose-500/90',
    searchButton: isDark ? 'bg-cyan-600/90' : 'bg-cyan-500/90',
    accountPanel: isDark ? 'bg-amber-600/90' : 'bg-amber-500/90',
    // Authentication buttons
    loginButton: isDark ? 'bg-blue-700/90' : 'bg-blue-600/90',
    signupButton: isDark ? 'bg-green-700/90' : 'bg-green-600/90',
    accountButton: isDark ? 'bg-orange-700/90' : 'bg-orange-600/90'
  };

  const selectedColors = {
    sidebar: isDark ? 'bg-blue-500' : 'bg-blue-600',
    mainContent: isDark ? 'bg-green-500' : 'bg-green-600',
    themeToggle: isDark ? 'bg-yellow-500' : 'bg-yellow-600',
    topBar: isDark ? 'bg-purple-500' : 'bg-purple-600',
    inputBox: isDark ? 'bg-orange-500' : 'bg-orange-600',
    designerButton: isDark ? 'bg-pink-500' : 'bg-pink-600',
    settingsButton: isDark ? 'bg-teal-500' : 'bg-teal-600',
    // New detached components
    appLogo: isDark ? 'bg-indigo-500' : 'bg-indigo-600',
    newChatButton: isDark ? 'bg-emerald-500' : 'bg-emerald-600',
    newGameButton: isDark ? 'bg-rose-500' : 'bg-rose-600',
    searchButton: isDark ? 'bg-cyan-500' : 'bg-cyan-600',
    accountPanel: isDark ? 'bg-amber-500' : 'bg-amber-600',
    // Authentication buttons
    loginButton: isDark ? 'bg-blue-600' : 'bg-blue-700',
    signupButton: isDark ? 'bg-green-600' : 'bg-green-700',
    accountButton: isDark ? 'bg-orange-600' : 'bg-orange-700'
  };

  const getElementDisplayName = (key: string) => {
    switch (key) {
      case 'inputBox': return 'Input Box';
      case 'designerButton': return 'Designer Button';
      case 'themeToggle': return 'Theme Toggle';
      case 'topBar': return 'Top Bar';
      case 'mainContent': return 'Main Content';
      case 'sidebar': return 'Sidebar';
      case 'settingsButton': return 'Settings Button';
      case 'appLogo': return 'App Logo';
      case 'newChatButton': return 'New Chat Button';
      case 'newGameButton': return 'New Game Button';
      case 'searchButton': return 'Search Button';
      case 'accountPanel': return 'Account Panel';
      case 'loginButton': return 'Login Button';
      case 'signupButton': return 'Signup Button';
      case 'accountButton': return 'Account Button';
      default: return key.replace(/([A-Z])/g, ' $1').trim();
    }
  };

  // Get elements sorted by z-index (highest first), excluding designer button from reordering
  const getSortedElements = () => {
    return Object.keys(layout)
      .map(key => key as keyof LayoutConfig)
      .sort((a, b) => layout[b].zIndex - layout[a].zIndex);
  };

  const colorPresets = [
    { name: 'Purple', primary: '#7c3aed', secondary: '#a855f7' },
    { name: 'Blue', primary: '#2563eb', secondary: '#3b82f6' },
    { name: 'Green', primary: '#059669', secondary: '#10b981' },
    { name: 'Pink', primary: '#db2777', secondary: '#ec4899' },
    { name: 'Orange', primary: '#ea580c', secondary: '#f97316' },
    { name: 'Teal', primary: '#0d9488', secondary: '#14b8a6' }
  ];

  const fontOptions = [
    'Inter',
    'Roboto',
    'Open Sans',
    'Lato',
    'Montserrat',
    'Poppins'
  ];

  return (
    <div 
      className={`h-screen ${isDark ? 'bg-[#111827]' : 'bg-gray-100'}`}
      style={{ 
        fontFamily: customization.fontFamily,
        background: customization.gradientEnabled && !isDark 
          ? `linear-gradient(135deg, ${customization.primaryColor}05, ${customization.secondaryColor}05)`
          : undefined
      }}
    >
      {/* Designer Mode Header - with customizable color */}
      <div 
        className="h-16 border-b flex items-center justify-between px-6 text-white"
        style={{ 
          background: customization.gradientEnabled 
            ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
            : customization.primaryColor,
          borderBottomColor: isDark ? '#374151' : customization.primaryColor + '40',
          fontFamily: customization.fontFamily
        }}
      >
        <div className="flex items-center gap-4">
          <h1 className={`text-xl font-semibold`} style={{ fontFamily: customization.fontFamily }}>
            Designer Mode
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg transition-colors bg-white text-gray-900 hover:bg-white/90 border border-white/70 shadow"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          <button
            onClick={resetLayout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors bg-white/10 hover:bg-white/20 text-white"
            style={{ fontFamily: customization.fontFamily }}
          >
            <RotateCcw className="w-4 h-4" />
            Reset All
          </button>
          
          <button
            onClick={() => {
              // Debug: Log current layout
              console.log('Designer Mode - Current layout on exit:', layout);
              // Force save the current layout state using the parent's update function
              onLayoutChange(layout);
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

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Grid Container */}
        <div className="flex-1 p-6">
          <div 
            ref={gridRef}
            className={`h-full grid gap-1 rounded-lg p-4 relative overflow-hidden touch-none ${isDark ? 'bg-transparent' : 'bg-gray-100/50'}`}
            style={{
              gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
              gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Grid Lines */}
            {Array.from({ length: GRID_COLS * GRID_ROWS }).map((_, i) => (
              <div 
                key={i} 
                className={`border ${isDark ? 'border-gray-600/10' : 'border-gray-400/10'} rounded-sm`}
              />
            ))}

            {/* Draggable Elements */}
            {Object.entries(layout)
              .sort(([, a], [, b]) => a.zIndex - b.zIndex)
              .map(([key, config]) => {
                const isSelected = selectedElement === key;
                const colorClass = isSelected ? selectedColors[key as keyof LayoutConfig] : elementColors[key as keyof LayoutConfig];
                
                return (
                  <div
                    key={key}
                    className={`${colorClass} border-2 border-white/70 rounded-lg cursor-move flex items-center justify-center text-white font-medium text-sm shadow-lg transition-all hover:scale-[1.01] relative group ${
                      dragState.element === key ? 'scale-[1.01] shadow-xl' : ''
                    } ${isSelected ? 'ring-2 ring-white/50' : ''} select-none`}
                    style={{
                      gridColumn: `${config.x + 1} / ${config.x + config.width + 1}`,
                      gridRow: `${config.y + 1} / ${config.y + config.height + 1}`,
                      zIndex: config.zIndex + 100,
                      fontFamily: customization.fontFamily,
                      background: customization.gradientEnabled && isSelected
                        ? `linear-gradient(135deg, ${customization.primaryColor}CC, ${customization.secondaryColor}CC)`
                        : undefined
                    }}
                    onMouseDown={(e) => handleMouseDown(e, key as keyof LayoutConfig)}
                  >
                    <div className="text-center pointer-events-none">
                      <div className="font-semibold capitalize text-xs sm:text-sm">
                        {getElementDisplayName(key)}
                      </div>
                      <div className="text-xs opacity-90">
                        {config.width}×{config.height} (z:{config.zIndex})
                      </div>
                    </div>

                    {/* Desktop Resize Handles - only show for desktop */}
                                         {isSelected && (
                      <>
                        {/* Right resize handle */}
                        <div
                          className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-8 bg-white/80 rounded cursor-ew-resize hover:bg-white transition-colors z-50"
                          onMouseDown={(e) => handleResizeStart(e, key as keyof LayoutConfig, 'width')}
                        />
                        {/* Bottom resize handle */}
                        <div
                          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-8 h-3 bg-white/80 rounded cursor-ns-resize hover:bg-white transition-colors z-50"
                          onMouseDown={(e) => handleResizeStart(e, key as keyof LayoutConfig, 'height')}
                        />
                        {/* Left resize handle */}
                        <div
                          className="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-8 bg-white/80 rounded cursor-ew-resize hover:bg-white transition-colors z-50"
                          onMouseDown={(e) => handleResizeStart(e, key as keyof LayoutConfig, 'left')}
                        />
                        {/* Top resize handle */}
                        <div
                          className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-3 bg-white/80 rounded cursor-ns-resize hover:bg-white transition-colors z-50"
                          onMouseDown={(e) => handleResizeStart(e, key as keyof LayoutConfig, 'top')}
                        />
                      </>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* Control Panel - Enhanced with consistent glass/3D visuals */}
        <div className={`w-80 border-l p-6 overflow-y-auto ${isDark ? 'ios-panel ios-panel-dark' : 'ios-panel'}`}>
          <h3 className={`font-semibold mb-6`} style={{ fontFamily: customization.fontFamily }}>
            Designer Controls
          </h3>

          {/* Customization Section - Complete from Account Menu */}
          <div className="space-y-6 mb-8">
            <h4 className={`font-medium`} style={{ fontFamily: customization.fontFamily }}>
              Appearance Settings
            </h4>

            {/* Theme Selector */}
            <div className={`p-4 rounded-lg neo-surface ${isDark ? 'card-surface-dark' : 'card-surface-light'}`}>
              <h4 className={`font-medium mb-4 flex items-center gap-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`} style={{ fontFamily: customization.fontFamily }}>
                <Sparkles className="w-5 h-5" />
                Aesthetic Themes
              </h4>
              
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {AVAILABLE_THEMES.map((theme) => (
                  <div
                    key={theme.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      customization.selectedTheme === theme.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : isDark ? 'border-gray-600 bg-gray-800 hover:border-gray-500' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    onClick={() => onApplyTheme?.(theme.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`} style={{ fontFamily: customization.fontFamily }}>
                          {theme.name}
                        </div>
                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontFamily: customization.fontFamily }}>
                          {theme.description}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <div
                          className="w-4 h-4 rounded-full border border-white/50"
                          style={{ backgroundColor: theme.primaryColor }}
                        />
                        <div
                          className="w-4 h-4 rounded-full border border-white/50"
                          style={{ backgroundColor: theme.secondaryColor }}
                        />
                      </div>
                    </div>
                    {theme.glassEffect && (
                      <div className={`text-xs mt-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                        ✨ Glass Effects
                      </div>
                    )}
                    {theme.retroMode && (
                      <div className={`text-xs mt-1 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                        🔥 Retro Mode
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Show Questions Toggle */}
            <div className={`p-4 rounded-lg neo-surface ${isDark ? 'card-surface-dark' : 'card-surface-light'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`} style={{ fontFamily: customization.fontFamily }}>
                    Show Sample Questions
                  </h4>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`} style={{ fontFamily: customization.fontFamily }}>
                    Display sample questions on the main page
                  </p>
                </div>
                <button
                  onClick={() => onCustomizationChange({ showQuestions: !customization.showQuestions })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    customization.showQuestions ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      customization.showQuestions ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Color Theme */}
            <div className={`p-4 rounded-lg neo-surface ${isDark ? 'card-surface-dark' : 'card-surface-light'}`}>
              <h4 className={`font-medium mb-4 flex items-center gap-2`} style={{ fontFamily: customization.fontFamily }}>
                <Palette className="w-5 h-5" />
                Color Theme
              </h4>
              
              <div className="grid grid-cols-3 gap-3 mb-4">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => onCustomizationChange({ 
                      primaryColor: preset.primary, 
                      secondaryColor: preset.secondary 
                    })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      customization.primaryColor === preset.primary
                        ? 'border-white shadow-lg'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                    style={{ 
                      background: customization.gradientEnabled 
                        ? `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})`
                        : preset.primary 
                    }}
                  >
                    <div className="text-white text-sm font-medium" style={{ fontFamily: customization.fontFamily }}>
                      {preset.name}
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom Color Inputs */}
              <div className="space-y-3">
                <div>
                  <label className={`block text-sm font-medium mb-1`} style={{ fontFamily: customization.fontFamily }}>
                    Primary Color
                  </label>
                  <input
                    type="color"
                    value={customization.primaryColor}
                    onChange={(e) => onCustomizationChange({ primaryColor: e.target.value })}
                    className="w-full h-10 rounded border"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1`} style={{ fontFamily: customization.fontFamily }}>
                    Secondary Color
                  </label>
                  <input
                    type="color"
                    value={customization.secondaryColor}
                    onChange={(e) => onCustomizationChange({ secondaryColor: e.target.value })}
                    className="w-full h-10 rounded border"
                  />
                </div>
              </div>
            </div>

            {/* Font Selection */}
            <div className={`p-4 rounded-lg neo-surface ${isDark ? 'card-surface-dark' : 'card-surface-light'}`}>
              <h4 className={`font-medium mb-4 flex items-center gap-2`} style={{ fontFamily: customization.fontFamily }}>
                <Type className="w-5 h-5" />
                Font Family
              </h4>
              
              <select
                value={customization.fontFamily}
                onChange={(e) => onCustomizationChange({ fontFamily: e.target.value })}
                className={`w-full p-3 rounded-lg border`}
                style={{ fontFamily: customization.fontFamily }}
              >
                {fontOptions.map((font) => (
                  <option key={font} value={font} style={{ fontFamily: font }}>
                    {font}
                  </option>
                ))}
              </select>
            </div>

            {/* Gradient Toggle */}
            <div className={`p-4 rounded-lg neo-surface ${isDark ? 'card-surface-dark' : 'card-surface-light'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`} style={{ fontFamily: customization.fontFamily }}>
                    Gradient Effects
                  </h4>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`} style={{ fontFamily: customization.fontFamily }}>
                    Enable gradient backgrounds and effects
                  </p>
                </div>
                <button
                  onClick={() => onCustomizationChange({ gradientEnabled: !customization.gradientEnabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    customization.gradientEnabled ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      customization.gradientEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Element Controls */}
          {selectedElement && (
            <div className="space-y-6 mb-8">
              <div>
                <h4 className={`font-medium mb-3`} style={{ fontFamily: customization.fontFamily }}>
                  {getElementDisplayName(selectedElement)}
                </h4>
                
                <div className="space-y-4">
                  {/* Position Display */}
                  <div>
                    <label className={`block text-sm font-medium mb-2`} style={{ fontFamily: customization.fontFamily }}>
                      Position
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className={`text-xs`} style={{ fontFamily: customization.fontFamily }}>X: {layout[selectedElement].x}</span>
                      </div>
                      <div>
                        <span className={`text-xs`} style={{ fontFamily: customization.fontFamily }}>Y: {layout[selectedElement].y}</span>
                      </div>
                    </div>
                  </div>

                  {/* Size Controls */}
                  <div>
                    <label className={`block text-sm font-medium mb-2`} style={{ fontFamily: customization.fontFamily }}>
                      Width
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => adjustElementSize(selectedElement, 'width', -1)}
                        className={`p-1 rounded`}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className={`flex-1 text-center text-sm`} style={{ fontFamily: customization.fontFamily }}>
                        {layout[selectedElement].width}
                      </span>
                                             <button
                         onClick={() => adjustElementSize(selectedElement, 'width', 1)}
                         className={`p-1 rounded`}
                       >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontFamily: customization.fontFamily }}>
                      Height
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => adjustElementSize(selectedElement, 'height', -1)}
                        className={`p-1 rounded ${isDark ? 'bg-gray-600 hover:bg-gray-500 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className={`flex-1 text-center text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontFamily: customization.fontFamily }}>
                        {layout[selectedElement].height}
                      </span>
                      <button
                        onClick={() => adjustElementSize(selectedElement, 'height', 1)}
                        className={`p-1 rounded ${isDark ? 'bg-gray-600 hover:bg-gray-500 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Layer Controls - disabled for designer button */}
                  {selectedElement !== 'designerButton' && (
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontFamily: customization.fontFamily }}>
                        Layer (Z-Index)
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => adjustZIndex(selectedElement, -1)}
                          className={`p-1 rounded ${isDark ? 'bg-gray-600 hover:bg-gray-500 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                          title="Send to back"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <span className={`flex-1 text-center text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontFamily: customization.fontFamily }}>
                          {layout[selectedElement].zIndex}
                        </span>
                        <button
                          onClick={() => adjustZIndex(selectedElement, 1)}
                          className={`p-1 rounded ${isDark ? 'bg-gray-600 hover:bg-gray-500 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                          title="Bring to front"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Quick Size Presets */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontFamily: customization.fontFamily }}>
                      Quick Resize
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => onLayoutChange({
                          ...layout,
                          [selectedElement]: { ...layout[selectedElement], width: 2, height: 2 }
                        })}
                        className={`px-2 py-1 text-xs rounded ${isDark ? 'bg-gray-600 hover:bg-gray-500 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                        style={{ fontFamily: customization.fontFamily }}
                      >
                        Small
                      </button>
                      <button
                        onClick={() => onLayoutChange({
                          ...layout,
                          [selectedElement]: { ...layout[selectedElement], width: 6, height: 6 }
                        })}
                        className={`px-2 py-1 text-xs rounded ${isDark ? 'bg-gray-600 hover:bg-gray-500 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                        style={{ fontFamily: customization.fontFamily }}
                      >
                        Medium
                      </button>
                      <button
                        onClick={() => onLayoutChange({
                          ...layout,
                          [selectedElement]: { ...layout[selectedElement], width: 12, height: 8 }
                        })}
                        className={`px-2 py-1 text-xs rounded ${isDark ? 'bg-gray-600 hover:bg-gray-500 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                        style={{ fontFamily: customization.fontFamily }}
                      >
                        Large
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Layer Management */}
          <div className="mt-8">
            <h4 className={`font-medium mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`} style={{ fontFamily: customization.fontFamily }}>
              Layers (Drag to Reorder)
            </h4>
            <div className="space-y-1">
              {getSortedElements().map((key) => (
                <div
                  key={key}
                  draggable={key !== 'designerButton'}
                  onDragStart={(e) => handleLayerDragStart(e, key)}
                  onDragOver={(e) => handleLayerDragOver(e, key)}
                  onDrop={(e) => handleLayerDrop(e, key)}
                  className={`flex items-center gap-3 p-3 rounded transition-colors ${
                    key === 'designerButton' 
                      ? 'opacity-75 cursor-not-allowed' 
                      : 'cursor-move'
                  } ${
                    selectedElement === key 
                      ? isDark ? 'bg-gray-600' : 'bg-gray-200'
                      : isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'
                  } ${
                    layerDragState.dragOverElement === key && layerDragState.draggedElement !== key
                      ? isDark ? 'bg-gray-500' : 'bg-gray-300'
                      : ''
                  }`}
                  onClick={() => setSelectedElement(key)}
                >
                  {key !== 'designerButton' && (
                    <GripVertical className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  )}
                  <div className={`w-4 h-4 ${elementColors[key]} rounded border border-white/50`}></div>
                  <span className={`text-sm flex-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontFamily: customization.fontFamily }}>
                    {getElementDisplayName(key)}
                    {key === 'designerButton' && (
                      <span className={`text-xs ml-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        (Locked)
                      </span>
                    )}
                  </span>
                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`} style={{ fontFamily: customization.fontFamily }}>
                    z:{layout[key].zIndex}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
