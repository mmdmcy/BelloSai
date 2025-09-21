import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronDown,
  ChevronRight,
  Lock,
  Search as SearchIcon,
  Sparkles,
  Brain,
  Star,
  Feather,
  FileText,
  Image as ImageIcon,
  Mic,
  Code,
  ListChecks,
  Globe,
  SlidersHorizontal,
  Database,
  ScanText
} from 'lucide-react';
import { CustomizationSettings } from '../types/app';
import type { ModelInfo } from '../types/app';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  availableModels: ModelInfo[];
  customization: CustomizationSettings;
  hasActiveSubscription?: boolean;
}

const PROVIDER_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  DeepSeek: Sparkles,
  Claude: Feather,
  Mistral: Star,
  Groq: Brain,
  Qwen: Brain
};

const ProviderChip: React.FC<{ provider: string }> = ({ provider }) => {
  const Icon = PROVIDER_ICON[provider] || Brain;
  return (
    <span className="w-8 h-8 rounded-theme border border-theme bg-theme-ghost flex items-center justify-center text-theme">
      <Icon className="w-4 h-4" />
    </span>
  );
};

const CAPABILITY_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
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
  lightweight: Feather
};

const CapabilityIcon: React.FC<{ cap: string }> = ({ cap }) => {
  const Icon = CAPABILITY_ICON_MAP[cap];
  if (!Icon) return null;
  return <Icon className="w-3.5 h-3.5 opacity-80" />;
};

const MAX_DROPDOWN_HEIGHT = 520;
const MIN_DROPDOWN_HEIGHT = 280;

