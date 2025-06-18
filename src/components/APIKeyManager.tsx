/**
 * APIKeyManager Component
 * 
 * Allows users to manage their own API keys for different AI providers
 * Features:
 * - Add/edit/delete API keys
 * - Test key validity
 * - Secure storage with encryption
 * - Support for multiple providers
 */

import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Check, X, AlertCircle, TestTube, Save, Trash2 } from 'lucide-react';
import { chatFeaturesService, UserAPIKeys } from '../lib/chat-features';
import { useAuth } from '../contexts/AuthContext';

interface APIKeyManagerProps {
  isDark: boolean;
  isOpen: boolean;
  onClose: () => void;
}

interface APIKeyState {
  openai_key: string;
  anthropic_key: string;
  deepseek_key: string;
  google_key: string;
}

interface KeyVisibility {
  openai_key: boolean;
  anthropic_key: boolean;
  deepseek_key: boolean;
  google_key: boolean;
}

interface KeyStatus {
  openai_key: 'idle' | 'testing' | 'valid' | 'invalid';
  anthropic_key: 'idle' | 'testing' | 'valid' | 'invalid';
  deepseek_key: 'idle' | 'testing' | 'valid' | 'invalid';
  google_key: 'idle' | 'testing' | 'valid' | 'invalid';
}

const API_PROVIDERS = {
  openai_key: {
    name: 'OpenAI',
    description: 'Voor GPT-4, GPT-3.5, DALL-E',
    placeholder: 'sk-...',
    helpUrl: 'https://platform.openai.com/api-keys'
  },
  anthropic_key: {
    name: 'Anthropic',
    description: 'Voor Claude modellen',
    placeholder: 'sk-ant-...',
    helpUrl: 'https://console.anthropic.com/account/keys'
  },
  deepseek_key: {
    name: 'DeepSeek',
    description: 'Voor DeepSeek modellen',
    placeholder: 'sk-...',
    helpUrl: 'https://platform.deepseek.com/api_keys'
  },
  google_key: {
    name: 'Google AI',
    description: 'Voor Gemini modellen',
    placeholder: 'AI...',
    helpUrl: 'https://makersuite.google.com/app/apikey'
  }
} as const;

