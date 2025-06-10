/**
 * Authentication Integration for BelloSai Grid System
 * 
 * This file provides the authentication state management and layout configuration
 * for integrating login, signup, and account buttons into the existing grid system.
 */

import { authService } from './auth'
import type { AuthUser } from './auth'

// Authentication state interface
export interface AuthState {
  user: AuthUser | null
  loading: boolean
  error: string | null
}

// Extended layout configuration with auth buttons
export interface ExtendedLayoutConfig {
  // Existing components
  sidebar: { x: number; y: number; width: number; height: number; zIndex: number }
  mainContent: { x: number; y: number; width: number; height: number; zIndex: number }
  themeToggle: { x: number; y: number; width: number; height: number; zIndex: number }
  topBar: { x: number; y: number; width: number; height: number; zIndex: number }
  inputBox: { x: number; y: number; width: number; height: number; zIndex: number }
  designerButton: { x: number; y: number; width: number; height: number; zIndex: number }
  settingsButton: { x: number; y: number; width: number; height: number; zIndex: number }
  appLogo: { x: number; y: number; width: number; height: number; zIndex: number }
  newChatButton: { x: number; y: number; width: number; height: number; zIndex: number }
  newGameButton: { x: number; y: number; width: number; height: number; zIndex: number }
  searchButton: { x: number; y: number; width: number; height: number; zIndex: number }
  accountPanel: { x: number; y: number; width: number; height: number; zIndex: number }
  // New authentication buttons
  loginButton: { x: number; y: number; width: number; height: number; zIndex: number }
  signupButton: { x: number; y: number; width: number; height: number; zIndex: number }
  accountButton: { x: number; y: number; width: number; height: number; zIndex: number }
}

// Mobile-specific layout configuration
export interface MobileLayoutConfig {
  mobileHeader: { x: number; y: number; width: number; height: number; zIndex: number }
  mobileMenuButton: { x: number; y: number; width: number; height: number; zIndex: number }
  mobileAppLogo: { x: number; y: number; width: number; height: number; zIndex: number }
  mobileThemeToggle: { x: number; y: number; width: number; height: number; zIndex: number }
  mobileAuthButton: { x: number; y: number; width: number; height: number; zIndex: number }
  mobileMainContent: { x: number; y: number; width: number; height: number; zIndex: number }
  mobileNewChat: { x: number; y: number; width: number; height: number; zIndex: number }
  mobileNewGame: { x: number; y: number; width: number; height: number; zIndex: number }
  mobileSearch: { x: number; y: number; width: number; height: number; zIndex: number }
  mobileDesignerMode: { x: number; y: number; width: number; height: number; zIndex: number }
}

// Default layout with authentication buttons
export const defaultLayoutWithAuth: ExtendedLayoutConfig = {
  sidebar: { x: 0, y: 5, width: 3, height: 9, zIndex: 1 },
  mainContent: { x: 5, y: 1, width: 10, height: 12, zIndex: 1 },
  themeToggle: { x: 17, y: 0, width: 1, height: 1, zIndex: 4 },
  topBar: { x: 0, y: 0, width: 20, height: 1, zIndex: 2 },
  inputBox: { x: 4, y: 13, width: 12, height: 2, zIndex: 1 },
  designerButton: { x: 19, y: 0, width: 1, height: 1, zIndex: 999 },
  settingsButton: { x: 18, y: 0, width: 1, height: 1, zIndex: 4 },
  appLogo: { x: 0, y: 1, width: 3, height: 1, zIndex: 3 },
  newGameButton: { x: 0, y: 2, width: 3, height: 1, zIndex: 3 },
  newChatButton: { x: 0, y: 3, width: 3, height: 1, zIndex: 3 },
  searchButton: { x: 0, y: 4, width: 3, height: 1, zIndex: 3 },
  accountPanel: { x: 0, y: 15, width: 3, height: 1, zIndex: 3 },
  // Authentication buttons positioned in top bar
  loginButton: { x: 14, y: 0, width: 1, height: 1, zIndex: 4 },
  signupButton: { x: 15, y: 0, width: 1, height: 1, zIndex: 4 },
  accountButton: { x: 16, y: 0, width: 1, height: 1, zIndex: 4 }
}

