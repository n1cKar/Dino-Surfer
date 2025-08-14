'use client'

import React, { useEffect, useRef } from 'react'

export default function MobileControls() {
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const touchEndX = useRef(0)
  const touchEndY = useRef(0)

  function pmoveLeft() {
    const g = (window as any).__gameControls
    g?.moveLeft?.()
  }
  function pmoveRight() {
    const g = (window as any).__gameControls
    g?.moveRight?.()
  }
  function pjump() {
    const g = (window as any).__gameControls
    g?.jump?.()
  }
  function pslide() {
    const g = (window as any).__gameControls
    g?.slide?.()
  }

  // Thresholds for swipe detection (pixels)
  const minSwipeDistance = 50

  function onTouchStart(e: TouchEvent) {
    const touch = e.changedTouches[0]
    touchStartX.current = touch.screenX
    touchStartY.current = touch.screenY
  }

  function onTouchEnd(e: TouchEvent) {
    const touch = e.changedTouches[0]
    touchEndX.current = touch.screenX
    touchEndY.current = touch.screenY

    handleSwipeGesture()
  }

  function handleSwipeGesture() {
    const deltaX = touchEndX.current - touchStartX.current
    const deltaY = touchEndY.current - touchStartY.current

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0) {
          pmoveRight()
        } else {
          pmoveLeft()
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > minSwipeDistance) {
        if (deltaY < 0) {
          // Swipe up
          pjump()
        } else {
          pslide() // Swipe down can be used for slide or other action
        }
        // You can add swipe down if needed for slide
      }
    }
  }

  useEffect(() => {
    // Attach global touch listeners
    window.addEventListener('touchstart', onTouchStart)
    window.addEventListener('touchend', onTouchEnd)

    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  return (
    <>
      {/* Visible only on small screens: hide at 'sm' and above */}
      <div className="sm:hidden pointer-events-none">
        <div className="fixed left-4 bottom-4 flex gap-3 items-center pointer-events-auto">
          <button
            onTouchStart={(e) => { e.preventDefault(); pmoveLeft() }}
            onMouseDown={() => pmoveLeft()}
            className="w-16 h-16 rounded-lg bg-black/20 backdrop-blur-md flex items-center justify-center mobile-btn"
            aria-label="Left"
          >
            <svg width="24" height="24" viewBox="0 0 24 24"><path fill="black" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
          </button>

          <button
            onTouchStart={(e) => { e.preventDefault(); pmoveRight() }}
            onMouseDown={() => pmoveRight()}
            className="w-16 h-16 rounded-lg bg-black/20 backdrop-blur-md flex items-center justify-center mobile-btn"
            aria-label="Right"
          >
            <svg width="24" height="24" viewBox="0 0 24 24"><path fill="black" d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
          </button>
        </div>

        <div className="fixed right-4 bottom-4 flex gap-3 pointer-events-auto">
          <button
            onTouchStart={(e) => { e.preventDefault(); pjump() }}
            onMouseDown={() => pjump()}
            className="w-20 h-20 rounded-full bg-black/20 flex items-center justify-center mobile-btn"
            aria-label="Jump"
          >
            <svg width="26" height="26" viewBox="0 0 24 24"><path fill="black" d="M12 2L3 20h18z"/></svg>
          </button>

          <button
            onTouchStart={(e) => { e.preventDefault(); pslide() }}
            onMouseDown={() => pslide()}
            className="w-16 h-16 rounded-lg bg-black/20 flex items-center justify-center mobile-btn"
            aria-label="Slide"
          >
            <svg width="22" height="22" viewBox="0 0 24 24"><path fill="black" d="M3 13h18v-2H3v2z"/></svg>
          </button>
        </div>
      </div>
    </>
  )
}