export default function APIKeyManager({
  isDark,
  isOpen,
  onClose
}: APIKeyManagerProps) {
  const { user } = useAuth();
  const [keys, setKeys] = useState<APIKeyState>({
    openai_key: '',
    anthropic_key: '',
    deepseek_key: '',
    google_key: ''
  });
  const [originalKeys, setOriginalKeys] = useState<APIKeyState>({
    openai_key: '',
    anthropic_key: '',
    deepseek_key: '',
    google_key: ''
  });
  const [visibility, setVisibility] = useState<KeyVisibility>({
    openai_key: false,
    anthropic_key: false,
    deepseek_key: false,
    google_key: false
  });
  const [status, setStatus] = useState<KeyStatus>({
    openai_key: 'idle',
    anthropic_key: 'idle',
    deepseek_key: 'idle',
    google_key: 'idle'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      loadUserKeys();
    }
  }, [isOpen, user]);

  const loadUserKeys = async () => {
    try {
      const userKeys = await chatFeaturesService.getUserAPIKeys(user!.id);
      if (userKeys) {
        const loadedKeys = {
          openai_key: userKeys.openai_key || '',
          anthropic_key: userKeys.anthropic_key || '',
          deepseek_key: userKeys.deepseek_key || '',
          google_key: userKeys.google_key || ''
        };
        setKeys(loadedKeys);
        setOriginalKeys(loadedKeys);
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
    }
  };

  const toggleVisibility = (keyType: keyof KeyVisibility) => {
    setVisibility(prev => ({
      ...prev,
      [keyType]: !prev[keyType]
    }));
  };

  const updateKey = (keyType: keyof APIKeyState, value: string) => {
    setKeys(prev => ({
      ...prev,
      [keyType]: value
    }));
    
    // Reset status when key changes
    setStatus(prev => ({
      ...prev,
      [keyType]: 'idle'
    }));
  };

  const testKey = async (keyType: keyof APIKeyState) => {
    const keyValue = keys[keyType];
    if (!keyValue.trim()) return;

    setStatus(prev => ({
      ...prev,
      [keyType]: 'testing'
    }));

    try {
      const provider = keyType.replace('_key', '');
      const isValid = await chatFeaturesService.testAPIKey(provider, keyValue);
      
      setStatus(prev => ({
        ...prev,
        [keyType]: isValid ? 'valid' : 'invalid'
      }));
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        [keyType]: 'invalid'
      }));
    }
  };

  const deleteKey = (keyType: keyof APIKeyState) => {
    setKeys(prev => ({
      ...prev,
      [keyType]: ''
    }));
    setStatus(prev => ({
      ...prev,
      [keyType]: 'idle'
    }));
  };

  const saveKeys = async () => {
    if (!user) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Only save keys that have values
      const keysToSave: Partial<UserAPIKeys> = {};
      Object.entries(keys).forEach(([key, value]) => {
        if (value.trim()) {
          keysToSave[key as keyof UserAPIKeys] = value;
        }
      });

      await chatFeaturesService.saveUserAPIKeys(user.id, keysToSave);
      setOriginalKeys({ ...keys });
      setSuccess('API keys succesvol opgeslagen!');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.message || 'Er is een fout opgetreden bij het opslaan');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = () => {
    return Object.keys(keys).some(key => 
      keys[key as keyof APIKeyState] !== originalKeys[key as keyof APIKeyState]
    );
  };

  const getStatusIcon = (keyStatus: KeyStatus[keyof KeyStatus]) => {
    switch (keyStatus) {
      case 'testing':
        return <TestTube className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'valid':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'invalid':
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`
        w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl
        ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Key className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold">API Keys Beheren</h3>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info */}
          <div className={`p-4 rounded-lg ${
            isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">Bring Your Own Key (BYOK)</p>
                <p className={isDark ? 'text-blue-200' : 'text-blue-700'}>
                  Gebruik je eigen API keys voor directe toegang tot AI providers. 
                  Keys worden veilig versleuteld opgeslagen en alleen door jou gebruikt.
                </p>
              </div>
            </div>
          </div>

          {/* API Keys */}
          <div className="space-y-4">
            {Object.entries(API_PROVIDERS).map(([keyType, provider]) => {
              const typedKeyType = keyType as keyof APIKeyState;
              const keyValue = keys[typedKeyType];
              const isVisible = visibility[typedKeyType];
              const keyStatus = status[typedKeyType];

              return (
                <div key={keyType} className={`p-4 rounded-lg border ${
                  isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{provider.name}</h4>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {provider.description}
                      </p>
                    </div>
                    <a
                      href={provider.helpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-500 hover:text-purple-600 text-sm"
                    >
                      API Key verkrijgen →
                    </a>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type={isVisible ? 'text' : 'password'}
                        value={keyValue}
                        onChange={(e) => updateKey(typedKeyType, e.target.value)}
                        placeholder={provider.placeholder}
                        className={`w-full p-3 pr-12 rounded-lg border ${
                          isDark 
                            ? 'bg-gray-800 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                      />
                      <button
                        onClick={() => toggleVisibility(typedKeyType)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {isVisible ? 
                          <EyeOff className="w-4 h-4 text-gray-400" /> : 
                          <Eye className="w-4 h-4 text-gray-400" />
                        }
                      </button>
                    </div>

                    {/* Test Button */}
                    <button
                      onClick={() => testKey(typedKeyType)}
                      disabled={!keyValue.trim() || keyStatus === 'testing'}
                      className={`p-3 rounded-lg border transition-colors ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                          : 'bg-white border-gray-300 hover:bg-gray-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      title="Test API key"
                    >
                      {getStatusIcon(keyStatus) || <TestTube className="w-4 h-4" />}
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => deleteKey(typedKeyType)}
                      disabled={!keyValue.trim()}
                      className={`p-3 rounded-lg border transition-colors ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 hover:bg-red-600'
                          : 'bg-white border-gray-300 hover:bg-red-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      title="Verwijder API key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Status Message */}
                  {keyStatus === 'valid' && (
                    <p className="text-sm text-green-500 mt-2">✓ API key is geldig</p>
                  )}
                  {keyStatus === 'invalid' && (
                    <p className="text-sm text-red-500 mt-2">✗ API key is ongeldig</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={saveKeys}
              disabled={!hasChanges() || isSaving}
              className="flex-1 py-3 px-4 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Opslaan...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />
                  Opslaan
                </div>
              )}
            </button>

            <button
              onClick={onClose}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                isDark
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}
            >
              Sluiten
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          {/* Security Info */}
          <div className={`text-xs p-3 rounded-lg ${
            isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
          }`}>
            <p>
              🔒 Je API keys worden versleuteld opgeslagen en alleen door jou gebruikt. 
              BelloSai heeft geen toegang tot je keys of kan deze niet inzien.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 