// Default mobile layout configuration (20x15 grid like desktop)
export const defaultMobileLayout: MobileLayoutConfig = {
  mobileHeader: { x: 0, y: 0, width: 20, height: 2, zIndex: 10 },
  mobileMenuButton: { x: 0, y: 0, width: 2, height: 2, zIndex: 11 },
  mobileAppLogo: { x: 8, y: 0, width: 4, height: 2, zIndex: 11 },
  mobileThemeToggle: { x: 16, y: 0, width: 2, height: 2, zIndex: 11 },
  mobileAuthButton: { x: 18, y: 0, width: 2, height: 2, zIndex: 11 },
  mobileMainContent: { x: 0, y: 2, width: 20, height: 13, zIndex: 1 },
  // Menu items (these appear in the slide-out menu)
  mobileNewChat: { x: 0, y: 3, width: 8, height: 2, zIndex: 50 },
  mobileNewGame: { x: 0, y: 5, width: 8, height: 2, zIndex: 50 },
  mobileSearch: { x: 0, y: 7, width: 8, height: 2, zIndex: 50 },
  mobileDesignerMode: { x: 0, y: 9, width: 8, height: 2, zIndex: 50 }
}

// Authentication service wrapper
export class AuthManager {
  private authState: AuthState = {
    user: null,
    loading: true,
    error: null
  }

  private listeners: Array<(state: AuthState) => void> = []

  constructor() {
    this.initializeAuth()
  }

  // Initialize authentication
  private async initializeAuth() {
    try {
      const session = await authService.getSession()
      if (session?.user) {
        const userProfile = await authService.getUserProfile()
        this.updateState({ user: userProfile, loading: false, error: null })
      } else {
        this.updateState({ user: null, loading: false, error: null })
      }

      // Listen for auth changes
      authService.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const userProfile = await authService.getUserProfile()
          this.updateState({ user: userProfile, loading: false, error: null })
        } else {
          this.updateState({ user: null, loading: false, error: null })
        }
      })
    } catch (error) {
      this.updateState({ 
        user: null, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Authentication error' 
      })
    }
  }

  // Update state and notify listeners
  private updateState(newState: Partial<AuthState>) {
    this.authState = { ...this.authState, ...newState }
    this.listeners.forEach(listener => listener(this.authState))
  }

  // Subscribe to auth state changes
  subscribe(listener: (state: AuthState) => void) {
    this.listeners.push(listener)
    // Immediately call with current state
    listener(this.authState)
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  // Get current auth state
  getState(): AuthState {
    return this.authState
  }

  // Sign in
  async signIn(email: string, password: string): Promise<void> {
    try {
      this.updateState({ loading: true, error: null })
      await authService.signIn({ email, password })
      // State will be updated via auth state change listener
    } catch (error) {
      this.updateState({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Sign in failed' 
      })
      throw error
    }
  }

  // Sign up
  async signUp(email: string, password: string, fullName?: string): Promise<void> {
    try {
      this.updateState({ loading: true, error: null })
      await authService.signUp({ email, password, full_name: fullName })
      // State will be updated via auth state change listener
    } catch (error) {
      this.updateState({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Sign up failed' 
      })
      throw error
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      this.updateState({ loading: true, error: null })
      await authService.signOut()
      this.updateState({ user: null, loading: false, error: null })
    } catch (error) {
      this.updateState({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Sign out failed' 
      })
      throw error
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.authState.user !== null
  }

  // Get current user
  getCurrentUser(): AuthUser | null {
    return this.authState.user
  }
}

// Layout persistence utilities
export class LayoutManager {
  private static STORAGE_KEY = 'bellosai_layout_config'
  private static MOBILE_STORAGE_KEY = 'bellosai_mobile_layout_config'

  // Save layout to localStorage (syncs across tabs)
  static saveLayout(layout: ExtendedLayoutConfig): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(layout))
    } catch (error) {
      console.error('Failed to save layout:', error)
    }
  }

  // Save mobile layout to localStorage
  static saveMobileLayout(layout: MobileLayoutConfig): void {
    try {
      localStorage.setItem(this.MOBILE_STORAGE_KEY, JSON.stringify(layout))
    } catch (error) {
      console.error('Failed to save mobile layout:', error)
    }
  }

  // Load layout from localStorage
  static loadLayout(): ExtendedLayoutConfig | null {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY)
      return saved ? JSON.parse(saved) : null
    } catch (error) {
      console.error('Failed to load layout:', error)
      return null
    }
  }

  // Load mobile layout from localStorage
  static loadMobileLayout(): MobileLayoutConfig | null {
    try {
      const saved = localStorage.getItem(this.MOBILE_STORAGE_KEY)
      return saved ? JSON.parse(saved) : null
    } catch (error) {
      console.error('Failed to load mobile layout:', error)
      return null
    }
  }

  // Get layout (saved or default)
  static getLayout(): ExtendedLayoutConfig {
    return this.loadLayout() || defaultLayoutWithAuth
  }

  // Get mobile layout (saved or default)
  static getMobileLayout(): MobileLayoutConfig {
    return this.loadMobileLayout() || defaultMobileLayout
  }

  // Update and save layout
  static updateLayout(updates: Partial<ExtendedLayoutConfig>): ExtendedLayoutConfig {
    const currentLayout = this.getLayout()
    const newLayout = { ...currentLayout, ...updates }
    this.saveLayout(newLayout)
    return newLayout
  }

  // Update and save mobile layout
  static updateMobileLayout(updates: Partial<MobileLayoutConfig>): MobileLayoutConfig {
    const currentLayout = this.getMobileLayout()
    const newLayout = { ...currentLayout, ...updates }
    this.saveMobileLayout(newLayout)
    return newLayout
  }

  // Reset to default layout
  static resetLayout(): ExtendedLayoutConfig {
    this.saveLayout(defaultLayoutWithAuth)
    return defaultLayoutWithAuth
  }

  // Reset to default mobile layout
  static resetMobileLayout(): MobileLayoutConfig {
    this.saveMobileLayout(defaultMobileLayout)
    return defaultMobileLayout
  }
}

