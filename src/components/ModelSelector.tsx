/**
 * ModelSelector Component
 * 
 * A simplified dropdown component for selecting AI models in the chat interface.
 * Clean design matching the provided reference image.
 */

import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const triggerRef = useRef<HTMLButtonElement | null>(null);
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
  const [menuBounds, setMenuBounds] = useState<{ top: number; left: number; width: number; maxHeight: number }>({ top: 0, left: 0, width: 320, maxHeight: 360 });

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

  const updateMenuPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const width = Math.max(rect.width, 320);
    const maxHeight = Math.min(440, viewportHeight - 48);
    const spaceBelow = viewportHeight - rect.bottom;
    const openUpwards = spaceBelow < 320 && rect.top > spaceBelow;

    let top = openUpwards ? rect.top - maxHeight - 8 : rect.bottom + 8;
    top = Math.max(16, Math.min(top, viewportHeight - maxHeight - 16));

    const left = Math.min(
      Math.max(16, rect.left),
      viewportWidth - width - 16
    );

    setMenuBounds({ top, left, width, maxHeight });
  }, []);

  const closeMenu = useCallback(() => setIsOpen(false), []);

  const openMenu = useCallback(() => {
    updateMenuPosition();
    setIsOpen(true);
  }, [updateMenuPosition]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updateMenuPosition();

    const handleResizeOrScroll = () => updateMenuPosition();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
      }
    };

    window.addEventListener('resize', handleResizeOrScroll);
    window.addEventListener('scroll', handleResizeOrScroll, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResizeOrScroll);
      window.removeEventListener('scroll', handleResizeOrScroll, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, updateMenuPosition, closeMenu]);

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

  const renderRow = (model: ModelInfo, isSelected: boolean, isDisabled: boolean, providerColor: string, isGated: boolean) => {
    const ModelProviderIcon = PROVIDER_ICON[model.provider];
    const tier = getTier(model);
    const tierBadge = model.free ? 'Free' : (tier === 'heavy' ? 'H' : tier === 'medium' ? 'M' : 'L');
    const disabled = isDisabled;
    const isFavorite = favorites.includes(model.code);

    return (
      <div
        key={model.code}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && handleModelSelect(model.code, gated)}
        onKeyDown={(event) => {
          if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            handleModelSelect(model.code, gated);
          }
        }}
        className={`w-full flex items-start gap-3 px-3 py-2 rounded-theme transition-colors ${
          disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-theme-surface-hover'
        } ${isSelected ? 'bg-theme-surface-accent border border-theme-accent shadow-theme-soft' : ''}`}
      >
        <span
          className="flex items-center justify-center w-8 h-8 rounded-full bg-theme-ghost border border-theme"
          style={{ color: providerColor }}
        >
          <ModelProviderIcon className="w-4 h-4" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-theme truncate">{model.name}</span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-theme border border-theme-accent text-theme-inverse"
              style={{ background: providerColor }}
            >
              {tierBadge}
            </span>
            {isGated && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-theme bg-theme-ghost border border-theme text-theme-muted flex items-center gap-1">
                <Lock className="w-3 h-3" /> Credits
              </span>
            )}
            {model.premium && !model.free && !isGated && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-theme bg-theme-ghost border border-theme text-theme-muted flex items-center gap-1">
                <Lock className="w-3 h-3" /> Pro
              </span>
            )}
          </div>
          {!compact && model.description && (
            <div className="text-xs text-theme-muted mt-0.5 truncate">{model.description}</div>
          )}
          <div className="flex items-center gap-2 mt-1 text-[11px] text-theme-muted">
            {model.capabilities.slice(0, compact ? 3 : 5).map(cap => {
              const IconComp = CAPABILITY_ICON[cap] || FileText;
              return <IconComp key={cap} className="w-3.5 h-3.5 opacity-80" />;
            })}
            {model.supportsWebSearch && <Search className="w-3.5 h-3.5 opacity-80" />}
            {(model.inputPricePerMTokens || model.outputPricePerMTokens) && (
              <span>
                {model.inputPricePerMTokens ? `$${model.inputPricePerMTokens}/Min` : ''}
                {model.outputPricePerMTokens ? ` • $${model.outputPricePerMTokens}/Mout` : ''}
              </span>
            )}
          </div>
        </div>
        <span
          role="button"
          aria-label="Toggle favorite"
          aria-pressed={isFavorite}
          tabIndex={0}
          onClick={(event) => { event.stopPropagation(); toggleFavorite(model.code); }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              event.stopPropagation();
              toggleFavorite(model.code);
            }
          }}
          className={`ml-2 text-xs px-2 py-1 rounded-theme transition-colors ${
            isFavorite ? 'bg-theme-accent text-theme-inverse' : 'bg-theme-ghost text-theme-muted hover:bg-theme-surface-hover'
          }`}
        >
          ★
        </span>
      </div>
    );
  };

  const portalTarget = typeof document !== 'undefined' ? document.body : null;
  const scrollerMaxHeight = Math.max(180, menuBounds.maxHeight - 96);

  const dropdownContent = (
    <div
      className="fixed inset-0 z-[1000]"
      onClick={closeMenu}
    >
      <div
        className="absolute z-[1001]"
        style={{ top: menuBounds.top, left: menuBounds.left, width: menuBounds.width }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="rounded-theme border border-theme shadow-theme bg-theme-surface text-theme overflow-hidden backdrop-blur-sm"
          style={{ maxHeight: menuBounds.maxHeight }}
        >
          <div className="sticky top-0 z-10 bg-theme-surface border-b border-theme px-3 py-3 space-y-2">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search models..."
              className="w-full text-sm px-3 py-2 rounded-theme bg-theme-surface-muted text-theme placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme"
            />
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {(['tiers','provider','all','favorites'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-2 py-1 rounded-theme transition-colors ${
                      activeTab === tab ? 'bg-theme-surface-accent text-theme shadow-theme-soft' : 'bg-theme-ghost text-theme-muted hover:bg-theme-surface-hover'
                    }`}
                  >
                    {tab === 'provider' ? 'By provider' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-xs text-theme-muted">
                <input type="checkbox" checked={compact} onChange={(e) => setCompact(e.target.checked)} />
                Compact
              </label>
            </div>
            <div className="flex items-center flex-wrap gap-2 text-xs">
              <span className="text-theme-muted">Filter by:</span>
              {['reasoning','code','multimodal','lightweight','agentic'].map((cap) => (
                <button
                  key={cap}
                  onClick={() => setQuery(cap)}
                  className="px-2 py-0.5 rounded-theme bg-theme-ghost text-theme hover:bg-theme-surface-hover"
                >{cap}</button>
              ))}
              <button
                onClick={() => setQuery('web-search')}
                className="px-2 py-0.5 rounded-theme bg-theme-ghost text-theme hover:bg-theme-surface-hover flex items-center gap-1"
              >
                <Search className="w-3 h-3" /> web-search
              </button>
            </div>
          </div>
          <div className="py-2 overflow-y-auto" style={{ maxHeight: scrollerMaxHeight }}>
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
                    <div key={tierKey} className="space-y-1">
                      <div className="px-4 py-1 text-[11px] uppercase tracking-wider text-theme-muted">{tierKey}</div>
                      {group.map(model => {
                        const isSelected = model.code === selectedModel;
                        const providerColor = PROVIDER_COLOR[model.provider];
                        const isPremium = model.premium;
                        const unsupported = isUnsupportedModel(model);
                        const tier = getTier(model);
                        const canUseFree = model.free === true;
                        const hasTokens = tier === 'light' ? tokenBalances.light > 0 : tier === 'medium' ? tokenBalances.medium > 0 || tokenBalances.heavy > 0 : tokenBalances.heavy > 0;
                        const gated = !canUseFree && !hasTokens;
                        const disabled = (isPremium && !hasActiveSubscription) || unsupported;
                        return renderRow(model, isSelected, disabled, providerColor, gated);
                      })}
                    </div>
                  );
                })}
              </>
            )}

            {activeTab === 'favorites' && (
              <>
                {filtered.filter(m => favorites.includes(m.code)).length === 0 && (
                  <div className="px-4 py-2 text-xs text-theme-muted">No favorites yet</div>
                )}
                {filtered.filter(m => favorites.includes(m.code)).map(model => {
                  const isSelected = model.code === selectedModel;
                  const providerColor = PROVIDER_COLOR[model.provider];
                  const isPremium = model.premium;
                  const unsupported = isUnsupportedModel(model);
                  const tier = getTier(model);
                  const canUseFree = model.free === true;
                  const hasTokens = tier === 'light' ? tokenBalances.light > 0 : tier === 'medium' ? tokenBalances.medium > 0 || tokenBalances.heavy > 0 : tokenBalances.heavy > 0;
                  const gated = !canUseFree && !hasTokens;
                  const disabled = (isPremium && !hasActiveSubscription) || unsupported;
                  return renderRow(model, isSelected, disabled, providerColor, gated);
                })}
              </>
            )}

            {activeTab === 'all' && (
              filtered.length === 0 ? (
                <div className="px-4 py-3 text-xs text-theme-muted">No models match your search.</div>
              ) : (
                filtered.map(model => {
                  const isSelected = model.code === selectedModel;
                  const providerColor = PROVIDER_COLOR[model.provider];
                  const isPremium = model.premium;
                  const unsupported = isUnsupportedModel(model);
                  const tier = getTier(model);
                  const canUseFree = model.free === true;
                  const hasTokens = tier === 'light' ? tokenBalances.light > 0 : tier === 'medium' ? tokenBalances.medium > 0 || tokenBalances.heavy > 0 : tokenBalances.heavy > 0;
                  const gated = !canUseFree && !hasTokens;
                  const disabled = (isPremium && !hasActiveSubscription) || unsupported;
                  return renderRow(model, isSelected, disabled, providerColor, gated);
                })
              )
            )}

            {activeTab === 'provider' && (
              ['Qwen','Mistral','DeepSeek','Claude','Groq'].map((prov) => (
                <div key={prov} className="space-y-1">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-4 py-2 text-xs text-theme hover:bg-theme-surface-hover"
                    onClick={() => setCollapsed(prev => ({ ...prev, [prov]: !prev[prov] }))}
                  >
                    <span>{prov}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${collapsed[prov] ? '-rotate-90' : ''}`} />
                  </button>
                  {!collapsed[prov] && filtered.filter(m => m.provider === prov && !favorites.includes(m.code)).map((model) => {
                    const isSelected = model.code === selectedModel;
                    const providerColor = PROVIDER_COLOR[model.provider];
                    const isPremium = model.premium;
                    const unsupported = isUnsupportedModel(model);
                    const tier = getTier(model);
                    const canUseFree = model.free === true;
                    const hasTokens = tier === 'light' ? tokenBalances.light > 0 : tier === 'medium' ? tokenBalances.medium > 0 || tokenBalances.heavy > 0 : tokenBalances.heavy > 0;
                    const gated = !canUseFree && !hasTokens;
                    const disabled = (isPremium && !hasActiveSubscription) || unsupported;
                    return renderRow(model, isSelected, disabled, providerColor, gated);
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative font-theme">
      {/* Trigger Button */}
      <button
        type="button"
        ref={triggerRef}
        onClick={() => (isOpen ? closeMenu() : openMenu())}
        className={`flex items-center gap-2 px-4 py-2 rounded-theme text-sm font-medium transition-all duration-200 shadow-theme-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent ${
          isOpen ? 'scale-[1.01]' : 'scale-100'
        }`}
        style={{
          fontFamily: customization.fontFamily,
          background: customization.gradientEnabled
            ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
            : customization.primaryColor,
          color: 'var(--color-text-inverse)'
        }}
      >
        <ProviderIcon className="w-3.5 h-3.5 opacity-80" />
        <span className="truncate">
          {selectedModelInfo?.name || selectedModel}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && portalTarget ? createPortal(dropdownContent, portalTarget) : null}
    </div>
  );
}
