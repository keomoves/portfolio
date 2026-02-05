import { useRef, useState, useContext } from 'react'
import { useFrame } from '@react-three/fiber'
import { useCursor } from '@react-three/drei'
import { VideoModalContext } from './index'

export function SpinningBox({
  scale,
  videoUrl = 'https://www.youtube.com/embed/lw3WAqcI8YI?autoplay=1',
  globalHover = false,
  color = 'indianred',
  hoverColor = 'hotpink',
  ...props
}) {
  // This reference gives us direct access to the THREE.Mesh object
  const ref = useRef()
  // Hold state for hovered and clicked events
  const [localHovered, setLocalHovered] = useState(false)
  const { openVideo } = useContext(VideoModalContext)

  // Combine global hover with local hover
  const isHovered = globalHover || localHovered

  useCursor(isHovered)

  // Subscribe this component to the render-loop, rotate the mesh every frame
  useFrame((state, delta) => (ref.current.rotation.x = ref.current.rotation.y += delta))

  // Return the view, these are regular Threejs elements expressed in JSX
  return (
    <mesh
      {...props}
      ref={ref}
      scale={isHovered ? scale * 1.4 : scale * 1.2}
      onClick={videoUrl ? (() => openVideo(videoUrl)) : undefined}
      onPointerOver={(event) => setLocalHovered(true)}
      onPointerOut={(event) => setLocalHovered(false)}>
      <boxGeometry />
      <meshStandardMaterial color={isHovered ? hoverColor : color} />
    </mesh>
  )
}