// Sync layout to Supabase for cross-device persistence
export class CloudLayoutSync {
  private authManager: AuthManager

  constructor(authManager: AuthManager) {
    this.authManager = authManager
  }

  // Save layout to user's cloud storage
  async saveToCloud(layout: ExtendedLayoutConfig): Promise<void> {
    const user = this.authManager.getCurrentUser()
    if (!user) return

    try {
      await authService.updateProfile({
        api_keys: {
          ...user.api_keys,
          layout_config: JSON.stringify(layout)
        }
      })
    } catch (error) {
      console.error('Failed to save layout to cloud:', error)
    }
  }

  // Load layout from user's cloud storage
  async loadFromCloud(): Promise<ExtendedLayoutConfig | null> {
    const user = this.authManager.getCurrentUser()
    if (!user?.api_keys?.layout_config) return null

    try {
      return JSON.parse(user.api_keys.layout_config as string) as ExtendedLayoutConfig
    } catch (error) {
      console.error('Failed to load layout from cloud:', error)
      return null
    }
  }

  // Sync layout (load from cloud, merge with local, save back)
  async syncLayout(): Promise<ExtendedLayoutConfig> {
    const localLayout = LayoutManager.getLayout()
    const cloudLayout = await this.loadFromCloud()
    
    // Use cloud layout if available, otherwise use local
    const finalLayout = cloudLayout || localLayout
    
    // Save to both local and cloud
    LayoutManager.saveLayout(finalLayout)
    await this.saveToCloud(finalLayout)
    
    return finalLayout
  }
}

// Create singleton instances
export const authManager = new AuthManager()
export const layoutManager = LayoutManager
export const cloudLayoutSync = new CloudLayoutSync(authManager)

/**
 * Integration Instructions for App.tsx:
 * 
 * 1. Import the auth manager:
 *    import { authManager, layoutManager, ExtendedLayoutConfig } from './lib/auth-integration'
 * 
 * 2. Add auth state in your component:
 *    const [authState, setAuthState] = useState(authManager.getState())
 *    const [layout, setLayout] = useState<ExtendedLayoutConfig>(layoutManager.getLayout())
 * 
 * 3. Subscribe to auth changes in useEffect:
 *    useEffect(() => {
 *      const unsubscribe = authManager.subscribe(setAuthState)
 *      return unsubscribe
 *    }, [])
 * 
 * 4. Add auth buttons to your grid system:
 *    - Show loginButton and signupButton when !authState.user
 *    - Show accountButton when authState.user
 *    - Use the same grid positioning system as other components
 * 
 * 5. Save layout changes:
 *    const updateLayout = (newLayout) => {
 *      setLayout(newLayout)
 *      layoutManager.saveLayout(newLayout)
 *      if (authState.user) cloudLayoutSync.saveToCloud(newLayout)
 *    }
 */ 