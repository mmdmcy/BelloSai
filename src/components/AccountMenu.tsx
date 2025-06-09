import React, { useState } from 'react';
import { X, ChevronLeft, Palette, Type, Eye, EyeOff, Sparkles, Save, Check, RotateCcw } from 'lucide-react';
import { CustomizationSettings } from '../App';

interface AccountMenuProps {
  isDark: boolean;
  onClose: () => void;
  customization: CustomizationSettings;
  onCustomizationChange: (settings: Partial<CustomizationSettings>) => void;
}

export default function AccountMenu({ isDark, onClose, customization, onCustomizationChange }: AccountMenuProps) {
  const [activeTab, setActiveTab] = useState('Account');
  const [tempCustomization, setTempCustomization] = useState<CustomizationSettings>(customization);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const tabs = ['Account', 'Customization', 'History & Sync', 'Models', 'API Keys', 'Attachments', 'Contact Us'];

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

  const handleTempCustomizationChange = (changes: Partial<CustomizationSettings>) => {
    const newSettings = { ...tempCustomization, ...changes };
    setTempCustomization(newSettings);
    setHasUnsavedChanges(true);
    setSaveStatus('idle');
  };

  const handleSaveCustomization = () => {
    setSaveStatus('saving');
    
    // Simulate save delay for better UX
    setTimeout(() => {
      onCustomizationChange(tempCustomization);
      setHasUnsavedChanges(false);
      setSaveStatus('saved');
      
      // Reset save status after 2 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    }, 500);
  };

  const handleResetCustomization = () => {
    const defaultSettings: CustomizationSettings = {
      showQuestions: true,
      primaryColor: '#7c3aed',
      secondaryColor: '#a855f7',
      fontFamily: 'Inter',
      gradientEnabled: false,
      gradientColors: ['#7c3aed', '#a855f7']
    };
    
    setTempCustomization(defaultSettings);
    setHasUnsavedChanges(true);
    setSaveStatus('idle');
  };

  const renderAccountTab = () => (
    <div className="space-y-6" style={{ fontFamily: customization.fontFamily }}>
      {/* Profile Section */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-teal-600 flex items-center justify-center text-white text-2xl font-bold">
          D
        </div>
        <div>
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Dmitry Ivanov
          </h2>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            myazovy@gmail.com
          </p>
          <span className="inline-block px-3 py-1 bg-gray-700 text-white text-sm rounded-full mt-2">
            Free Plan
          </span>
        </div>
      </div>

      {/* Upgrade Section */}
      <div className={`p-6 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex justify-between items-start mb-4">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Upgrade to Pro
          </h3>
          <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            $8<span className="text-sm font-normal">/month</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-pink-500 mt-0.5" />
            <div>
              <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Access to All Models
              </h4>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Get access to our full suite of models including Claude, o3-mini-high, and more!
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-pink-500 mt-0.5" />
            <div>
              <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Generous Limits
              </h4>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Receive <strong>1500 standard credits</strong> per month, plus <strong>100 premium credits*</strong> per month.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-pink-500 mt-0.5" />
            <div>
              <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Priority Support
              </h4>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Get faster responses and dedicated assistance from the BelloSai team whenever you need help!
              </p>
            </div>
          </div>
        </div>

        <button 
          className="w-full py-3 rounded-lg font-medium transition-colors text-white hover:opacity-90"
          style={{ 
            background: customization.gradientEnabled 
              ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
              : customization.primaryColor
          }}
        >
          Upgrade Now
        </button>

        <p className={`text-xs mt-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          * Premium credits are used for GPT Image Gen, Claude Sonnet, and Grok 3. Additional Premium credits can be purchased separately.
        </p>
      </div>

      {/* Usage Stats */}
      <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <div className="flex justify-between items-center mb-2">
          <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Message Usage
          </span>
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Resets tomorrow at 2:00 AM
          </span>
        </div>
        
        <div className="flex justify-between items-center mb-2">
          <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Standard</span>
          <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>3/20</span>
        </div>
        
        <div className="w-full bg-gray-600 rounded-full h-2 mb-4">
          <div 
            className="h-2 rounded-full" 
            style={{ 
              width: '15%',
              background: customization.gradientEnabled 
                ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                : customization.primaryColor
            }}
          ></div>
        </div>
        
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          17 messages remaining
        </p>
      </div>

      {/* Keyboard Shortcuts */}
      <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <h4 className={`font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Keyboard Shortcuts
        </h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Search</span>
            <div className="flex gap-1">
              <kbd className={`px-2 py-1 text-xs rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>Ctrl</kbd>
              <kbd className={`px-2 py-1 text-xs rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>K</kbd>
            </div>
          </div>
          <div className="flex justify-between">
            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>New Chat</span>
            <div className="flex gap-1">
              <kbd className={`px-2 py-1 text-xs rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>Ctrl</kbd>
              <kbd className={`px-2 py-1 text-xs rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>Shift</kbd>
              <kbd className={`px-2 py-1 text-xs rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>O</kbd>
            </div>
          </div>
          <div className="flex justify-between">
            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Toggle Sidebar</span>
            <div className="flex gap-1">
              <kbd className={`px-2 py-1 text-xs rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>Ctrl</kbd>
              <kbd className={`px-2 py-1 text-xs rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>B</kbd>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className={`p-4 rounded-lg border-2 border-red-500/20 ${isDark ? 'bg-red-900/10' : 'bg-red-50'}`}>
        <h4 className={`font-medium mb-2 text-red-500`}>Danger Zone</h4>
        <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Permanently delete your account and all associated data.
        </p>
        <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
          Delete Account
        </button>
      </div>
    </div>
  );

  const renderCustomizationTab = () => (
    <div className="space-y-6" style={{ fontFamily: customization.fontFamily }}>
      {/* Save/Reset Controls */}
      <div className={`p-4 rounded-lg border-2 ${
        hasUnsavedChanges 
          ? 'border-orange-500/50 bg-orange-50/50' 
          : isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Customization Settings
            </h4>
            <p className={`text-sm ${
              hasUnsavedChanges 
                ? 'text-orange-600' 
                : isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {hasUnsavedChanges ? 'You have unsaved changes' : 'All changes saved'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleResetCustomization}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
                isDark 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Default
            </button>
            
            <button
              onClick={handleSaveCustomization}
              disabled={!hasUnsavedChanges || saveStatus === 'saving'}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
                !hasUnsavedChanges || saveStatus === 'saving'
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : saveStatus === 'saved'
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {saveStatus === 'saving' && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {saveStatus === 'saved' && <Check className="w-4 h-4" />}
              {saveStatus === 'idle' && <Save className="w-4 h-4" />}
              
              {saveStatus === 'saving' ? 'Saving...' : 
               saveStatus === 'saved' ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Show Questions Toggle */}
      <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Show Sample Questions
            </h4>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Display sample questions on the main page
            </p>
          </div>
          <button
            onClick={() => handleTempCustomizationChange({ showQuestions: !tempCustomization.showQuestions })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              tempCustomization.showQuestions ? 'bg-purple-600' : isDark ? 'bg-gray-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                tempCustomization.showQuestions ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Color Picker */}
      <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <h4 className={`font-medium mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <Palette className="w-5 h-5" />
          Color Theme
        </h4>
        
        <div className="grid grid-cols-3 gap-3 mb-4">
          {colorPresets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handleTempCustomizationChange({ 
                primaryColor: preset.primary, 
                secondaryColor: preset.secondary 
              })}
              className={`p-3 rounded-lg border-2 transition-all ${
                tempCustomization.primaryColor === preset.primary
                  ? 'border-white shadow-lg'
                  : 'border-transparent hover:border-gray-300'
              }`}
              style={{ 
                background: tempCustomization.gradientEnabled 
                  ? `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})`
                  : preset.primary 
              }}
            >
              <div className="text-white text-sm font-medium">{preset.name}</div>
            </button>
          ))}
        </div>

        {/* Custom Color Inputs */}
        <div className="space-y-3">
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Primary Color
            </label>
            <input
              type="color"
              value={tempCustomization.primaryColor}
              onChange={(e) => handleTempCustomizationChange({ primaryColor: e.target.value })}
              className="w-full h-10 rounded border"
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Secondary Color
            </label>
            <input
              type="color"
              value={tempCustomization.secondaryColor}
              onChange={(e) => handleTempCustomizationChange({ secondaryColor: e.target.value })}
              className="w-full h-10 rounded border"
            />
          </div>
        </div>
      </div>

      {/* Font Selection */}
      <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <h4 className={`font-medium mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <Type className="w-5 h-5" />
          Font Family
        </h4>
        
        <select
          value={tempCustomization.fontFamily}
          onChange={(e) => handleTempCustomizationChange({ fontFamily: e.target.value })}
          className={`w-full p-3 rounded-lg border ${
            isDark 
              ? 'bg-gray-700 border-gray-600 text-white' 
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          {fontOptions.map((font) => (
            <option key={font} value={font} style={{ fontFamily: font }}>
              {font}
            </option>
          ))}
        </select>
      </div>

      {/* Gradient Toggle */}
      <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Gradient Effects
            </h4>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Enable gradient backgrounds and effects
            </p>
          </div>
          <button
            onClick={() => handleTempCustomizationChange({ gradientEnabled: !tempCustomization.gradientEnabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              tempCustomization.gradientEnabled ? 'bg-purple-600' : isDark ? 'bg-gray-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                tempCustomization.gradientEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`w-full max-w-6xl h-[90vh] rounded-lg shadow-xl ${
        isDark ? 'bg-gray-900' : 'bg-white'
      } flex overflow-hidden`} style={{ fontFamily: customization.fontFamily }}>
        
        {/* Header */}
        <div className="w-full">
          <div className={`flex items-center justify-between p-6 border-b ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h1 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Back to Chat
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <button className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
              }`}>
                <span className="text-sm">Sign out</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className={`flex border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab
                    ? isDark
                      ? 'text-white border-b-2 border-purple-500 bg-gray-800'
                      : 'text-gray-900 border-b-2 border-purple-500 bg-gray-50'
                    : isDark
                      ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab}
                {tab === 'Customization' && hasUnsavedChanges && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto h-[calc(90vh-140px)]">
            {activeTab === 'Account' && renderAccountTab()}
            {activeTab === 'Customization' && renderCustomizationTab()}
            {activeTab === 'History & Sync' && (
              <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                History & Sync settings coming soon...
              </div>
            )}
            {activeTab === 'Models' && (
              <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Model settings coming soon...
              </div>
            )}
            {activeTab === 'API Keys' && (
              <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                API Keys management coming soon...
              </div>
            )}
            {activeTab === 'Attachments' && (
              <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Attachment settings coming soon...
              </div>
            )}
            {activeTab === 'Contact Us' && (
              <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Contact information coming soon...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}