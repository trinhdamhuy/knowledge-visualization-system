'use client'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'

interface PreLoaderProps {
  onComplete: () => void
}

export default function PreLoader({ onComplete }: PreLoaderProps) {
  const loaderRef = useRef<HTMLDivElement>(null)
  const letterRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        setTimeout(() => onComplete(), 500)
      }
    })
    
    tl.to(fillRef.current, {
      clipPath: 'inset(0% 0% 0% 0%)',
      duration: 2,
      ease: 'power2.inOut'
    })
    
    .to(letterRef.current, {
      scale: 1.5,
      duration: 0.6,
      ease: 'back.out(1.7)'
    })
    
    .to(letterRef.current, {
      opacity: 0,
      duration: 0.15,
      repeat: 2,
      yoyo: true
    })
    
    .to(loaderRef.current, {
      scale: 20,
      opacity: 0,
      duration: 0.8,
      ease: 'power2.in'
    })
    
  }, [onComplete])
  
  return (
    <div 
      ref={loaderRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-50 via-cyan-50 to-teal-50"
    >
      <div 
        ref={letterRef}
        className="relative"
        style={{ width: '300px', height: '300px' }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span 
            className="absolute text-transparent font-bold"
            style={{
              fontSize: '200px',
              WebkitTextStroke: '3px #0C7B93',
              fontFamily: 'Arial Black, sans-serif',
              lineHeight: 1,
              margin: 0,
              padding: 0
            }}>
            K
          </span>
          
          <span 
            ref={fillRef}
            className="absolute font-bold"
            style={{
              fontSize: '200px',
              fontFamily: 'Arial Black, sans-serif',
              lineHeight: 1,
              margin: 0,
              padding: 0,
              clipPath: 'inset(100% 0% 0% 0%)',
              background: 'linear-gradient(135deg, #142850 0%, #0C7B93 50%, #00A8CC 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
            K
          </span>
        </div>
      </div>
    </div>
  )
}
