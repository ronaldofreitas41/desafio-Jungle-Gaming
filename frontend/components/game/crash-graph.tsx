'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useGameStore } from '@/stores/game-store'
import { cn } from '@/lib/utils'

interface Point {
  x: number
  y: number
  time: number
}

// Componente responsável por renderizar o gráfico animado do multiplicador
export function CrashGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const pointsRef = useRef<Point[]>([])
  const startTimeRef = useRef<number>(0)
  
  const { status, multiplier, bettingEndsAt, currentRound } = useGameStore()
  const [countdown, setCountdown] = useState<number>(0)
  const [displayMultiplier, setDisplayMultiplier] = useState(1.00)
  
  // Anima o multiplicador no centro do gráfico
  useEffect(() => {
    if (status === 'running' || status === 'crashed') {
      setDisplayMultiplier(multiplier)
    } else {
      setDisplayMultiplier(1.00)
    }
  }, [multiplier, status])
  
  // Gerencia o temporizador da fase de apostas
  useEffect(() => {
    if (status !== 'betting' || !bettingEndsAt) {
      setCountdown(0)
      return
    }
    
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((bettingEndsAt - Date.now()) / 1000))
      setCountdown(remaining)
    }
    
    updateCountdown()
    const interval = setInterval(updateCountdown, 100)
    
    return () => clearInterval(interval)
  }, [status, bettingEndsAt])
  
  // Calcula dinamicamente o zoom dos eixos X e Y conforme o multiplicador cresce
  const getAxisRanges = useCallback((points: Point[], currentMult: number) => {
    if (points.length === 0) {
      return { minX: 0, maxX: 10, minY: 1, maxY: 2 }
    }
    
    const maxTime = points[points.length - 1]?.time || 10
    const maxMult = Math.max(currentMult, ...points.map(p => p.y))
    
    // Escala X dinâmica - expande conforme o tempo passa
    const baseTimeWindow = 10
    const maxX = Math.max(baseTimeWindow, Math.ceil(maxTime / 5) * 5 + 5)
    
    // Escala Y dinâmica - mantém espaço acima do multiplicador atual
    const headroom = Math.max(0.5, maxMult * 0.3)
    const maxY = Math.max(2, Math.ceil((maxMult + headroom) * 2) / 2)
    
    return { minX: 0, maxX, minY: 1, maxY }
  }, [])
  
  // Gera os valores dos ticks nos eixos (números de referência)
  const getAxisTicks = useCallback((min: number, max: number, count: number, isMultiplier: boolean) => {
    const range = max - min
    const step = range / count
    const ticks: number[] = []
    
    for (let i = 0; i <= count; i++) {
      const value = min + step * i
      ticks.push(isMultiplier ? Math.round(value * 100) / 100 : Math.round(value))
    }
    
    return ticks
  }, [])
  
  // Função principal de desenho do Canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Set canvas size
    const dpr = window.devicePixelRatio || 1
    const rect = container.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`
    
    const width = rect.width
    const height = rect.height
    const padding = { top: 30, right: 20, bottom: 40, left: 55 }
    
    const graphWidth = width - padding.left - padding.right
    const graphHeight = height - padding.top - padding.bottom
    
    // Clear canvas
    ctx.fillStyle = '#0f0f1a'
    ctx.fillRect(0, 0, width, height)
    
    // Get dynamic axis ranges
    const { minX, maxX, minY, maxY } = getAxisRanges(pointsRef.current, displayMultiplier)
    
    // Get tick values
    const xTicks = getAxisTicks(minX, maxX, 5, false)
    const yTicks = getAxisTicks(minY, maxY, 5, true)
    
    // Helper functions to convert data coordinates to canvas coordinates
    const toCanvasX = (dataX: number) => {
      return padding.left + (dataX - minX) / (maxX - minX) * graphWidth
    }
    
    const toCanvasY = (dataY: number) => {
      return padding.top + graphHeight - (dataY - minY) / (maxY - minY) * graphHeight
    }
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.lineWidth = 1
    
    // Horizontal grid lines (for Y ticks)
    yTicks.forEach(tick => {
      const y = toCanvasY(tick)
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(width - padding.right, y)
      ctx.stroke()
    })
    
    // Vertical grid lines (for X ticks)
    xTicks.forEach(tick => {
      const x = toCanvasX(tick)
      ctx.beginPath()
      ctx.moveTo(x, padding.top)
      ctx.lineTo(x, height - padding.bottom)
      ctx.stroke()
    })
    
    // Draw axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.lineWidth = 1
    
    // Y axis
    ctx.beginPath()
    ctx.moveTo(padding.left, padding.top)
    ctx.lineTo(padding.left, height - padding.bottom)
    ctx.stroke()
    
    // X axis
    ctx.beginPath()
    ctx.moveTo(padding.left, height - padding.bottom)
    ctx.lineTo(width - padding.right, height - padding.bottom)
    ctx.stroke()
    
    // Draw axes labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.font = '11px Geist Mono, monospace'
    
    // Y-axis labels (multiplier)
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    yTicks.forEach(tick => {
      const y = toCanvasY(tick)
      ctx.fillText(`${tick.toFixed(2)}x`, padding.left - 8, y)
    })
    
    // X-axis labels (time in seconds)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    xTicks.forEach(tick => {
      const x = toCanvasX(tick)
      ctx.fillText(`${tick}s`, x, height - padding.bottom + 8)
    })
    
    // Draw curve if running
    if ((status === 'running' || status === 'crashed') && pointsRef.current.length > 0) {
      const points = pointsRef.current
      
      // Create gradient
      const gradient = ctx.createLinearGradient(0, height - padding.bottom, 0, padding.top)
      
      if (status === 'crashed') {
        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.05)')
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0.3)')
      } else {
        gradient.addColorStop(0, 'rgba(34, 197, 94, 0.05)')
        gradient.addColorStop(1, 'rgba(34, 197, 94, 0.3)')
      }
      
      // Draw filled area under curve
      ctx.beginPath()
      ctx.moveTo(toCanvasX(0), toCanvasY(1))
      
      points.forEach((point, i) => {
        const x = toCanvasX(point.time)
        const y = toCanvasY(point.y)
        
        if (i === 0) {
          ctx.lineTo(x, y)
        } else {
          // Smooth curve using quadratic bezier
          const prevPoint = points[i - 1]
          const prevX = toCanvasX(prevPoint.time)
          const prevY = toCanvasY(prevPoint.y)
          const cpX = (prevX + x) / 2
          ctx.quadraticCurveTo(prevX, prevY, cpX, (prevY + y) / 2)
          if (i === points.length - 1) {
            ctx.lineTo(x, y)
          }
        }
      })
      
      const lastPoint = points[points.length - 1]
      const lastX = toCanvasX(lastPoint.time)
      ctx.lineTo(lastX, toCanvasY(1))
      ctx.closePath()
      ctx.fillStyle = gradient
      ctx.fill()
      
      // Draw curve line
      ctx.beginPath()
      ctx.strokeStyle = status === 'crashed' ? '#ef4444' : '#22c55e'
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      
      points.forEach((point, i) => {
        const x = toCanvasX(point.time)
        const y = toCanvasY(point.y)
        
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          // Smooth curve
          const prevPoint = points[i - 1]
          const prevX = toCanvasX(prevPoint.time)
          const prevY = toCanvasY(prevPoint.y)
          const cpX = (prevX + x) / 2
          ctx.quadraticCurveTo(prevX, prevY, cpX, (prevY + y) / 2)
          if (i === points.length - 1) {
            ctx.lineTo(x, y)
          }
        }
      })
      ctx.stroke()
      
      // Draw glow effect on the line
      ctx.save()
      ctx.shadowColor = status === 'crashed' ? '#ef4444' : '#22c55e'
      ctx.shadowBlur = 15
      ctx.stroke()
      ctx.restore()
      
      // Draw point at current position
      const currentX = toCanvasX(lastPoint.time)
      const currentY = toCanvasY(lastPoint.y)
      
      // Outer glow ring
      ctx.beginPath()
      ctx.arc(currentX, currentY, 12, 0, Math.PI * 2)
      ctx.fillStyle = status === 'crashed' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'
      ctx.fill()
      
      // Middle ring
      ctx.beginPath()
      ctx.arc(currentX, currentY, 8, 0, Math.PI * 2)
      ctx.fillStyle = status === 'crashed' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)'
      ctx.fill()
      
      // Inner dot
      ctx.beginPath()
      ctx.arc(currentX, currentY, 5, 0, Math.PI * 2)
      ctx.fillStyle = status === 'crashed' ? '#ef4444' : '#22c55e'
      ctx.fill()
    }
  }, [status, displayMultiplier, getAxisRanges, getAxisTicks])
  
  // Reset and start tracking points
  useEffect(() => {
    if (status === 'betting' || status === 'waiting') {
      pointsRef.current = []
      startTimeRef.current = 0
      return
    }
    
    if (status === 'running' && startTimeRef.current === 0) {
      startTimeRef.current = Date.now()
    }
  }, [status])
  
  // Add points to curve based on time
  useEffect(() => {
    if (status !== 'running') return
    
    const elapsedTime = (Date.now() - startTimeRef.current) / 1000
    
    // Add point with actual time
    pointsRef.current.push({
      x: pointsRef.current.length,
      y: displayMultiplier,
      time: elapsedTime
    })
    
    // Keep reasonable number of points for performance
    if (pointsRef.current.length > 1000) {
      // Downsample older points
      const recentPoints = pointsRef.current.slice(-500)
      const olderPoints = pointsRef.current.slice(0, -500)
      const sampledOlder = olderPoints.filter((_, i) => i % 2 === 0)
      pointsRef.current = [...sampledOlder, ...recentPoints]
    }
  }, [displayMultiplier, status])
  
  // Animation loop
  useEffect(() => {
    const animate = () => {
      draw()
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animate()
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [draw])
  
  // Handle resize
  useEffect(() => {
    const handleResize = () => draw()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [draw])
  
  return (
    <div className="relative w-full h-full min-h-[300px] md:min-h-[400px]" ref={containerRef}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full rounded-lg" />
      
      {/* Overlay content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {/* Status display */}
        {status === 'waiting' && (
          <div className="text-center">
            <div className="text-2xl text-muted-foreground animate-pulse">
              Aguardando próxima rodada...
            </div>
          </div>
        )}
        
        {status === 'betting' && (
          <div className="text-center">
            <div className="text-lg text-muted-foreground mb-2">
              Fase de Apostas
            </div>
            <div className={cn(
              "text-6xl md:text-8xl font-mono font-bold text-crash-yellow animate-countdown-pulse",
            )}>
              {countdown}s
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              Faça sua aposta agora!
            </div>
          </div>
        )}
        
        {(status === 'running' || status === 'crashed') && (
          <div className="text-center">
            <div className={cn(
              "text-6xl md:text-9xl font-mono font-bold transition-all duration-100",
              status === 'crashed' 
                ? "text-destructive text-glow-red animate-crash-shake" 
                : "text-crash-green text-glow-green"
            )}>
              {displayMultiplier.toFixed(2)}x
            </div>
            {status === 'crashed' && (
              <div className="text-xl md:text-2xl text-destructive mt-4 animate-pulse">
                CRASHOU!
              </div>
            )}
          </div>
        )}
        
        {/* Hash display
        {currentRound?.hash && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono bg-background/50 backdrop-blur-sm px-3 py-1.5 rounded-md">
              <span className="text-crash-green">🔒</span>
              <span className="truncate">Hash: {currentRound.hash}</span>
            </div>
          </div>
        )} */}
      </div>
    </div>
  )
}
