'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three';


interface Player3D {
  lane: number
  mesh: THREE.Object3D
  vy: number
  onGround: boolean
  isSliding: boolean
}

interface Obstacle3D {
  lane: number
  mesh: THREE.Mesh | THREE.Group
  speed: number
}

type Pool<T> = T[]

const LANES = 3
const LANE_OFFSET = 2.2
const PLAYER_HEIGHT = 1
const PLAYER_WIDTH = 0.5
const GRAVITY = -30
const JUMP_V = 12
const BASE_FORWARD_SPEED = 12
const SPAWN_Z = -60

const colors: Array<string> = [
  "0xA9A9A9", // Dark Gray
  "0x808080", // Medium Gray
  "0xB5651D", // Brown (earthy tone)
  "0xD2B48C", // Tan (dusty road look)
  "0xC0C0C0", // Silver
  "0x708090"  // Slate Gray (blueish gray)
];

function getRandomElement<T>(arr: T[]): T | undefined {
  if (arr.length === 0) {
    return undefined; // Return undefined if the array is empty
  }
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}

const randomColorStr = getRandomElement(colors) || "0xffffff"; // Default to white if no color found
// Convert string like "0x008000" to number
const randomColorNum = Number(randomColorStr);


export default function GameCanvas3D() {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const playerRef = useRef<Player3D | null>(null)
  const obstaclesRef = useRef<Obstacle3D[]>([])
  const reusableObstaclePool = useRef<Pool<THREE.Mesh | THREE.Group>>([])
  const lastSpawnRef = useRef(0)
  const spawnIntervalRef = useRef(0.9)
  const forwardSpeedRef = useRef(BASE_FORWARD_SPEED)
  const runningRef = useRef(true)
  const rafIdRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)
  const scoreRef = useRef(0)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const slideTimerRef = useRef(0)

  useEffect(() => {
    const container = mountRef.current!
    container.classList.add('three-root')
    const width = container.clientWidth
    const height = container.clientHeight

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.max(1, window.devicePixelRatio || 1))
    renderer.setSize(width, height)
    renderer.domElement.style.position = 'absolute'
    renderer.domElement.style.top = '0'
    renderer.domElement.style.left = '0'
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const scene = new THREE.Scene()

    // Set up the scene background color (Sky Background)
    scene.background = new THREE.Color(0x87CEEB); // Sky blue color
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 200)
    camera.position.set(0, 4.5, 8)
    camera.lookAt(0, 1.2, 0)
    cameraRef.current = camera

    const hemi = new THREE.HemisphereLight(0xffffff, 0xaaaaaa, 0.9)
    scene.add(hemi)

    // ground plane                   // color of the ground
    //const groundMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }) 


    const groundMat = new THREE.MeshBasicMaterial({ color: randomColorNum, side: THREE.DoubleSide }) // Use random color
    const groundGeo = new THREE.PlaneGeometry(200, 50)
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.01
    scene.add(ground)


    // lane markers
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xeeeeee })
    for (let i = 0; i < LANES; i++) {
      const markerGeo = new THREE.BoxGeometry(0.05, 0.02, 200)
      const marker = new THREE.Mesh(markerGeo, markerMat)
      marker.position.x = (i - 1) * LANE_OFFSET
      marker.position.y = 0.01
      marker.position.z = -40
      scene.add(marker)
    }

    // clouds
    const cloudMat = new THREE.MeshBasicMaterial({ color: 0xf3f3f3 })
    for (let i = 0; i < 10; i++) {
      const g = new THREE.PlaneGeometry(3 + Math.random() * 4, 1.2 + Math.random())
      const m = new THREE.Mesh(g, cloudMat)
      m.position.set((Math.random() - 0.5) * 100, 6 + Math.random() * 3, -20 - Math.random() * 80)
      m.rotation.y = Math.random() * 0.4
      scene.add(m)
    }

    // player mesh

    // player material (green dino)
    const playerMat = new THREE.MeshStandardMaterial({ color: 0x4CAF50, flatShading: true });

    // create a group to hold all parts of the dino
    const playerMesh = new THREE.Group();

    // Body (capsule for rounded shape)
    const bodyGeo = new THREE.CapsuleGeometry(0.35, 1.2, 6, 12);
    const bodyMesh = new THREE.Mesh(bodyGeo, playerMat);
    bodyMesh.position.set(0, 0.8, 0);
    playerMesh.add(bodyMesh);

    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 8);
    const neckMesh = new THREE.Mesh(neckGeo, playerMat);
    neckMesh.position.set(0, 1.3, 0.15);
    playerMesh.add(neckMesh);

    // Head (elongated box for snout look)
    const headGeo = new THREE.BoxGeometry(0.5, 0.3, 0.35);
    const headMesh = new THREE.Mesh(headGeo, playerMat);
    headMesh.position.set(0, 1.5, 0.4);
    playerMesh.add(headMesh);

    // Tail (longer + tapered)
    const tailGeo = new THREE.CylinderGeometry(0.15, 0.05, 0.8, 8);
    const tailMesh = new THREE.Mesh(tailGeo, playerMat);
    tailMesh.position.set(-0.55, 0.5, -0.1);
    tailMesh.rotation.set(0, 0, Math.PI / 6);
    playerMesh.add(tailMesh);

    // Left leg
    const leftLegGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.45, 8);
    const leftLegMesh = new THREE.Mesh(leftLegGeo, playerMat);
    leftLegMesh.position.set(0.18, 0.1, 0.05);
    playerMesh.add(leftLegMesh);

    // Right leg
    const rightLegGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.45, 8);
    const rightLegMesh = new THREE.Mesh(rightLegGeo, playerMat);
    rightLegMesh.position.set(-0.18, 0.1, 0.05);
    playerMesh.add(rightLegMesh);

    // Left arm (tiny)
    const leftArmGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.25, 6);
    const leftArmMesh = new THREE.Mesh(leftArmGeo, playerMat);
    leftArmMesh.position.set(0.22, 0.9, 0.15);
    leftArmMesh.rotation.set(Math.PI / 4, 0, 0);
    playerMesh.add(leftArmMesh);

    // Right arm (tiny)
    const rightArmGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.25, 6);
    const rightArmMesh = new THREE.Mesh(rightArmGeo, playerMat);
    rightArmMesh.position.set(-0.22, 0.9, 0.15);
    rightArmMesh.rotation.set(Math.PI / 4, 0, 0);
    playerMesh.add(rightArmMesh);

    // Tilt player so it faces about 35° to the left
    //playerMesh.rotation.y = THREE.MathUtils.degToRad(35);

    // Tilt player so it faces about 35° to the right
    playerMesh.rotation.y = THREE.MathUtils.degToRad(-25);

    // Position whole player group at starting height
    playerMesh.position.set(0, PLAYER_HEIGHT / 2, 0);

    scene.add(playerMesh);


    playerRef.current = {
      lane: 1,
      mesh: playerMesh,
      vy: 0,
      onGround: true,
      isSliding: false
    }

    function laneX(lane: number) {
      return (lane - 1) * LANE_OFFSET
    }

    // Create Obstacle Mesh

    /* function makeObstacleMesh() {
      const geo = new THREE.BoxGeometry(1.2 + Math.random() * 1.6, 1 + Math.random() * 1.6, 1)
      const mat = new THREE.MeshBasicMaterial({ color: 0x000000 })
      const m = new THREE.Mesh(geo, mat)
      return m
    } */
    function makeObstacleMesh(): THREE.Mesh | THREE.Group {
      const type = Math.floor(Math.random() * 5); // 5 shape types
      let mesh: THREE.Mesh | THREE.Group = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial({ color: 0x000000 })
      );
    
      switch (type) {
        case 0: // Box
          mesh = new THREE.Mesh(
            new THREE.BoxGeometry(1.2 + Math.random() * 1.6, 1 + Math.random() * 1.6, 1),
            new THREE.MeshBasicMaterial({ color: 0x000000 })
          );
          break;
    
        case 1: // Cylinder (pillar)
          mesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, 2 + Math.random() * 2, 16),
            new THREE.MeshBasicMaterial({ color: 0x000000 })
          );
          break;
    
        case 2: // Flat plank
          mesh = new THREE.Mesh(
            new THREE.BoxGeometry(3, 0.3, 1),
            new THREE.MeshBasicMaterial({ color: 0x000000 })
          );
          break;
    
        case 3: // H-shape
          const hGroup = new THREE.Group();
          const matH = new THREE.MeshBasicMaterial({ color: 0x000000 });
          // Create legs and bar for the H-shape
          // Legs are 0.3 wide, 2 tall, and bar is 1
          const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2, 1), matH);
          const leg2 = leg1.clone();
          const bar = new THREE.Mesh(new THREE.BoxGeometry(1, 0.3, 1), matH);
          leg1.position.x = -0.5;
          leg2.position.x = 0.5;
          bar.position.y = 0;
          hGroup.add(leg1, leg2, bar);
          mesh = hGroup;
          break;
    
        case 4: // Arch
          const archGroup = new THREE.Group();
          const matArch = new THREE.MeshBasicMaterial({ color: 0x000000 });
          // Create pillars and top for the arch
          // Pillars are 0.3 wide, 5 tall, and top is 1 wide
          const pillar1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 5, 1), matArch);
          const pillar2 = pillar1.clone();
          const top = new THREE.Mesh(new THREE.BoxGeometry(1, 0.3, 1), matArch);
          pillar1.position.x = -0.5;
          pillar2.position.x = 0.5;
          pillar1.position.y = -0.85;
          pillar2.position.y = -0.85;
          top.position.y = 0.15;
          archGroup.add(pillar1, pillar2, top);
          mesh = archGroup;
          break;
      }
    
      return mesh;
    }



    // Controls exposed to mobile UI
    ; (window as any).__gameControls = {
      moveLeft: () => moveLane(-1),
      moveRight: () => moveLane(1),
      jump: () => jump(),
      slide: () => slide()
    }

    function moveLane(dir: -1 | 1) {
      const p = playerRef.current!
      const newLane = Math.max(0, Math.min(LANES - 1, p.lane + dir))
      if (newLane !== p.lane) p.lane = newLane
    }
    function jump() {
      const p = playerRef.current!
      if (p.onGround && !p.isSliding) {
        p.vy = JUMP_V
        p.onGround = false
      }
    }
    function slide() {
      const p = playerRef.current!
      if (p.onGround && !p.isSliding) {
        p.isSliding = true
        p.mesh.scale.y = 0.55
        p.mesh.position.y = (PLAYER_HEIGHT * 0.55) / 2
        slideTimerRef.current = 0.8
      }
    }

    // keyboard
    function onKeydown(e: KeyboardEvent) {
      if (!runningRef.current) return
      if (e.code === 'ArrowLeft') moveLane(-1)
      else if (e.code === 'ArrowRight') moveLane(1)
      else if (e.code === 'ArrowUp') { e.preventDefault(); jump() }
      else if (e.code === 'ArrowDown') slide()
    }
    window.addEventListener('keydown', onKeydown)

    function spawnObstacle() {
      const lane = Math.floor(Math.random() * LANES)
      const mesh = reusableObstaclePool.current.pop() || makeObstacleMesh()
      if (mesh) {
        mesh.scale.set(1, 1, 1)
        mesh.position.set(laneX(lane), 0.5 + Math.random() * 0.4, SPAWN_Z - Math.random() * 10)
        mesh.visible = true
        scene.add(mesh)
        obstaclesRef.current.push({
          lane,
          mesh,
          speed: forwardSpeedRef.current + (Math.random() * 2)
        })
      }
    }

    // animation loop
    runningRef.current = true
    lastSpawnRef.current = 0
    lastTimeRef.current = null
    spawnIntervalRef.current = 0.9
    forwardSpeedRef.current = BASE_FORWARD_SPEED
    scoreRef.current = 0
    setScore(0)
    setGameOver(false)

    function loop(now: number) {
      if (!lastTimeRef.current) lastTimeRef.current = now
      const dt = Math.min(0.05, (now - lastTimeRef.current) / 1000)
      lastTimeRef.current = now

      if (runningRef.current) {
        // accelerate slowly
        forwardSpeedRef.current += dt * 1

        // obstacles move forward (increase z)
        for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
          const ob = obstaclesRef.current[i]
          ob.mesh.position.z += ob.speed * dt
          if (ob.mesh.position.z > 12) {
            scene.remove(ob.mesh)
            reusableObstaclePool.current.push(ob.mesh)
            obstaclesRef.current.splice(i, 1)
            continue
          }
        }

        // spawn timer
        lastSpawnRef.current += dt
        if (lastSpawnRef.current > spawnIntervalRef.current) {
          spawnObstacle()
          lastSpawnRef.current = 0
          spawnIntervalRef.current = Math.max(0.45, 0.6 + Math.random() * 1 - Math.min(0.4, scoreRef.current / 500))
        }

        // player vertical physics
        const p = playerRef.current!
        if (!p.onGround) {
          p.vy += GRAVITY * dt
          p.mesh.position.y += p.vy * dt
          if (p.mesh.position.y <= PLAYER_HEIGHT / 2) {
            p.mesh.position.y = PLAYER_HEIGHT / 2
            p.vy = 0
            p.onGround = true
          }
        }

        // slide timer
        if (p.isSliding) {
          slideTimerRef.current -= dt
          if (slideTimerRef.current <= 0) {
            p.isSliding = false
            p.mesh.scale.y = 1
            p.mesh.position.y = PLAYER_HEIGHT / 2
            slideTimerRef.current = 0
          }
        }

        // lateral smoothing to lane x
        const targetX = laneX(p.lane)
        p.mesh.position.x += (targetX - p.mesh.position.x) * Math.min(1, 12 * dt)

        // camera follow
        const camTarget = new THREE.Vector3(p.mesh.position.x, p.mesh.position.y + 2.6, p.mesh.position.z + 8)
        camera.position.lerp(camTarget, Math.min(1, 4 * dt))
        camera.lookAt(p.mesh.position.x, p.mesh.position.y + 1.2, p.mesh.position.z)

        // collision detection using bounding boxes
        for (const ob of obstaclesRef.current) {
          const player = playerRef.current!;

          // Get obstacle bounding box
          const obBox = new THREE.Box3().setFromObject(ob.mesh);

          // Get player bounding box (scale if sliding)
          const playerScale = player.isSliding ? 0.55 : 1;
          const playerBox = new THREE.Box3().setFromCenterAndSize(
            player.mesh.position.clone(),
            new THREE.Vector3(PLAYER_WIDTH, PLAYER_HEIGHT * playerScale, PLAYER_WIDTH)
          );

          // Check intersection
          if (obBox.intersectsBox(playerBox)) {
            runningRef.current = false;
            break; // stop checking once collision found
          }
        }


        // score
        scoreRef.current += forwardSpeedRef.current * dt * 2
        if (Math.floor(scoreRef.current) % 50 === 0) setScore(Math.floor((scoreRef.current) / 50))
        if (!runningRef.current) {
          setGameOver(true)
        }

        // increase score by 1 per update
        /* scoreRef.current += 1

        // update displayed score
        setScore(Math.floor(scoreRef.current))

        // if game ended this frame, flip state
        if (!runningRef.current) {
          setGameOver(true)
        } */
      }

      renderer.render(scene, camera)
      rafIdRef.current = requestAnimationFrame(loop)
    }

    rafIdRef.current = requestAnimationFrame(loop)

    // resize handler
    function onResize() {
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    // cleanup
    return () => {
      // Remove event listeners
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeydown);

      // Clear global reference
      (window as any).__gameControls = undefined;

      // Cancel animation frame
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      // Dispose renderer if it exists
      if (renderer) {
        renderer.dispose();
        // Remove canvas safely
        if (renderer.domElement && container?.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className='overflow-hidden w-full h-full relative'>
      <div ref={mountRef} className="absolute left-0 top-0 w-screen h-screen" />
      <div className="pointer-events-none fixed top-4 left-1/2 text-black font-medium text-lg">
        Score: {Math.floor(score)}
      </div>

      {gameOver ? (
        <div className="pointer-events-auto fixed inset-0 flex items-center justify-center">
          <div className="bg-white/95 border border-black rounded-lg p-6 text-center">
            <h2 className="text-3xl font-bold mb-2">Game Over</h2>
            <p className="mb-4">Score: {score}</p>
            <button
              onClick={() => {
                setGameOver(false)
                scoreRef.current = 0
                setScore(0)
                runningRef.current = true
                lastSpawnRef.current = 0
                forwardSpeedRef.current = BASE_FORWARD_SPEED
                playerRef.current!.vy = 0
                playerRef.current!.onGround = true
                playerRef.current!.isSliding = false
                playerRef.current!.mesh.position.set(0, PLAYER_HEIGHT / 2, 0)
                obstaclesRef.current.forEach(ob => {
                  ob.mesh.visible = false
                  reusableObstaclePool.current.push(ob.mesh)
                })
                obstaclesRef.current.length = 0
              }}
              className="px-6 py-2 bg-black text-white rounded-lg"
              aria-label="Restart Game"
            >
              Restart Game
            </button>
            {/* <p className="text-sm text-gray-600">Refresh to play again</p> */}
          </div>
        </div>
      ) : null}
    </div>
  )
}
