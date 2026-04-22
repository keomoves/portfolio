import React, { useState, useRef, useEffect, useContext } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MeshReflectorMaterial, BakeShadows, useProgress } from '@react-three/drei'
import * as THREE from 'three'
import { EffectComposer, Bloom, DepthOfField } from '@react-three/postprocessing'
import { easing } from 'maath'
import { Instances, Computers } from './Computers'
import { Character } from './Character'
import LoadingOverlay from './LoadingOverlay'
import Dust from './Dust'
import { VideoModalContext } from './index'
import ProjectsOverlay from './ProjectsOverlayClean'
import AboutOverlay from './AboutOverlay'

export default function App() {
  const [focusCharacter, setFocusCharacter] = useState(false)
  const [focusShowreel, setFocusShowreel] = useState(false)
  const [screenTarget, setScreenTarget] = useState([1.26, -0.13, -7.42])
  const openOnce = useRef(false)
  const [focusProjects, setFocusProjects] = useState(false)
  const [projectsTarget, setProjectsTarget] = useState([0.63, 1.43, -2.77])
  const [showProjectsOverlay, setShowProjectsOverlay] = useState(false)
  const [showAboutOverlay, setShowAboutOverlay] = useState(false)
  const [resetBase, setResetBase] = useState(false)
  // Camera and DOF control states
  const [camRadius, setCamRadius] = useState(2.46)
  const [camHeight, setCamHeight] = useState(-0.49)
  const [camSpinDeg, setCamSpinDeg] = useState(173)
  const [camSpeed, setCamSpeed] = useState(0.6)
  const [dofTarget, setDofTarget] = useState({ x: -0.14, y: -0.47, z: 2.15 })
  const { progress } = useProgress()
  const [zoomProgress, setZoomProgress] = useState(0)
  const { openVideo } = useContext(VideoModalContext)
  // Spotlight controls
  const [spotIntensity, setSpotIntensity] = useState(7.89)
  const [spotAngle, setSpotAngle] = useState(0.63)
  const [spotPenumbra, setSpotPenumbra] = useState(0.83)
  const [spotHeight, setSpotHeight] = useState(1.37)
  const [spotOffsetX, setSpotOffsetX] = useState(-0.05)
  const [spotOffsetZ, setSpotOffsetZ] = useState(-0.26)
  const [spotDistance, setSpotDistance] = useState(0)
  const [spotDecay, setSpotDecay] = useState(0.33)
  const [spotShadowBias, setSpotShadowBias] = useState(-0.0019)
  const [spotShadowRadius, setSpotShadowRadius] = useState(1.06)
  const [spotFadeSpeed, setSpotFadeSpeed] = useState(3)
  const [spotColor, setSpotColor] = useState('#ffffff')
  // Gyro for mobile camera pan (same feel as mouse on desktop)
  const gyroRef = useRef({ x: 0, y: 0, active: false })
  useEffect(() => {
    if (typeof window === 'undefined' || !window.DeviceOrientationEvent) return
    const onOrientation = (e) => {
      const beta = e.beta != null ? e.beta : 90
      const gamma = e.gamma != null ? e.gamma : 0
      const x = Math.max(-1, Math.min(1, (gamma || 0) / 55))
      const y = Math.max(-1, Math.min(1, ((beta || 90) - 90) / 50))
      gyroRef.current = { x, y, active: true }
    }
    window.addEventListener('deviceorientation', onOrientation, { passive: true })
    return () => window.removeEventListener('deviceorientation', onOrientation)
  }, [])
  useEffect(() => {
    if (typeof window === 'undefined') return
    const requestPermission = () => {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
          .then(() => {})
          .catch(() => {})
      }
    }
    const onTouch = () => {
      requestPermission()
      document.removeEventListener('touchend', onTouch)
    }
    document.addEventListener('touchend', onTouch, { once: true, passive: true })
    return () => document.removeEventListener('touchend', onTouch)
  }, [])
  useEffect(() => {
    const handler = () => setFocusCharacter(true)
    window.addEventListener('focusCharacter', handler)
    return () => window.removeEventListener('focusCharacter', handler)
  }, [])
  useEffect(() => {
    const handler = (e) => {
      setScreenTarget(e.detail?.target ?? [1.26, -0.13, -7.42])
      setFocusCharacter(false)
      setFocusShowreel(true)
      openOnce.current = false
      setZoomProgress(0)
    }
    window.addEventListener('focusShowreel', handler)
    return () => window.removeEventListener('focusShowreel', handler)
  }, [])
  useEffect(() => {
    const handler = (e) => {
      setProjectsTarget(e.detail?.target ?? [0.96, 4.28, -4.2])
      setFocusCharacter(false)
      setFocusShowreel(false)
      setFocusProjects(true)
      setZoomProgress(0)
    }
    window.addEventListener('focusProjects', handler)
    return () => window.removeEventListener('focusProjects', handler)
  }, [])
  useEffect(() => {
    const handler = () => {
      setFocusShowreel(false)
      setFocusCharacter(false)
      setShowAboutOverlay(false)
      setResetBase(true)
      setTimeout(() => setResetBase(false), 50)
    }
    window.addEventListener('restoreCamera', handler)
    return () => window.removeEventListener('restoreCamera', handler)
  }, [])
  // Open About overlay when character zoom completes
  useEffect(() => {
    if (focusCharacter && zoomProgress >= 1) {
      setShowAboutOverlay(true)
    } else {
      setShowAboutOverlay(false)
    }
  }, [focusCharacter, zoomProgress])
  return (
    <>
    <Canvas shadows dpr={[1, 1.5]} camera={{ position: [-1.5, 1, 5.5], fov: 45, near: 0.1, far: 20 }} eventSource={document.getElementById('root')} eventPrefix="client">
      {/* Lights */}
      <color attach="background" args={['black']} />
      <hemisphereLight intensity={0.15} groundColor="black" />
      <spotLight decay={0} position={[10, 20, 10]} angle={0.12} penumbra={1} intensity={1} castShadow shadow-mapSize={1024} />
      {/* Dust particles */}
      <Dust count={450} area={[16, 8, 16]} speed={0.006} size={0.02} opacity={0.14} />
      {/* Main scene */}
      <group position={[-0, -1, 0]}>
        <Instances>
          <Computers scale={0.5} interactionsDisabledProjects={focusProjects || showProjectsOverlay} />
        </Instances>
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[50, 50]} />
          <MeshReflectorMaterial
            blur={[300, 30]}
            resolution={2048}
            mixBlur={1}
            mixStrength={180}
            roughness={1}
            depthScale={1.2}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#202020"
            metalness={0.8}
          />
        </mesh>
        <pointLight distance={1.5} intensity={1} position={[-0.15, 0.7, 0]} color="orange" />
      </group>
      <ZoomSpotlight
        enabled={focusCharacter}
        zoomProgress={zoomProgress}
        target={[0, -1, 2]}
        intensity={spotIntensity}
        angle={spotAngle}
        penumbra={spotPenumbra}
        height={spotHeight}
        offsetX={spotOffsetX}
        offsetZ={spotOffsetZ}
        distance={spotDistance}
        decay={spotDecay}
        shadowBias={spotShadowBias}
        shadowRadius={spotShadowRadius}
        fadeSpeed={spotFadeSpeed}
        color={spotColor}
      />
      {/* Postprocessing */}
      <EffectComposer disableNormalPass multisampling={0}>
        <Bloom luminanceThreshold={0} mipmapBlur luminanceSmoothing={0.0} intensity={5} />
        {!( (focusCharacter || focusShowreel || focusProjects) && zoomProgress < 1) && (
          <DepthOfField
            target={(focusCharacter || focusShowreel || focusProjects) ? [dofTarget.x, dofTarget.y, dofTarget.z] : [0, 0, 13]}
            focalLength={(focusCharacter || focusShowreel || focusProjects) ? 0.02 : 0.3}
            bokehScale={(focusCharacter || focusShowreel || focusProjects) ? 4 : 2}
            height={600}
          />
        )}
      </EffectComposer>
      {/* Camera movements */}
      {!(focusShowreel || focusProjects) && (
        <CameraRig
          focus={focusCharacter}
          camTarget={dofTarget}
          camRadius={camRadius}
          camHeight={camHeight}
          camSpin={(camSpinDeg * Math.PI) / 180}
          camSpeed={camSpeed}
          onProgress={setZoomProgress}
          forceBase={resetBase}
          gyroRef={gyroRef}
        />
      )}
      {/* Showreel screen focus */}
      {focusShowreel && (
        <CameraRig
          focus={focusShowreel}
          camTarget={{ x: screenTarget[0], y: screenTarget[1], z: screenTarget[2] }}
          camRadius={0.9}
          camHeight={screenTarget[1]}
          camSpin={0}
          camSpeed={0.9}
          onProgress={(p) => {
            setZoomProgress(p)
            if (p >= 1 && !openOnce.current) {
              openOnce.current = true
              openVideo('https://www.youtube.com/embed/mSwpFbqtr2M?autoplay=1')
            }
          }}
        />
      )}
      {/* Projects screen focus */}
      {focusProjects && (
        <CameraRig
          focus={focusProjects}
          camTarget={{ x: projectsTarget[0], y: projectsTarget[1], z: projectsTarget[2] }}
          camRadius={1.0}
          camHeight={projectsTarget[1]}
          camSpin={0}
          camSpeed={0.9}
          onProgress={(p) => {
            setZoomProgress(p)
            if (p >= 1 && focusProjects && !showProjectsOverlay) {
              setShowProjectsOverlay(true)
            }
          }}
        />
      )}
      {/* Character */}
      <Character
        position={[0, -1, 2]}
        scale={1}
        rotation={[0, Math.PI, 0]}
        onClick={() => setFocusCharacter((v) => !v)}
        hoverEnabled={!focusCharacter}
        headLookAtMouse={focusCharacter}
        headYawOffset={-0.5}
        headPitchOffset={0.53}
        headInvertX={true}
        headInvertY={false}
        showHitBox={false}
        hitBoxScale={0.77}
        hitBoxOffset={{ x: -0.09, y: -0.25, z: -0.4 }}
      />
      {/* Small helper that freezes the shadows for better performance */}
      <BakeShadows />
    </Canvas>
    {focusCharacter && (
      <button
        onClick={() => setFocusCharacter(false)}
        aria-label="Retour"
        style={{
          position: 'fixed',
          top: 20,
          left: 20,
          width: 44,
          height: 44,
          borderRadius: 22,
          border: '1px solid rgba(255,255,255,0.3)',
          background: 'rgba(0,0,0,0.5)',
          color: 'white',
          fontSize: 20,
          cursor: 'pointer',
          zIndex: 100
        }}
        title="Revenir"
      >
        ←
      </button>
    )}
    {progress < 100 && <LoadingOverlay progress={progress} />}
    {/* About overlay (shows at end of character zoom) */}
    {showAboutOverlay && (
      <AboutOverlay />
    )}
    {/* Projects overlay */}
    {showProjectsOverlay && (
      <>
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', zIndex: 1000 }}>
          <ProjectsOverlay />
        </div>
        {/* Close button outside the page, fixed in the screen corner */}
        <button
          onClick={() => {
            // First, stop the projects rig to avoid immediate reopen
            setFocusProjects(false)
            setShowProjectsOverlay(false)
            window.dispatchEvent(new CustomEvent('restoreCamera'))
          }}
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            background: 'rgba(0,0,0,0.35)',
            border: 'none',
            color: 'white',
            fontSize: 24,
            cursor: 'pointer',
            width: 40,
            height: 40,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1002
          }}
          aria-label="Fermer"
          title="Fermer"
        >
          ✕
        </button>
      </>
    )}
    {/* Projects target sliders removed after fixing values */}
    </>
  )
}

