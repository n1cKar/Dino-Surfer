# Minimal Endless Runner Game

A minimal, web-based endless runner game built with **Next.js 14 (App Router)**, **TypeScript**, and **TailwindCSS**.

The gameplay combines the lane-switching mechanics inspired by *Subway Surfers* with the clean black-and-white aesthetic of the *Google Chrome Dino* game.

---

## Features

- Full-screen responsive `<canvas>` gameplay, optimized for desktop and mobile
- Player runs automatically forward in 3 lanes (left, middle, right)
- Controls:
  - Desktop: ArrowLeft / ArrowRight to switch lanes, Space to jump
  - Mobile: On-screen swipe and button controls for lane switching and jumping
- Randomly spawning obstacles in lanes, moving toward the player
- Collision detection ends the game on hit
- Simple, elegant black silhouette visuals with minimal background details
- Score displayed at the top-left, increasing over time

---

## Tech Stack

- **Next.js 14** with App Router
- **TypeScript**
- **TailwindCSS** for styling
- **Three.js** (only HTML Canvas API usage, no external game libraries)
- Responsive mobile controls with swipe and touch support

---

## Getting Started

1. Clone the repo:

```bash
git clone https://github.com/n1cKar/Dino-Surfer.git
cd Dino-Surfer
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```
3. Run the development server:

```bash
npm run dev
# or
yarn dev
```
4. Open http://localhost:3000 in your browser to play.


## Controls
### Desktop
    - Arrow Left: Switch lane left
    - Arrow Right: Switch lane right
    - Space: Jump

### Mobile
    - Swipe left/right: Switch lanes
    - Swipe up / Jump button: Jump
    - On-screen buttons for lane switch and jump at the bottom corners

## Visual Style

    - Black silhouettes on white background for all game elements
    - Simple geometric shapes for obstacles and player character
    - Ground line at the bottom
    - Occasional minimal clouds in the background for atmosphere

## Contact

Created by [Nimash Mendis](https://github.com/n1cKar).  
Feel free to reach out for questions, feedback, or collaboration!
email: nimash.mendis0202@gmail.com
