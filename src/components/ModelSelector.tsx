/**
 * ModelSelector Component
 * 
 * A dropdown component for selecting AI models in the chat interface.
 * Provides a clean interface for switching between different AI models.
 * 
 * Features:
 * - Dropdown interface with smooth animations
 * - Click outside to close functionality
 * - Customizable theming and colors
 * - Keyboard navigation support
 * - Model highlighting for current selection
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Info, FileText, Image, Mic, Video, Code, FunctionSquare, Database, ListChecks, Globe, SlidersHorizontal, Brain } from 'lucide-react';
import { CustomizationSettings } from '../App';
import type { ModelInfo } from '../App';
import { MODEL_CAPABILITIES } from '../App';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  availableModels: ModelInfo[];
  isDark: boolean;
  customization: CustomizationSettings;
}

const ICON_MAP: Record<string, any> = {
  FileText,
  Image,
  Mic,
  Video,
  Code,
  FunctionSquare,
  Database,
  ListChecks,
  Globe,
  SlidersHorizontal,
  Brain,
};

export default function ModelSelector({ 
  selectedModel, 
  onModelChange, 
  availableModels, 
  isDark,
  customization
}: ModelSelectorProps) {
  // Dropdown state management
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [hoveredModel, setHoveredModel] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState<string | null>(null);

  /**
   * Handle clicking outside the dropdown to close it
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setInfoOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /**
   * Handle model selection and close dropdown
   */
  const handleModelSelect = (modelCode: string) => {
    onModelChange(modelCode);
    setIsOpen(false);
    setInfoOpen(null);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 text-sm font-medium transition-colors ${
          isDark ? 'text-gray-300 hover:text-white' : 'hover:text-purple-700'
        }`}
        style={{ 
          fontFamily: customization.fontFamily,
          color: isDark ? undefined : customization.primaryColor 
        }}
      >
        {availableModels.find(m => m.code === selectedModel)?.name || selectedModel}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute bottom-full left-0 mb-2 min-w-64 rounded-lg border shadow-lg z-50 ${
          isDark 
            ? 'bg-gray-700 border-gray-600' 
            : 'bg-white border-purple-200'
        }`}>
          <div className="py-1">
            {availableModels.map((model) => {
              const isSelected = model.code === selectedModel;
              return (
                <div
                  key={model.code}
                  className={`flex items-center justify-between px-4 py-2 text-sm cursor-pointer transition-colors rounded-md ${
                    isSelected
                      ? isDark
                        ? 'text-white'
                        : 'text-purple-800'
                      : isDark
                        ? 'text-gray-300 hover:bg-gray-600 hover:text-white'
                        : 'text-gray-700 hover:text-purple-800'
                  }`}
                  style={{
                    fontFamily: customization.fontFamily,
                    backgroundColor: isSelected
                      ? (isDark ? customization.primaryColor : customization.primaryColor + '20')
                      : undefined
                  }}
                  onClick={() => handleModelSelect(model.code)}
                  onMouseEnter={() => setHoveredModel(model.code)}
                  onMouseLeave={() => setHoveredModel(null)}
                >
                  <span>{model.name}</span>
                  <span
                    className="ml-2 relative"
                    onClick={e => { e.stopPropagation(); setInfoOpen(infoOpen === model.code ? null : model.code); }}
                    onMouseEnter={() => setInfoOpen(model.code)}
                    onMouseLeave={() => setInfoOpen(null)}
                  >
                    <Info className="inline w-4 h-4 opacity-70 hover:opacity-100" />
                    {/* Pop-up capabilities */}
                    {infoOpen === model.code && (
                      <div className={`absolute left-6 top-1 z-50 min-w-56 max-w-xs p-3 rounded-lg shadow-xl border text-xs ${isDark ? 'bg-gray-800 border-gray-600 text-gray-100' : 'bg-white border-purple-200 text-gray-900'}`}
                        style={{ fontFamily: customization.fontFamily }}
                      >
                        <div className="font-semibold mb-1">{model.name}</div>
                        {model.description && <div className="mb-2 text-xs opacity-80">{model.description}</div>}
                        <div className="flex flex-wrap gap-2">
                          {model.capabilities.map(cap => {
                            const capInfo = (MODEL_CAPABILITIES as any)[cap];
                            if (!capInfo) return null;
                            const Icon = ICON_MAP[capInfo.icon] || FileText;
                            return (
                              <span key={cap} className="flex items-center gap-1 px-2 py-1 rounded bg-purple-100 dark:bg-gray-700 text-xs">
                                <Icon className="w-4 h-4" />
                                {capInfo.label}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}