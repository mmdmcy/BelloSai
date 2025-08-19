/**
 * ModelSelector Component
 * 
 * A simplified dropdown component for selecting AI models in the chat interface.
 * Clean design matching the provided reference image.
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Brain, Sparkles, Feather, Star, Lock, FileText, Image as ImageIcon, Mic, Code, ListChecks, Globe, SlidersHorizontal, Database, ScanText, Search } from 'lucide-react';
import { CustomizationSettings } from '../types/app';
import type { ModelInfo } from '../types/app';
import { MODEL_CAPABILITIES } from '../types/app';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  availableModels: ModelInfo[];
  isDark: boolean;
  customization: CustomizationSettings;
  hasActiveSubscription?: boolean;
}

const PROVIDER_ICON: Record<string, any> = {
  DeepSeek: () => <span className="text-base">🐋</span>, // Whale emoji for DeepSeek
  Claude: Feather,
  Mistral: Star,
  Groq: Sparkles,
  Qwen: Brain,
};

const PROVIDER_COLOR: Record<string, string> = {
  DeepSeek: '#2563eb', // blue
  Claude: '#fbbf24', // yellow/orange
  Mistral: '#ef4444', // red
  Groq: '#10b981', // emerald
  Qwen: '#8b5cf6', // violet
};

const CAPABILITY_ICON: Record<string, any> = {
  text: FileText,
  image: ImageIcon,
  audio: Mic,
  code: Code,
  structured_outputs: ListChecks,
  search: Globe,
  tuning: SlidersHorizontal,
  caching: Database,
  embedding: Database,
  ocr: ScanText,
  voice: Mic,
  agentic: Sparkles,
  reasoning: Brain,
  multimodal: ImageIcon,
  lightweight: Feather,
};

export default function ModelSelector({ 
  selectedModel, 
  onModelChange, 
  availableModels, 
  isDark,
  customization,
  hasActiveSubscription = false
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('bellosai-favorite-models');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'tiers' | 'provider' | 'all' | 'favorites'>('tiers');
  const [compact, setCompact] = useState<boolean>(true);

  // Derive token balances from Account page (persisted locally)
  const [tokenBalances, setTokenBalances] = useState<{ light: number; medium: number; heavy: number }>({ light: 0, medium: 0, heavy: 0 });
  useEffect(() => {
    try {
      const raw = localStorage.getItem('bellosai-token-balances');
      if (raw) setTokenBalances(JSON.parse(raw));
    } catch {}
  }, []);

  const getTier = (model: ModelInfo): 'light' | 'medium' | 'heavy' => {
    const maxCost = Math.max(model.inputPricePerMTokens || 0, model.outputPricePerMTokens || 0);
    if (model.premium || maxCost >= 2) return 'heavy';
    if (maxCost >= 0.15) return 'medium';
    return 'light';
  };

  const isUnsupportedModel = (model: ModelInfo) => {
    const unsupportedCaps = ['embedding','ocr','voice','multimodal'];
    return (model.forChat === false) || model.capabilities.some(c => unsupportedCaps.includes(c));
  };

  const filtered = availableModels.filter(m => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.code.toLowerCase().includes(q) ||
      (m.description || '').toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleModelSelect = (modelCode: string, gated?: boolean) => {
    if (gated) {
      try { window.location.assign('/pricing'); } catch { window.location.href = '/pricing'; }
      return;
    }
    onModelChange(modelCode);
    setIsOpen(false);
  };

  const toggleFavorite = (code: string) => {
    setFavorites(prev => {
      const next = prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code];
      try { localStorage.setItem('bellosai-favorite-models', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const selectedModelInfo = availableModels.find(m => m.code === selectedModel);
  const ProviderIcon = selectedModelInfo ? PROVIDER_ICON[selectedModelInfo.provider] : Brain;

  const renderRow = (model: ModelInfo, isSelected: boolean, isDisabled: boolean, providerColor: string) => {
    const ModelProviderIcon = PROVIDER_ICON[model.provider];
    const tier = getTier(model);
    const tierBadge = model.free ? 'Free' : (tier === 'heavy' ? 'H' : tier === 'medium' ? 'M' : 'L');
    const canUseFree = model.free === true;
    const hasTokens = tier === 'light' ? tokenBalances.light > 0 : tier === 'medium' ? tokenBalances.medium > 0 || tokenBalances.heavy > 0 : tokenBalances.heavy > 0;
    const gated = !canUseFree && !hasTokens;
    const disabled = isDisabled || gated;
    return (
      <button
        key={model.code}
        className={`w-full flex items-center ${compact ? 'gap-2 px-3 py-2' : 'gap-3 px-4 py-3'} text-left ${
          isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
        } ${isSelected ? (isDark ? 'bg-gray-700' : 'bg-purple-50') : ''} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        onClick={() => handleModelSelect(model.code, gated)}
        disabled={disabled}
      >
        <ModelProviderIcon className="w-4 h-4" style={{ color: providerColor }} />
        <div className="flex-1 min-w-0">
          <div className={`text-sm truncate ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{model.name}</div>
          {!compact && model.description && (
            <div className={`text-xs truncate ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>{model.description}</div>
          )}
        </div>
        <span className="ml-2 flex items-center gap-1">
          {model.capabilities.slice(0, compact ? 3 : 5).map(cap => {
            const IconComp = CAPABILITY_ICON[cap] || FileText;
            return <IconComp key={cap} className={`w-3.5 h-3.5 ${isDark ? 'text-gray-200' : 'text-gray-700'} opacity-80`} />
          })}
          {model.supportsWebSearch && (
            <Search className={`w-3.5 h-3.5 ${isDark ? 'text-gray-200' : 'text-gray-700'} opacity-80`} />
          )}
        </span>
        <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${tier==='heavy' ? 'bg-red-500/20 text-red-600' : tier==='medium' ? 'bg-yellow-500/20 text-yellow-700' : 'bg-green-500/20 text-green-700'}`} title={`${tier.toUpperCase()} tier`}>
          {tierBadge}
        </span>
        {(model.inputPricePerMTokens || model.outputPricePerMTokens) && (
          <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
            {model.inputPricePerMTokens ? `$${model.inputPricePerMTokens}/Min` : ''}
            {model.outputPricePerMTokens ? ` • $${model.outputPricePerMTokens}/Mout` : ''}
          </span>
        )}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); toggleFavorite(model.code); }}
          className={`ml-2 text-xs px-2 py-0.5 rounded ${favorites.includes(model.code) ? 'bg-yellow-500 text-white' : (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700')}`}
          aria-label="Toggle favorite"
        >★</button>
        {(isUnsupportedModel(model) || gated) && (
          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-gray-600 text-white opacity-80">In development</span>
        )}
      </button>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${isDark ? 'text-white' : 'text-gray-900'} ${isOpen ? 'ring-2 ring-opacity-50' : ''}`}
        style={{ 
          fontFamily: customization.fontFamily,
          background: customization.gradientEnabled 
            ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
            : customization.primaryColor,
          '--tw-ring-color': customization.secondaryColor
        } as React.CSSProperties}
      >
        <ProviderIcon className="w-3.5 h-3.5 opacity-80" />
        <span className="truncate">
          {selectedModelInfo?.name || selectedModel}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className={`absolute bottom-full left-0 mb-2 min-w-64 rounded-xl border shadow-lg z-50 ${
            isDark 
              ? 'bg-gray-800 border-gray-600' 
              : 'bg-white border-gray-200'
          }`}
        >
          {/* Search + Tabs + Compact */}
          <div className={`p-2 border-b sticky top-0 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search models..."
              className={`w-full text-sm px-3 py-2 rounded-lg ${isDark ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-100 text-gray-900 placeholder-gray-500'}`}
            />
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-1">
                {(['tiers','provider','all','favorites'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`text-xs px-2 py-1 rounded ${activeTab === tab ? (isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900') : (isDark ? 'text-gray-300' : 'text-gray-600')}`}
                  >{tab === 'provider' ? 'By provider' : tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={compact} onChange={(e) => setCompact(e.target.checked)} />
                Compact
              </label>
            </div>
            {/* Feature filters */}
            <div className="mt-2 flex items-center flex-wrap gap-2 text-xs">
              <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Filter by:</span>
              {['reasoning','code','multimodal','lightweight','agentic'].map((cap) => (
                <button
                  key={cap}
                  onClick={() => setQuery(cap)}
                  className={`${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'} px-2 py-0.5 rounded`}
                >{cap}</button>
              ))}
              <button
                onClick={() => setQuery('web-search')}
                className={`${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'} px-2 py-0.5 rounded flex items-center gap-1`}
              >
                <Search className="w-3 h-3" /> web-search
              </button>
            </div>
          </div>
          <div className="py-1 max-h-96 overflow-y-auto">
            {activeTab === 'tiers' && (
              <>
                {(['free','light','medium','heavy'] as const).map((tierKey) => {
                  const group = filtered.filter(m => {
                    if (tierKey === 'free') return m.free === true;
                    const cost = Math.max(m.inputPricePerMTokens || 0, m.outputPricePerMTokens || 0);
                    const t = (m.premium || cost >= 2) ? 'heavy' : (cost >= 0.15 ? 'medium' : 'light');
                    return t === tierKey && !m.free;
                  });
                  if (group.length === 0) return null;
                  return (
                    <div key={tierKey}>
                      <div className={`px-3 py-1 text-[11px] uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{tierKey}</div>
                      {group.map(model => {
                        const isSelected = model.code === selectedModel;
                        const providerColor = PROVIDER_COLOR[model.provider];
                        const isPremium = model.premium;
                        const unsupported = isUnsupportedModel(model);
                        const tier = getTier(model);
                        const canUseFree = model.free === true;
                        const hasTokens = tier === 'light' ? tokenBalances.light > 0 : tier === 'medium' ? tokenBalances.medium > 0 || tokenBalances.heavy > 0 : tokenBalances.heavy > 0;
                        const gated = !canUseFree && !hasTokens;
                        const disabled = (isPremium && !hasActiveSubscription) || unsupported || gated;
                        return renderRow(model, isSelected, disabled, providerColor);
                      })}
                    </div>
                  );
                })}
              </>
            )}

            {activeTab === 'favorites' && (
              <>
                {filtered.filter(m => favorites.includes(m.code)).length === 0 && (
                  <div className={`px-3 py-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No favorites yet</div>
                )}
                {filtered.filter(m => favorites.includes(m.code)).map(model => {
                  const isSelected = model.code === selectedModel;
                  const providerColor = PROVIDER_COLOR[model.provider];
                  const isPremium = model.premium;
                  const isDisabled = (isPremium && !hasActiveSubscription) || isUnsupportedModel(model);
                  return renderRow(model, isSelected, isDisabled, providerColor);
                })}
              </>
            )}

            {activeTab === 'all' && (
              filtered.map(model => {
                const isSelected = model.code === selectedModel;
                const providerColor = PROVIDER_COLOR[model.provider];
                const isPremium = model.premium;
                const isDisabled = (isPremium && !hasActiveSubscription) || isUnsupportedModel(model);
                return renderRow(model, isSelected, isDisabled, providerColor);
              })
            )}

            {activeTab === 'provider' && (
              ['Qwen','Mistral','DeepSeek','Claude','Groq'].map((prov) => (
                <div key={prov}>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-3 py-2 text-xs opacity-70"
                    onClick={() => setCollapsed(prev => ({ ...prev, [prov]: !prev[prov] }))}
                  >
                    <span>{prov}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${collapsed[prov] ? '-rotate-90' : ''}`} />
                  </button>
                  {!collapsed[prov] && filtered.filter(m => m.provider === (prov as any) && !favorites.includes(m.code)).map((model) => {
                    const isSelected = model.code === selectedModel;
                    const providerColor = PROVIDER_COLOR[model.provider];
                    const isPremium = model.premium;
                    const isDisabled = (isPremium && !hasActiveSubscription) || isUnsupportedModel(model);
                    return renderRow(model, isSelected, isDisabled, providerColor);
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
