import React, { useState } from 'react';
import { X, ChevronLeft, Palette, Type, Eye, EyeOff, Sparkles, Save, Check, RotateCcw, LogOut, Brush } from 'lucide-react';
import { CustomizationSettings } from '../types/app';
import { AVAILABLE_THEMES } from '../theme/registry';
import type { User } from '@supabase/supabase-js';
import { useSubscription } from '../hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface AccountMenuProps {
  isDark: boolean;
  onClose: () => void;
  customization: CustomizationSettings;
  onCustomizationChange: (settings: Partial<CustomizationSettings>) => void;
  user?: User | null;
  onLogout?: () => void;
  onOpenAPIKeyManager?: () => void;
}

export default function AccountMenu({ isDark, onClose, customization, onCustomizationChange, user, onLogout, onOpenAPIKeyManager }: AccountMenuProps) {
  const [activeTab, setActiveTab] = useState('Account');
  const [tempCustomization, setTempCustomization] = useState<CustomizationSettings>(customization);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [syncLoading, setSyncLoading] = useState(false);
  const navigate = useNavigate();
  // Token bundle balances
  const [tokenLoading, setTokenLoading] = useState<boolean>(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [lightCredits, setLightCredits] = useState<number>(0);
  const [mediumCredits, setMediumCredits] = useState<number>(0);
  const [heavyCredits, setHeavyCredits] = useState<number>(0);
  
  // Use subscription hook
  const { 
    subscription, 
    hasActiveSubscription, 
    loading: subscriptionLoading, 
    refreshSubscription 
  } = useSubscription();

  // Add a local timeout to override subscription loading if it takes too long
  const [localSubscriptionLoading, setLocalSubscriptionLoading] = React.useState(true);
  
  React.useEffect(() => {
    if (!subscriptionLoading) {
      setLocalSubscriptionLoading(false);
    } else {
      // Force subscription loading to false after 5 seconds
      const timeout = setTimeout(() => {
        setLocalSubscriptionLoading(false);
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [subscriptionLoading]);

  const tabs = ['Account', 'Customization', 'History & Sync', 'Models', 'API Keys', 'Attachments', 'Contact Me'];

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
      gradientColors: ['#7c3aed', '#a855f7'],
      selectedTheme: 'default'
    };
    
    setTempCustomization(defaultSettings);
    setHasUnsavedChanges(true);
    setSaveStatus('idle');
  };

  // Get user display name and initial
  const getUserDisplayName = () => {
    if (!user) return 'Guest';
    return user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  };

  const getUserInitial = () => {
    if (!user) return 'G';
    const name = getUserDisplayName();
    return name.charAt(0).toUpperCase();
  };

  const getPlanStatus = () => {
    return 'Token Bundles';
  };

  const getPlanColor = () => {
    if (hasActiveSubscription) return 'bg-green-600 text-white';
    return 'bg-gray-700 text-white';
  };

  const handleGoToPricing = () => {
    navigate('/pricing');
  };

  const handleSyncSubscription = async () => {
    if (syncLoading) return;
    
    setSyncLoading(true);
    
    try {
      await refreshSubscription();
      alert('Subscription status has been updated!');
    } catch (error) {
      console.error('❌ [AccountMenu] Failed to sync subscription:', error);
      alert('Something went wrong while syncing. Please try again.');
    } finally {
      setSyncLoading(false);
    }
  };

  const renderAccountTab = () => (
    <div className="space-y-6" style={{ fontFamily: customization.fontFamily }}>
      {/* Profile Section */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
             style={{ 
               background: customization.gradientEnabled 
                 ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                 : customization.primaryColor
             }}>
          {getUserInitial()}
        </div>
        <div className="flex-1">
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {getUserDisplayName()}
          </h2>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {user?.email || 'Not logged in'}
          </p>
          <span className={`inline-block px-3 py-1 text-sm rounded-full mt-2 ${getPlanColor()}`}>
            {getPlanStatus()}
          </span>
        </div>
        {user && onLogout && (
          <button
            onClick={onLogout}
            className={`p-2 rounded-lg transition-colors ${
              isDark 
                ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700' 
                : 'text-gray-600 hover:text-red-600 hover:bg-gray-100'
            }`}
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Token Bundles Section */}
      <div className={`p-6 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex justify-between items-start mb-4">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Token bundles
          </h3>
          <button
            onClick={handleGoToPricing}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
          >
            Buy tokens
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`${isDark ? 'bg-gray-900/50' : 'bg-gray-50'} rounded-lg p-4`}>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Light credits</p>
            <p className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{tokenLoading ? '—' : lightCredits}</p>
          </div>
          <div className={`${isDark ? 'bg-gray-900/50' : 'bg-gray-50'} rounded-lg p-4`}>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Medium credits</p>
            <p className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{tokenLoading ? '—' : mediumCredits}</p>
          </div>
          <div className={`${isDark ? 'bg-gray-900/50' : 'bg-gray-50'} rounded-lg p-4`}>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Heavy credits</p>
            <p className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{tokenLoading ? '—' : heavyCredits}</p>
          </div>
        </div>

        {tokenError && (
          <p className="text-sm text-red-500 mt-3">{tokenError}</p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            onClick={async () => { await fetchTokenBalances(); }}
            disabled={tokenLoading}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'} disabled:opacity-50`}
          >
            {tokenLoading ? 'Refreshing…' : 'Refresh balances'}
          </button>
          <button
            onClick={handleGoToPricing}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            Go to Pricing
          </button>
        </div>
      </div>

      {/* Current Subscription Info - Show if subscribed */}
      {hasActiveSubscription && subscription && (
        <div className={`p-6 rounded-lg border ${isDark ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'}`}>
          <div className="flex justify-between items-start mb-4">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-green-300' : 'text-green-800'}`}>
              Pro Subscription Active
            </h3>
            <span className={`text-sm px-3 py-1 rounded-full ${isDark ? 'bg-green-800 text-green-200' : 'bg-green-200 text-green-800'}`}>
              {subscription.subscription_status}
            </span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Plan:</span>
              <span className={isDark ? 'text-white' : 'text-gray-900'}>Pro Monthly</span>
            </div>
            {subscription.current_period_end && (
              <div className="flex justify-between">
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Next billing:</span>
                <span className={isDark ? 'text-white' : 'text-gray-900'}>
                  {new Date(subscription.current_period_end * 1000).toLocaleDateString()}
                </span>
              </div>
            )}
            {subscription.cancel_at_period_end && (
              <div className={`text-sm p-3 rounded-lg ${isDark ? 'bg-yellow-900/20 text-yellow-300' : 'bg-yellow-50 text-yellow-800'}`}>
                Your subscription will cancel at the end of the current billing period.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subscription Sync Section - Always show when logged in */}
      {user && (
        <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex justify-between items-center">
            <div>
              <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Subscription Status
              </h4>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Just purchased a subscription? Sync your status.
              </p>
            </div>
            <button
              onClick={handleSyncSubscription}
              disabled={syncLoading}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                isDark 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50'
              }`}
            >
              {syncLoading ? 'Syncing...' : 'Sync Status'}
            </button>
          </div>
        </div>
      )}

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
          <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {hasActiveSubscription ? '150/1500' : '3/20'}
          </span>
        </div>
        
        <div className="w-full bg-gray-600 rounded-full h-2 mb-4">
          <div 
            className="h-2 rounded-full" 
            style={{ 
              width: hasActiveSubscription ? '10%' : '15%',
              background: customization.gradientEnabled 
                ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                : customization.primaryColor
            }}
          />
        </div>
        
        {hasActiveSubscription && (
          <>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Premium</span>
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>5/100</span>
            </div>
            
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500" 
                style={{ width: '5%' }}
              />
            </div>
          </>
        )}
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

      {/* Theme Selection */}
      <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <h4 className={`font-medium mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <Brush className="w-5 h-5" />
          Visual Theme
        </h4>
        
        <div className="grid grid-cols-1 gap-3 mb-4">
          {AVAILABLE_THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleTempCustomizationChange({ 
                selectedTheme: theme.id,
                primaryColor: theme.primaryColor,
                secondaryColor: theme.secondaryColor,
                fontFamily: theme.fontFamily,
                gradientEnabled: theme.gradientEnabled
              })}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                tempCustomization.selectedTheme === theme.id
                  ? 'border-purple-500 bg-purple-50'
                  : isDark 
                    ? 'border-gray-600 hover:border-gray-500' 
                    : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {theme.name}
                  </div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {theme.description}
                  </div>
                </div>
                <div className="flex gap-2">
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: theme.primaryColor }}
                  />
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: theme.secondaryColor }}
                  />
                </div>
              </div>
            </button>
          ))}
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

  const renderAPIKeysTab = () => (
    <div className="space-y-6" style={{ fontFamily: customization.fontFamily }}>
      <div className={`p-8 text-center rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          API Keys (BYOK)
        </h3>
        <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          This section is coming soon. I'm working hard to bring you more features!
        </p>
      </div>
    </div>
  );

  const renderGenericTab = (title: string) => (
    <div className="space-y-6" style={{ fontFamily: customization.fontFamily }}>
      <div className={`p-8 text-center rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </h3>
        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          This section is coming soon. I'm working hard to bring you more features!
        </p>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Account':
        return renderAccountTab();
      case 'Customization':
        return renderCustomizationTab();
      case 'API Keys':
        return renderAPIKeysTab();
      default:
        return renderGenericTab(activeTab);
    }
  };

  return (
    <div 
      className={`w-[800px] max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl overflow-hidden ${
        isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
      }`}
      style={{ fontFamily: customization.fontFamily }}
    >
      {/* Header */}
      <div className={`flex items-center justify-between p-6 border-b ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <h2 className="text-2xl font-bold">Account Settings</h2>
        <button
          onClick={onClose}
          className={`p-2 rounded-lg transition-colors ${
            isDark 
              ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex h-[600px]">
        {/* Sidebar */}
        <div className={`w-64 border-r ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
          <nav className="p-4 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab
                    ? isDark
                      ? 'bg-gray-700 text-white'
                      : 'bg-white text-gray-900 shadow-sm'
                    : isDark
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      : 'text-gray-600 hover:bg-white hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
