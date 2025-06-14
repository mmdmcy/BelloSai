import React, { useState } from 'react';
import { X, ChevronLeft, Palette, Type, Eye, EyeOff, Sparkles, Save, Check, RotateCcw, LogOut } from 'lucide-react';
import { CustomizationSettings } from '../App';
import type { User } from '@supabase/supabase-js';
import { useSubscription } from '../hooks/useSubscription';
import { SUBSCRIPTION_PLANS } from '../lib/stripeService';

interface AccountMenuProps {
  isDark: boolean;
  onClose: () => void;
  customization: CustomizationSettings;
  onCustomizationChange: (settings: Partial<CustomizationSettings>) => void;
  user?: User | null;
  onLogout?: () => void;
}

export default function AccountMenu({ isDark, onClose, customization, onCustomizationChange, user, onLogout }: AccountMenuProps) {
  const [activeTab, setActiveTab] = useState('Account');
  const [tempCustomization, setTempCustomization] = useState<CustomizationSettings>(customization);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  // Use subscription hook
  const { 
    subscription, 
    hasActiveSubscription, 
    loading: subscriptionLoading, 
    createCheckoutSession 
  } = useSubscription();

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
    if (subscriptionLoading) return 'Loading...';
    if (hasActiveSubscription) return 'Pro Plan';
    return 'Free Plan';
  };

  const getPlanColor = () => {
    if (hasActiveSubscription) return 'bg-green-600 text-white';
    return 'bg-gray-700 text-white';
  };

  const handleUpgradeClick = async () => {
    try {
      await createCheckoutSession(SUBSCRIPTION_PLANS.MONTHLY.priceId);
    } catch (error) {
      console.error('Failed to create checkout session:', error);
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

      {/* Upgrade Section - Only show if not already subscribed */}
      {!hasActiveSubscription && (
        <div className={`p-6 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex justify-between items-start mb-4">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Upgrade to Pro
            </h3>
            <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              €6.99<span className="text-sm font-normal">/month</span>
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
            onClick={handleUpgradeClick}
            disabled={subscriptionLoading}
            className="w-full py-3 rounded-lg font-medium transition-colors text-white hover:opacity-90 disabled:opacity-50"
            style={{ 
              background: customization.gradientEnabled 
                ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                : customization.primaryColor
            }}
          >
            {subscriptionLoading ? 'Loading...' : 'Upgrade Now'}
          </button>

          <p className={`text-xs mt-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            * Premium credits are used for GPT Image Gen, Claude Sonnet, and Grok 3. Additional Premium credits can be purchased separately.
          </p>
        </div>
      )}

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

  const renderGenericTab = (title: string) => (
    <div className="space-y-6" style={{ fontFamily: customization.fontFamily }}>
      <div className={`p-8 text-center rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </h3>
        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          This section is coming soon. We're working hard to bring you more features!
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