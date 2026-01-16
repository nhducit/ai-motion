import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimationProps } from '../types';

export function PointAnimation({ intensity = 1 }: AnimationProps) {
  const beamRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const particleData = useMemo(() => {
    const count = 100;
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 0.2;
      positions[i3 + 1] = (Math.random() - 0.5) * 0.2;
      positions[i3 + 2] = Math.random() * 5;
      speeds[i] = 0.05 + Math.random() * 0.1;
    }

    return { positions, speeds, count };
  }, []);

  useFrame((state) => {
    if (!beamRef.current || !particlesRef.current) return;

    const time = state.clock.elapsedTime;

    // Animate beam
    beamRef.current.scale.x = 0.8 + Math.sin(time * 10) * 0.2 * intensity;
    beamRef.current.scale.y = 0.8 + Math.sin(time * 10) * 0.2 * intensity;

    // Animate particles along beam
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < particleData.count; i++) {
      const i3 = i * 3;
      positions[i3 + 2] -= particleData.speeds[i] * intensity;

      if (positions[i3 + 2] < 0) {
        positions[i3 + 2] = 5;
        positions[i3] = (Math.random() - 0.5) * 0.2;
        positions[i3 + 1] = (Math.random() - 0.5) * 0.2;
      }
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      {/* Main laser beam */}
      <mesh ref={beamRef} position={[0, 0, 2.5]}>
        <cylinderGeometry args={[0.05, 0.05, 5, 16]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.8} />
      </mesh>

      {/* Core glow */}
      <mesh position={[0, 0, 2.5]}>
        <cylinderGeometry args={[0.1, 0.1, 5, 16]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.3} />
      </mesh>

      {/* Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleData.count}
            array={particleData.positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          color="#ffffff"
          transparent
          opacity={0.8}
          sizeAttenuation
        />
      </points>

      {/* Light source */}
      <pointLight color="#00ffff" intensity={3} distance={10} />
    </group>
  );
}
