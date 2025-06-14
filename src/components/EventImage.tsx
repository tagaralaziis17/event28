'use client'

import { useState } from 'react'
import { ImageIcon } from 'lucide-react'

interface EventImageProps {
  src?: string | null
  alt: string
  className?: string
  width?: number
  height?: number
}

export default function EventImage({ 
  src, 
  alt, 
  className = '', 
  width = 128, 
  height = 80 
}: EventImageProps) {
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const showFallback = error || !src

  const handleLoad = () => {
    setLoading(false)
    setError(false)
  }

  const handleError = () => {
    setLoading(false)
    setError(true)
  }

  return (
    <div 
      className={`relative bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border border-gray-200 rounded-lg overflow-hidden ${className}`} 
      style={{ width, height }}
    >
      {!showFallback && (
        <>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          )}
          <img
            src={src!}
            alt={alt}
            width={width}
            height={height}
            className={`object-cover w-full h-full transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
            onLoad={handleLoad}
            onError={handleError}
            style={{ display: 'block' }}
          />
        </>
      )}
      
      {showFallback && (
        <div className="flex flex-col items-center justify-center text-gray-400 p-2">
          <ImageIcon className="h-6 w-6 mb-1" />
          <span className="text-xs text-center leading-tight">No Image</span>
        </div>
      )}
    </div>
  )
}