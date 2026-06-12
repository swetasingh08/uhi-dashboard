import React from 'react'

function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizes[size]} relative`}>
        <div className="absolute inset-0 rounded-full border-3 border-dark-700" />
        <div className="absolute inset-0 rounded-full border-3 border-t-primary-500 animate-spin" />
      </div>
    </div>
  )
}

export default LoadingSpinner