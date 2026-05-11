import { io, Socket } from 'socket.io-client'
import type { WSEvent } from '@/lib/types'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8000'

class WebSocketService {
  private socket: Socket | null = null
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  connect(token?: string) {
    // Se já está conectado com token, não reconecta
    if (this.socket?.connected) {
      // Mas se agora temos token, reconecta com autenticação
      if (token && !this.socket.auth) {
        this.socket.disconnect()
        this.socket = null
      } else {
        return
      }
    }

    this.socket = io(WS_URL, {
      path: '/games/socket.io',
      transports: ['websocket', 'polling'],
      auth: token ? { token } : undefined,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    this.socket.on('connect', () => {
      console.log('[WebSocket] Conectado')
      this.reconnectAttempts = 0
    })

    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Desconectado:', reason)
    })

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Erro de conexão:', error.message)
      this.reconnectAttempts++
    })

    // Game events
    this.socket.on('round:start', (data) => this.emit('round:start', data))
    this.socket.on('betting:end', (data) => this.emit('betting:end', data))
    this.socket.on('multiplier:tick', (data) => this.emit('multiplier:tick', data))
    this.socket.on('round:crash', (data) => this.emit('round:crash', data))
    this.socket.on('bet:placed', (data) => this.emit('bet:placed', data))
    this.socket.on('bet:cashout', (data) => this.emit('bet:cashout', data))
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.listeners.clear()
  }

  on(event: WSEvent['type'], callback: (data: unknown) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)

    return () => {
      this.listeners.get(event)?.delete(callback)
    }
  }

  off(event: WSEvent['type'], callback: (data: unknown) => void) {
    this.listeners.get(event)?.delete(callback)
  }

  private emit(event: string, data: unknown) {
    this.listeners.get(event)?.forEach((callback) => callback(data))
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false
  }
}

export const wsService = new WebSocketService()
