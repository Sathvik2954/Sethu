'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { RoundedBox, Float, ContactShadows, OrbitControls } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'

// SETHU palette colors
const BURNT = '#D94F00'
const STRAW = '#E8C87A'
const FOREST = '#3D7A50'
const MUTED = '#8A6A4A'
const SAND = '#C8A878'
const INK = '#1C1208'

const R = 0.06

const DESK_LEGS: [number, number, number][] = [
  [-1.15, -0.89, -0.45],
  [1.15, -0.89, -0.45],
  [-1.15, -0.89, 0.45],
  [1.15, -0.89, 0.45],
]

const CHAIR_LEGS: [number, number, number][] = [
  [-0.35, -1.11, 0.7],
  [0.35, -1.11, 0.7],
  [-0.35, -1.11, 1.4],
  [0.35, -1.11, 1.4],
]

function Character() {
  const head = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (head.current) head.current.position.y = 0.82 + Math.sin(t * 1.6) * 0.015
  })

  return (
    <group position={[0, -0.67, 1.05]}>
      {/* Torso */}
      <RoundedBox args={[0.55, 0.65, 0.35]} radius={R} smoothness={4} position={[0, 0.32, 0]}>
        <meshStandardMaterial color={BURNT} roughness={0.55} />
      </RoundedBox>

      {/* Head group */}
      <group ref={head} position={[0, 0.82, 0]}>
        <mesh>
          <sphereGeometry args={[0.26, 32, 32]} />
          <meshStandardMaterial color={STRAW} roughness={0.5} />
        </mesh>

        {/* Hair - larger sphere offset toward top-back, forms a natural cap over the head */}
        <mesh position={[0, 0.08, 0.10]}>
          <sphereGeometry args={[0.27, 24, 24]} />
          <meshStandardMaterial color={INK} roughness={0.6} />
        </mesh>

        {/* Glasses - facing the monitor (-Z) */}
        <mesh position={[-0.11, 0.02, -0.23]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.08, 0.012, 12, 32]} />
          <meshStandardMaterial color={INK} roughness={0.4} />
        </mesh>
        <mesh position={[0.11, 0.02, -0.23]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.08, 0.012, 12, 32]} />
          <meshStandardMaterial color={INK} roughness={0.4} />
        </mesh>
        <RoundedBox args={[0.08, 0.015, 0.02]} radius={0.005} position={[0, 0.02, -0.23]}>
          <meshStandardMaterial color={INK} roughness={0.4} />
        </RoundedBox>
      </group>

      {/* Arms */}
      <RoundedBox args={[0.14, 0.48, 0.14]} radius={R} smoothness={4} position={[-0.35, 0.3, -0.05]}>
        <meshStandardMaterial color={BURNT} roughness={0.55} />
      </RoundedBox>
      <RoundedBox args={[0.14, 0.48, 0.14]} radius={R} smoothness={4} position={[0.35, 0.3, -0.05]}>
        <meshStandardMaterial color={BURNT} roughness={0.55} />
      </RoundedBox>

      {/* Thighs */}
      <RoundedBox args={[0.16, 0.45, 0.16]} radius={R} smoothness={4} position={[-0.15, 0.02, -0.22]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color={STRAW} roughness={0.5} />
      </RoundedBox>
      <RoundedBox args={[0.16, 0.45, 0.16]} radius={R} smoothness={4} position={[0.15, 0.02, -0.22]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color={STRAW} roughness={0.5} />
      </RoundedBox>

      {/* Shins */}
      <RoundedBox args={[0.15, 0.65, 0.15]} radius={R} smoothness={4} position={[-0.15, -0.32, -0.4]}>
        <meshStandardMaterial color={STRAW} roughness={0.5} />
      </RoundedBox>
      <RoundedBox args={[0.15, 0.65, 0.15]} radius={R} smoothness={4} position={[0.15, -0.32, -0.4]}>
        <meshStandardMaterial color={STRAW} roughness={0.5} />
      </RoundedBox>

      {/* Feet - toes point toward the monitor/camera (-Z), heel near the ankle */}
      <RoundedBox args={[0.17, 0.08, 0.28]} radius={0.03} smoothness={4} position={[-0.15, -0.68, -0.5]}>
        <meshStandardMaterial color={INK} roughness={0.6} />
      </RoundedBox>
      <RoundedBox args={[0.17, 0.08, 0.28]} radius={0.03} smoothness={4} position={[0.15, -0.68, -0.5]}>
        <meshStandardMaterial color={INK} roughness={0.6} />
      </RoundedBox>
    </group>
  )
}

