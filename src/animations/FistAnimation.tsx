import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { AnimationProps } from '../types';

export function FistAnimation({ intensity = 1 }: AnimationProps) {
  const sphereRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!sphereRef.current || !glowRef.current) return;

    const time = state.clock.elapsedTime;
    const pulse = Math.sin(time * 3) * 0.3 + 1;
    const scale = pulse * intensity;

    sphereRef.current.scale.setScalar(scale);
    glowRef.current.scale.setScalar(scale * 1.5);

    // Color shift
    const hue = (time * 0.1) % 1;
    (sphereRef.current.material as THREE.MeshStandardMaterial).color.setHSL(
      hue,
      1,
      0.5
    );
    (sphereRef.current.material as THREE.MeshStandardMaterial).emissive.setHSL(
      hue,
      1,
      0.2
    );
  });

  return (
    <group>
      <Sphere ref={sphereRef} args={[0.5, 32, 32]}>
        <meshStandardMaterial
          color="#ff6b6b"
          emissive="#ff0000"
          emissiveIntensity={0.5}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
      <Sphere ref={glowRef} args={[0.5, 16, 16]}>
        <meshBasicMaterial
          color="#ff6b6b"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </Sphere>
      <pointLight color="#ff6b6b" intensity={2} distance={5} />
    </group>
  );
}
