import { useEffect, useRef, useState, useMemo } from 'react'
import { useGLTF, useAnimations, useCursor } from '@react-three/drei'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const DEFAULT_URL = '/Keo%20character%20basemesh%20posed%20-%20colored.glb'

export function Character({
  url = DEFAULT_URL,
  onClick,
  hoverEnabled = true,
  showHitBox = false,
  hitBoxScale = 0.7,
  hitBoxOffset = { x: 0, y: 0, z: 0 },
  headLookAtMouse = false,
  headYawOffset = 0,     // radians (+ right, - left)
  headPitchOffset = 0,   // radians (+ up, - down)
  headInvertX = false,
  headInvertY = false,
  ...props
}) {
  const group = useRef()
  const { scene, animations } = useGLTF(url)
  const { actions, names, clips, mixer } = useAnimations(animations, group)
  const [hovered, setHovered] = useState(false)
  useCursor(hovered && hoverEnabled)
  const emissiveMapRef = useRef(new Map())
  const filteredClipRef = useRef(null)
  const filteredActionRef = useRef(null)
  // head tracking
  const headBoneRef = useRef(null)
  const raycasterRef = useRef(new THREE.Raycaster())
  const planeRef = useRef(new THREE.Plane())
  const tmpVec = useRef(new THREE.Vector3()).current
  const tmpDir = useRef(new THREE.Vector3()).current
  const targetWorld = useRef(new THREE.Vector3()).current
  const desiredQuat = useRef(new THREE.Quaternion()).current
  const savedQuat = useRef(new THREE.Quaternion()).current
  const { camera, pointer } = useThree()

  // compute a single hitbox to receive pointer events (reduces hover event spam)
  const hitBox = useMemo(() => {
    if (!scene) return null
    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    if (size.length() === 0) size.set(1, 1.6, 1)
    return { size, center }
  }, [scene])

  useEffect(() => {
    if (actions && names && names.length > 0) {
      const a = actions[names[0]]
      if (a) a.reset().setLoop(THREE.LoopRepeat).play()
    }
  }, [actions, names])
  // When head tracking is active, play a filtered clip without head/neck tracks so only the neck is "freed"
  useEffect(() => {
    if (!mixer || !group.current) return
    // helper to start default action
    const playDefault = () => {
      if (actions && names && names[0] && actions[names[0]]) {
        actions[names[0]].reset().setLoop(THREE.LoopRepeat).play()
      }
    }
    if (headLookAtMouse) {
      // stop all original actions
      if (actions) Object.values(actions).forEach((a) => a && a.stop())
      // build filtered clip once
      if (!filteredClipRef.current) {
        const baseClip = (clips && clips.find((c) => c.name === (names?.[0] ?? ''))) || clips?.[0]
        if (baseClip) {
          const filteredTracks = baseClip.tracks.filter((t) => {
            const n = t.name.toLowerCase()
            return !(n.includes('head') || n.includes('neck') || n.includes('tete'))
          })
          filteredClipRef.current = new THREE.AnimationClip(
            (baseClip.name || 'clip') + '_no_head',
            baseClip.duration,
            filteredTracks
          )
        }
      }
      if (filteredClipRef.current) {
        filteredActionRef.current?.stop()
        filteredActionRef.current = mixer.clipAction(filteredClipRef.current, group.current)
        filteredActionRef.current.reset().setLoop(THREE.LoopRepeat).play()
      } else {
        // fallback: if no clip, at least keep originals running (head will still be overridden each frame)
        playDefault()
      }
    } else {
      // disable filtered and restore originals
      filteredActionRef.current?.stop()
      playDefault()
    }
  }, [headLookAtMouse, mixer, group, actions, names, clips])

  // cache emissive materials once
  useEffect(() => {
    if (!scene) return
    // try find head bone
    let found = null
    scene.traverse((obj) => {
      if (obj.isBone) {
        const nm = obj.name?.toLowerCase?.() ?? ''
        if (!found && (nm.includes('head') || nm.includes('tete') || nm.includes('neck'))) found = obj
      }
    })
    headBoneRef.current = found
    const mats = []
    scene.traverse((obj) => {
      if (!obj.isMesh || !obj.material) return
      const mat = obj.material
      if (!('emissive' in mat)) return
      mats.push(mat)
    })
    mats.forEach((m) => {
      if (!emissiveMapRef.current.has(m)) {
        emissiveMapRef.current.set(m, {
          emissive: m.emissive ? m.emissive.clone() : null,
          intensity: m.emissiveIntensity ?? 0
        })
      }
    })
  }, [scene])

  // toggle glow only on enter/leave
  useEffect(() => {
    emissiveMapRef.current.forEach((saved, mat) => {
      if (hovered) {
        if (mat.emissive) {
          mat.emissive.set('#35c19f')
          mat.emissiveIntensity = Math.max(saved.intensity ?? 0, 0.8)
        }
      } else {
        if (mat.emissive && saved.emissive) mat.emissive.copy(saved.emissive)
        if ('emissiveIntensity' in mat) mat.emissiveIntensity = saved.intensity
      }
    })
  }, [hovered])

  // when hover is disabled (zoomed), ensure state and emissive are restored
  useEffect(() => {
    if (!hoverEnabled) {
      setHovered(false)
      emissiveMapRef.current.forEach((saved, mat) => {
        if (mat.emissive && saved.emissive) mat.emissive.copy(saved.emissive)
        if ('emissiveIntensity' in mat) mat.emissiveIntensity = saved.intensity
      })
    }
  }, [hoverEnabled])

  // Make head follow mouse subtly
  useFrame(() => {
    if (!headLookAtMouse) return
    const head = headBoneRef.current
    if (!head) return
    // world position of head
    head.updateWorldMatrix(true, false)
    head.getWorldPosition(tmpVec)
    // plane parallel to camera through head
    planeRef.current.setFromNormalAndCoplanarPoint(camera.getWorldDirection(tmpDir).normalize(), tmpVec)
    raycasterRef.current.setFromCamera(pointer, camera)
    if (!raycasterRef.current.ray.intersectPlane(planeRef.current, targetWorld)) return
    // convert target to head parent local space
    const parent = head.parent
    if (!parent) return
    const localTarget = targetWorld.clone()
    parent.worldToLocal(localTarget)
    // compute desired quat by temporary lookAt
    savedQuat.copy(head.quaternion)
    head.lookAt(localTarget)
    desiredQuat.copy(head.quaternion)
    head.quaternion.copy(savedQuat)
    // clamp: convert desired to Euler in head local space
    const e = new THREE.Euler().setFromQuaternion(desiredQuat, 'YXZ')
    // inversion
    if (headInvertX) e.y *= -1
    if (headInvertY) e.x *= -1
    // clamp around zero then re-center around offsets with symmetric range
    const yawMax = 0.6
    const pitchMax = 0.35
    const clampedYaw = THREE.MathUtils.clamp(e.y, -yawMax, yawMax)
    const clampedPitch = THREE.MathUtils.clamp(e.x, -pitchMax, pitchMax)
    // re-center around offsets keeping full range available
    e.y = THREE.MathUtils.clamp(clampedYaw + headYawOffset, headYawOffset - yawMax, headYawOffset + yawMax)
    e.x = THREE.MathUtils.clamp(clampedPitch + headPitchOffset, headPitchOffset - pitchMax, headPitchOffset + pitchMax)
    desiredQuat.setFromEuler(e)
    // smooth
    head.quaternion.slerp(desiredQuat, 0.12)
  })

  return (
    <group ref={group} {...props}>
      {hitBox && (
        <mesh
          position={[
            hitBox.center.x + (hitBoxOffset.x ?? 0),
            hitBox.center.y + (hitBoxOffset.y ?? 0),
            (hitBox.size.z ? hitBox.center.z : 0) + (hitBoxOffset.z ?? 0)
          ]}
          onPointerOver={hoverEnabled ? () => setHovered(true) : undefined}
          onPointerOut={hoverEnabled ? () => setHovered(false) : undefined}
          onClick={onClick}
        >
          <boxGeometry
            args={[
              hitBox.size.x * (typeof hitBoxScale === 'number' ? hitBoxScale : hitBoxScale.x ?? 1),
              hitBox.size.y * (typeof hitBoxScale === 'number' ? hitBoxScale : hitBoxScale.y ?? 1),
              (hitBox.size.z || 1) * (typeof hitBoxScale === 'number' ? hitBoxScale : hitBoxScale.z ?? 1)
            ]}
          />
          <meshBasicMaterial
            color={showHitBox ? '#35c19f' : '#000000'}
            transparent
            opacity={showHitBox ? 0.25 : 0}
            depthWrite={false}
            depthTest={false}
            wireframe={showHitBox}
          />
        </mesh>
      )}
      <primitive object={scene} />
    </group>
  )
}

useGLTF.preload(DEFAULT_URL)