function CameraRig({ focus, camTarget, camRadius, camHeight, camSpin, camSpeed, onProgress, forceBase = false, gyroRef }) {
  const wasFocused = useRef(false)
  const progress = useRef(0)
  const startAngle = useRef(0)
  const startY = useRef(0)
  const startRadius = useRef(5.5)
  useFrame((state, delta) => {
    if (focus) {
      if (!wasFocused.current) {
        const dx = state.camera.position.x - (camTarget?.x ?? 0)
        const dz = state.camera.position.z - (camTarget?.z ?? 0)
        startAngle.current = Math.atan2(dx, dz)
        startY.current = state.camera.position.y
        startRadius.current = Math.hypot(dx, dz)
        progress.current = 0
        wasFocused.current = true
      }
      progress.current = Math.min(1, progress.current + delta * (camSpeed ?? 0.6))
      onProgress?.(progress.current)
      const t = progress.current
      const angle = startAngle.current + (camSpin ?? Math.PI) * t
      const radius = startRadius.current + ((camRadius ?? 2.73) - startRadius.current) * t
      const y = startY.current + ((camHeight ?? -0.49) - startY.current) * t
      const x = (camTarget?.x ?? 0) + Math.sin(angle) * radius
      const z = (camTarget?.z ?? 0) + Math.cos(angle) * radius
      easing.damp3(state.camera.position, [x, y, z], 0.5, delta)
      state.camera.lookAt(camTarget?.x ?? 0, camTarget?.y ?? 0.25, camTarget?.z ?? 0)
    } else {
      wasFocused.current = false
      onProgress?.(0)
      if (forceBase) {
        state.camera.position.set(-1.5, 1, 5.5)
        state.camera.lookAt(0, 0, 0)
      } else {
        const g = gyroRef?.current
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
        const useGyro = isMobile && g?.active
        const px = useGyro ? g.x : state.pointer.x
        const py = useGyro ? g.y : state.pointer.y
        easing.damp3(
          state.camera.position,
          [-1 + (px * state.viewport.width) / 3, (1 + py) / 2, 5.5],
          0.5,
          delta
        )
        state.camera.lookAt(0, 0, 0)
      }
    }
  })
}

