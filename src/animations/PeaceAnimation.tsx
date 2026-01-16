import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimationProps } from '../types';

export function PeaceAnimation({ intensity = 1 }: AnimationProps) {
  const waveRef = useRef<THREE.Mesh>(null);
  const pointsRef = useRef<THREE.Points>(null);

  const waveGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(4, 4, 64, 64);
    return geometry;
  }, []);

  const particleData = useMemo(() => {
    const count = 200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const r = Math.random() * 2;

      positions[i3] = Math.cos(theta) * r;
      positions[i3 + 1] = Math.sin(theta) * r;
      positions[i3 + 2] = (Math.random() - 0.5) * 0.5;

      // Rainbow colors
      const hue = theta / (Math.PI * 2);
      const color = new THREE.Color().setHSL(hue, 1, 0.5);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    return { positions, colors, count };
  }, []);

  useFrame((state) => {
    if (!waveRef.current || !pointsRef.current) return;

    const time = state.clock.elapsedTime;
    const positions = waveRef.current.geometry.attributes.position.array as Float32Array;

    // Animate wave
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const dist = Math.sqrt(x * x + y * y);

      positions[i + 2] =
        Math.sin(dist * 2 - time * 3) * 0.3 * intensity +
        Math.sin(x * 3 + time * 2) * 0.1 * intensity;
    }

    waveRef.current.geometry.attributes.position.needsUpdate = true;

    // Update wave colors
    const colors = waveRef.current.geometry.attributes.color;
    if (!colors) {
      const colorArray = new Float32Array(positions.length);
      for (let i = 0; i < positions.length; i += 3) {
        const hue = (time * 0.1 + positions[i] * 0.1 + positions[i + 1] * 0.1) % 1;
        const color = new THREE.Color().setHSL(hue, 1, 0.5);
        colorArray[i] = color.r;
        colorArray[i + 1] = color.g;
        colorArray[i + 2] = color.b;
      }
      waveRef.current.geometry.setAttribute(
        'color',
        new THREE.BufferAttribute(colorArray, 3)
      );
    } else {
      const colorArray = colors.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        const hue = (time * 0.1 + positions[i] * 0.1 + positions[i + 1] * 0.1) % 1;
        const color = new THREE.Color().setHSL(hue, 1, 0.5);
        colorArray[i] = color.r;
        colorArray[i + 1] = color.g;
        colorArray[i + 2] = color.b;
      }
      colors.needsUpdate = true;
    }

    // Animate particles
    const particlePositions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < particleData.count; i++) {
      const i3 = i * 3;
      const angle = Math.atan2(particlePositions[i3 + 1], particlePositions[i3]);
      const newAngle = angle + 0.01 * intensity;
      const r = Math.sqrt(
        particlePositions[i3] ** 2 + particlePositions[i3 + 1] ** 2
      );

      particlePositions[i3] = Math.cos(newAngle) * r;
      particlePositions[i3 + 1] = Math.sin(newAngle) * r;
      particlePositions[i3 + 2] = Math.sin(time * 2 + r) * 0.3;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <group>
      <mesh ref={waveRef} geometry={waveGeometry} rotation={[-Math.PI / 4, 0, 0]}>
        <meshBasicMaterial vertexColors side={THREE.DoubleSide} />
      </mesh>

      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleData.count}
            array={particleData.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={particleData.count}
            array={particleData.colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          vertexColors
          transparent
          opacity={0.9}
          sizeAttenuation
        />
      </points>
    </group>
  );
}