export default function ModelSelector({
  selectedModel,
  onModelChange,
  availableModels,
  customization,
  hasActiveSubscription = false
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [menuBounds, setMenuBounds] = useState({ top: 0, left: 0, width: 360, height: 360 });

  const filteredModels = useMemo(() => {
    if (!query.trim()) return availableModels;
    const q = query.toLowerCase();
    return availableModels.filter(model => {
      return (
        model.name.toLowerCase().includes(q) ||
        model.code.toLowerCase().includes(q) ||
        (model.description || '').toLowerCase().includes(q)
      );
    });
  }, [availableModels, query]);

  const upgradeNeeded = filteredModels.some(model => model.premium);

  const sections = useMemo(() => {
    const recommended = filteredModels.filter(model => !model.premium).slice(0, 3);
    const recommendedIds = new Set(recommended.map(model => model.code));
    const standard = filteredModels.filter(model => !model.premium && !recommendedIds.has(model.code));
    const premium = filteredModels.filter(model => model.premium);

    const result: Array<{ id: string; title: string; models: ModelInfo[]; locked?: boolean }> = [];
    if (recommended.length) {
      result.push({ id: 'recommended', title: 'Recommended', models: recommended });
    }
    if (standard.length) {
      result.push({ id: 'standard', title: 'All models', models: standard });
    }
    if (premium.length) {
      result.push({ id: 'premium', title: 'Premium', models: premium, locked: !hasActiveSubscription });
    }
    return result;
  }, [filteredModels, hasActiveSubscription]);

  const updateMenuPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const width = Math.min(Math.max(rect.width, 340), 420);
    const availableBelow = viewportHeight - rect.bottom - 16;
    const availableAbove = rect.top - 16;
    const height = Math.max(MIN_DROPDOWN_HEIGHT, Math.min(MAX_DROPDOWN_HEIGHT, Math.max(availableBelow, availableAbove)));
    const openUpwards = availableBelow < 260 && availableAbove > availableBelow;

    const top = openUpwards ? Math.max(16, rect.top - height - 12) : Math.min(rect.bottom + 12, viewportHeight - height - 16);
    const left = Math.min(Math.max(16, rect.left), viewportWidth - width - 16);

    setMenuBounds({ top, left, width, height });
  }, []);

  const closeMenu = useCallback(() => setIsOpen(false), []);

  const openMenu = useCallback(() => {
    updateMenuPosition();
    setIsOpen(true);
  }, [updateMenuPosition]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updateMenuPosition();

    const onResize = () => updateMenuPosition();
    const onScroll = () => updateMenuPosition();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
      }
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, true);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, updateMenuPosition, closeMenu]);

  const handleModelSelect = useCallback((model: ModelInfo, locked: boolean) => {
    if (locked) return;
    onModelChange(model.code);
    setIsOpen(false);
  }, [onModelChange]);

  const overlay = isOpen ? createPortal(
    <div className="fixed inset-0 z-[1000]" onClick={closeMenu}>
      <div
        className="absolute z-[1001] rounded-theme border border-theme shadow-theme bg-theme-surface text-theme overflow-hidden"
        style={{
          top: menuBounds.top,
          left: menuBounds.left,
          width: menuBounds.width,
          maxHeight: menuBounds.height
        }}
        onClick={event => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-theme-surface border-b border-theme">
          <div className="px-4 py-3 space-y-2">
            <div className="relative">
              <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search models..."
                className="w-full pl-10 pr-3 py-2 rounded-theme bg-theme-surface-muted text-theme placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme"
                autoFocus
              />
            </div>

            {upgradeNeeded && (
              <div className="p-4 rounded-theme border border-theme-accent bg-theme-surface-accent text-theme">
                <div className="text-xs uppercase tracking-wide text-theme-muted">Unlock everything</div>
                <div className="mt-2 flex items-end gap-2">
                  <span className="text-2xl font-semibold" style={{ color: customization.primaryColor }}>$8</span>
                  <span className="text-xs text-theme-muted">per month</span>
                </div>
                <p className="mt-2 text-sm text-theme-muted">Access premium models, faster responses, and higher daily limits.</p>
                <button
                  onClick={() => { try { window.location.assign('/pricing'); } catch { window.location.href = '/pricing'; } }}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-theme bg-theme-accent text-theme-inverse shadow-theme-soft hover:opacity-90"
                  style={{ fontFamily: customization.fontFamily }}
                >
                  Upgrade now
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: menuBounds.height - 140 }}>
          {sections.length === 0 && (
            <div className="px-4 py-6 text-sm text-theme-muted">No models match your search. Try a different keyword.</div>
          )}

          {sections.map(section => (
            <div key={section.id} className="px-2 pb-3">
              <div className="px-2 py-1 text-xs uppercase tracking-wide text-theme-muted flex items-center gap-2">
                <ChevronRight className="w-3 h-3" />
                {section.title}
              </div>
              <div className="space-y-1">
                {section.models.map(model => {
                  const isSelected = model.code === selectedModel;
                  const isLocked = section.locked || false;
                  const RowIcon = PROVIDER_ICON[model.provider] || Brain;

                  return (
                    <button
                      key={model.code}
                      onClick={() => handleModelSelect(model, isLocked)}
                      disabled={isLocked}
                      className={`w-full text-left px-3 py-2 rounded-theme transition-colors flex items-center gap-3 ${
                        isLocked
                          ? 'opacity-40 cursor-not-allowed'
                          : 'hover:bg-theme-surface-hover'
                      } ${
                        isSelected ? 'border border-theme-accent bg-theme-surface-accent shadow-theme-soft' : 'border border-transparent'
                      }`}
                    >
                      <ProviderChip provider={model.provider} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-theme truncate">{model.name}</span>
                          {isSelected && <span className="text-[10px] px-1.5 py-0.5 rounded-theme bg-theme-ghost border border-theme text-theme">Active</span>}
                        </div>
                        {model.description && (
                          <div className="text-xs text-theme-muted truncate">{model.description}</div>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-theme-muted">
                          {model.capabilities.slice(0, 4).map(cap => (
                            <CapabilityIcon cap={cap} key={cap} />
                          ))}
                          {model.supportsWebSearch && <SearchIcon className="w-3.5 h-3.5 opacity-80" />}
                        </div>
                      </div>
                      {isLocked ? (
                        <Lock className="w-4 h-4 text-theme-muted" />
                      ) : (
                        <RowIcon className="w-4 h-4 text-theme-muted" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-theme px-4 py-2 flex items-center gap-2 text-xs text-theme-muted">
          <ChevronDown className="w-3 h-3" />
          Browsing {filteredModels.length} models
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  const selectedModelInfo = availableModels.find(model => model.code === selectedModel);
  const SelectedIcon = selectedModelInfo ? PROVIDER_ICON[selectedModelInfo.provider] || Brain : Brain;

  return (
    <div className="relative font-theme">
      <button
        type="button"
        ref={triggerRef}
        onClick={() => (isOpen ? setIsOpen(false) : openMenu())}
        className={`flex items-center gap-2 px-4 py-2 rounded-theme text-sm font-medium transition-all duration-200 shadow-theme-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme ${
          isOpen ? 'scale-[1.02]' : 'scale-100'
        }`}
        style={{
          fontFamily: customization.fontFamily,
          background: customization.gradientEnabled
            ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
            : customization.primaryColor,
          color: 'var(--color-text-inverse)'
        }}
      >
        <SelectedIcon className="w-4 h-4 opacity-80" />
        <span className="truncate max-w-[140px]">
          {selectedModelInfo?.name || selectedModel}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {overlay}
    </div>
  );
}
