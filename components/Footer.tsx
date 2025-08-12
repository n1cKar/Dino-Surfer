import React from 'react'

export default function Footer() {
  return (
    /* Footer Section */
    <footer className="bg-white text-gray py-4">
      <div className="container mx-auto text-center">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} Dino Surfer. Made by Nimash Mendis.
        </p>
      </div>
    </footer>
  )
} 
