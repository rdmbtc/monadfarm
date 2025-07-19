'use client'

import { useEffect, useState } from 'react'

interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  memoryUsage?: number
  connectionType?: string
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)

  useEffect(() => {
    // Measure performance metrics
    const measurePerformance = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const loadTime = navigation.loadEventEnd - navigation.loadEventStart
      const renderTime = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
      
      // Memory usage (if available)
      const memoryUsage = (performance as any).memory?.usedJSHeapSize
      
      // Connection type (if available)
      const connectionType = (navigator as any).connection?.effectiveType

      setMetrics({
        loadTime,
        renderTime,
        memoryUsage,
        connectionType
      })

      // Log performance warnings
      if (loadTime > 3000) {
        console.warn('⚠️ Slow page load detected:', loadTime + 'ms')
      }
      
      if (memoryUsage && memoryUsage > 50 * 1024 * 1024) { // 50MB
        console.warn('⚠️ High memory usage detected:', (memoryUsage / 1024 / 1024).toFixed(2) + 'MB')
      }
    }

    // Wait for page to fully load
    if (document.readyState === 'complete') {
      measurePerformance()
    } else {
      window.addEventListener('load', measurePerformance)
      return () => window.removeEventListener('load', measurePerformance)
    }
  }, [])

  // Only show in development
  if (process.env.NODE_ENV !== 'development' || !metrics) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-50">
      <div className="font-bold mb-2">⚡ Performance</div>
      <div>Load: {metrics.loadTime.toFixed(0)}ms</div>
      <div>Render: {metrics.renderTime.toFixed(0)}ms</div>
      {metrics.memoryUsage && (
        <div>Memory: {(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB</div>
      )}
      {metrics.connectionType && (
        <div>Connection: {metrics.connectionType}</div>
      )}
    </div>
  )
}

// Hook for component-level performance monitoring
export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      if (renderTime > 100) { // Log slow components
        console.warn(`⚠️ Slow component render: ${componentName} took ${renderTime.toFixed(2)}ms`)
      }
    }
  }, [componentName])
}