function Scene() {
  const group = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (group.current) group.current.rotation.y = Math.sin(t * 0.15) * 0.1
  })

  return (
    <group ref={group} position={[0, -0.1, 0]}>
      {/* Desk Top */}
      <RoundedBox args={[2.5, 0.1, 1.2]} radius={R} smoothness={4} position={[0, -0.4, 0]}>
        <meshStandardMaterial color={SAND} roughness={0.6} />
      </RoundedBox>
      {DESK_LEGS.map((p, i) => (
        <RoundedBox key={`desk-leg-${i}`} args={[0.08, 1.0, 0.08]} radius={0.02} smoothness={4} position={p}>
          <meshStandardMaterial color={MUTED} roughness={0.6} />
        </RoundedBox>
      ))}

      {/* Monitor */}
      <RoundedBox args={[0.9, 0.55, 0.05]} radius={R} smoothness={4} position={[0, 0.15, -0.4]}>
        <meshStandardMaterial color={INK} roughness={0.4} />
      </RoundedBox>
      <RoundedBox args={[0.12, 0.25, 0.06]} radius={0.02} smoothness={4} position={[0, -0.25, -0.4]}>
        <meshStandardMaterial color={INK} roughness={0.4} />
      </RoundedBox>

      {/* Desk Lamp */}
      <mesh position={[-0.9, -0.15, -0.4]}>
        <cylinderGeometry args={[0.03, 0.03, 0.4, 16]} />
        <meshStandardMaterial color={MUTED} roughness={0.5} />
      </mesh>
      <mesh position={[-0.9, 0.1, -0.4]} rotation={[0, 0, Math.PI / 6]}>
        <coneGeometry args={[0.12, 0.18, 24, 1, true]} />
        <meshStandardMaterial color={BURNT} roughness={0.45} side={THREE.DoubleSide} />
      </mesh>

      {/* Desk Plant */}
      <mesh position={[0.9, -0.27, -0.4]}>
        <cylinderGeometry args={[0.09, 0.07, 0.16, 16]} />
        <meshStandardMaterial color={MUTED} roughness={0.6} />
      </mesh>
      <mesh position={[0.9, -0.1, -0.4]}>
        <sphereGeometry args={[0.12, 24, 24]} />
        <meshStandardMaterial color={FOREST} roughness={0.6} />
      </mesh>

      {/* Chair */}
      <RoundedBox args={[0.8, 0.08, 0.8]} radius={R} smoothness={4} position={[0, -0.72, 1.05]}>
        <meshStandardMaterial color={FOREST} roughness={0.55} />
      </RoundedBox>
      <RoundedBox args={[0.8, 0.75, 0.08]} radius={R} smoothness={4} position={[0, -0.32, 1.41]}>
        <meshStandardMaterial color={FOREST} roughness={0.55} />
      </RoundedBox>
      {CHAIR_LEGS.map((p, i) => (
        <mesh key={`chair-leg-${i}`} position={p}>
          <cylinderGeometry args={[0.035, 0.035, 0.7, 16]} />
          <meshStandardMaterial color={MUTED} roughness={0.6} />
        </mesh>
      ))}

      <Character />
    </group>
  )
}

export default function StudentDeskScene() {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [2.6, 1.6, -4.6], fov: 38 }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 4, 4]} intensity={1.0} />
        <directionalLight position={[-3, 2, 2]} intensity={0.3} />

        <Float speed={0.8} rotationIntensity={0.03} floatIntensity={0.1}>
          <Scene />
        </Float>

        <ContactShadows position={[0, -1.6, 0]} opacity={0.4} scale={7} blur={2.2} far={2.5} color={INK} />
        <OrbitControls enableZoom={true} makeDefault />
      </Canvas>
    </div>
  )
}