// FreeFlyCamera removed (unused)

function ZoomSpotlight({
  enabled,
  target,
  zoomProgress,
  intensity = 2,
  angle = 0.6,
  penumbra = 0.6,
  height = 1.2,
  offsetX = 0,
  offsetZ = 0,
  distance = 0,
  decay = 0,
  shadowBias = -0.0005,
  shadowRadius = 1,
  fadeSpeed = 3,
  color = '#ffffff'
}) {
  const light = useRef()
  const targetRef = useRef()
  useEffect(() => {
    if (light.current && targetRef.current) light.current.target = targetRef.current
  }, [])
  useEffect(() => {
    if (targetRef.current && target) {
      targetRef.current.position.set(target[0], target[1], target[2])
      light.current?.target.updateMatrixWorld()
    }
  }, [target])
  useFrame((_, delta) => {
    if (!light.current) return
    const desired = enabled && zoomProgress >= 1 ? intensity : 0
    light.current.intensity += (desired - light.current.intensity) * Math.min(1, delta * fadeSpeed)
  })
  return (
    <>
      <spotLight
        ref={light}
        position={[target[0] + offsetX, target[1] + height, target[2] + offsetZ]}
        angle={angle}
        penumbra={penumbra}
        intensity={0}
        distance={distance}
        decay={decay}
        color={color}
        castShadow
        shadow-bias={shadowBias}
        shadow-radius={shadowRadius}
      />
      <object3D ref={targetRef} position={target} />
    </>
  )
}

