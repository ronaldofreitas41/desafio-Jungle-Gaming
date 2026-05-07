import type { AuthUser, KeycloakToken } from '@/lib/types'

const KEYCLOAK_URL = process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080'
const REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'crash-game'
const CLIENT_ID = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'crash-game-client'
const REDIRECT_URI = typeof window !== 'undefined' 
  ? `${window.location.origin}/auth/callback` 
  : ''

// Generate random string for PKCE
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const values = new Uint8Array(length)
  crypto.getRandomValues(values)
  return Array.from(values).map(v => chars[v % chars.length]).join('')
}

// SHA256 hash for PKCE
async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  return crypto.subtle.digest('SHA-256', data)
}

// Base64 URL encode
function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  bytes.forEach(b => binary += String.fromCharCode(b))
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// Generate code challenge for PKCE
async function generateCodeChallenge(verifier: string): Promise<string> {
  const hash = await sha256(verifier)
  return base64UrlEncode(hash)
}

// Parse JWT token
function parseJwt(token: string): Record<string, unknown> {
  const base64Url = token.split('.')[1]
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  )
  return JSON.parse(jsonPayload)
}

class AuthService {
  private codeVerifier: string | null = null
  
  // Start OAuth flow - redirect to Keycloak
  async login() {
    this.codeVerifier = generateRandomString(64)
    const codeChallenge = await generateCodeChallenge(this.codeVerifier)
    const state = generateRandomString(32)
    
    // Store verifier and state in sessionStorage
    sessionStorage.setItem('pkce_code_verifier', this.codeVerifier)
    sessionStorage.setItem('oauth_state', state)
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: 'openid profile email',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    })
    
    const authUrl = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/auth?${params.toString()}`
    window.location.href = authUrl
  }
  
  // Handle OAuth callback
  async handleCallback(code: string, state: string): Promise<AuthUser> {
    const storedState = sessionStorage.getItem('oauth_state')
    const codeVerifier = sessionStorage.getItem('pkce_code_verifier')
    
    if (state !== storedState) {
      throw new Error('State inválido')
    }
    
    if (!codeVerifier) {
      throw new Error('Code verifier não encontrado')
    }
    
    // Exchange code for tokens
    const tokenResponse = await fetch(
      `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: CLIENT_ID,
          code,
          redirect_uri: REDIRECT_URI,
          code_verifier: codeVerifier,
        }),
      }
    )
    
    if (!tokenResponse.ok) {
      throw new Error('Falha ao obter tokens')
    }
    
    const tokens: KeycloakToken = await tokenResponse.json()
    
    // Parse user info from access token
    const payload = parseJwt(tokens.access_token)
    
    const user: AuthUser = {
      id: payload.sub as string,
      username: (payload.preferred_username as string) || (payload.name as string) || 'Jogador',
      email: payload.email as string | undefined,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    }
    
    // Store in localStorage
    this.saveUser(user)
    
    // Clean up
    sessionStorage.removeItem('pkce_code_verifier')
    sessionStorage.removeItem('oauth_state')
    
    return user
  }
  
  // Refresh access token
  async refreshToken(refreshToken: string): Promise<KeycloakToken> {
    const response = await fetch(
      `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: CLIENT_ID,
          refresh_token: refreshToken,
        }),
      }
    )
    
    if (!response.ok) {
      throw new Error('Falha ao renovar token')
    }
    
    return response.json()
  }
  
  // Logout
  async logout() {
    const user = this.getStoredUser()
    
    // Clear local storage first
    localStorage.removeItem('crash_game_user')
    
    // Redirect to Keycloak logout
    if (user?.refreshToken) {
      const params = new URLSearchParams({
        client_id: CLIENT_ID,
        refresh_token: user.refreshToken,
        post_logout_redirect_uri: window.location.origin,
      })
      
      window.location.href = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/logout?${params.toString()}`
    } else {
      window.location.href = '/'
    }
  }
  
  // Save user to localStorage
  saveUser(user: AuthUser) {
    localStorage.setItem('crash_game_user', JSON.stringify(user))
  }
  
  // Get stored user
  getStoredUser(): AuthUser | null {
    if (typeof window === 'undefined') return null
    
    const stored = localStorage.getItem('crash_game_user')
    if (!stored) return null
    
    try {
      return JSON.parse(stored) as AuthUser
    } catch {
      return null
    }
  }
  
  // Check if token is expired
  isTokenExpired(token: string): boolean {
    try {
      const payload = parseJwt(token)
      const exp = payload.exp as number
      return Date.now() >= exp * 1000
    } catch {
      return true
    }
  }
}

export const authService = new AuthService()
