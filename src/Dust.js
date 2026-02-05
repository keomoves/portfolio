import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function Dust({
  count = 400,
  area = [12, 6, 12],
  speed = 0.03,
  size = 0.02,
  color = '#ffffff',
  opacity = 0.2
}) {
  const points = useRef()
  const positions = useMemo(() => {
    const [ax, ay, az] = area
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      arr[i3 + 0] = (Math.random() - 0.5) * ax
      arr[i3 + 1] = Math.random() * ay // start from 0..ay
      arr[i3 + 2] = (Math.random() - 0.5) * az
    }
    return arr
  }, [count, area])

  useFrame((_, delta) => {
    const [ax, ay] = area
    const arr = points.current.geometry.attributes.position.array
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      arr[i3 + 1] += speed * delta * 60
      if (arr[i3 + 1] > ay) arr[i3 + 1] = 0 // wrap to bottom
      // small horizontal jitter
      arr[i3 + 0] += (Math.random() - 0.5) * 0.002
      arr[i3 + 2] += (Math.random() - 0.5) * 0.002
      // keep within bounds
      if (arr[i3 + 0] > ax / 2) arr[i3 + 0] = -ax / 2
      if (arr[i3 + 0] < -ax / 2) arr[i3 + 0] = ax / 2
    }
    points.current.geometry.attributes.position.needsUpdate = true
  })

  const geom = useMemo(() => new THREE.BufferGeometry(), [])
  const mat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size,
        color,
        transparent: true,
        opacity,
        depthWrite: false
      }),
    [size, color, opacity]
  )

  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  return <points ref={points} geometry={geom} material={mat} position={[0, 0, 0]} />
}

