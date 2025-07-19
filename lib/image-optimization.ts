// lib/image-optimization.ts
// Image optimization utilities for static export

export const imageOptimization = {
  // Preload critical images
  preloadCriticalImages: () => {
    const criticalImages = [
      '/images/nooter.png',
      '/images/farm-background.jpg',
      '/images/game-icons/slot-machine.png'
    ]
    
    criticalImages.forEach(src => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = src
      document.head.appendChild(link)
    })
  },

  // Lazy load non-critical images
  lazyLoadImage: (src: string, placeholder?: string) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(src)
      img.onerror = reject
      img.src = src
    })
  },

  // Generate responsive image URLs (for external CDN)
  getResponsiveImageUrl: (src: string, width: number, quality = 75) => {
    // If using external CDN like Cloudinary or ImageKit
    // return `https://your-cdn.com/w_${width},q_${quality}/${src}`
    return src // Fallback to original
  },

  // WebP support detection
  supportsWebP: () => {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
  }
}

// React hook for optimized images
export function useOptimizedImage(src: string, options?: {
  width?: number
  quality?: number
  lazy?: boolean
}) {
  const { width = 800, quality = 75, lazy = true } = options || {}
  
  // Return optimized image props
  return {
    src: imageOptimization.getResponsiveImageUrl(src, width, quality),
    loading: lazy ? 'lazy' as const : 'eager' as const,
    decoding: 'async' as const
  }
}
