import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimationProps } from '../types';

interface Firework {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  life: number;
  maxLife: number;
  exploded: boolean;
  particles: {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
  }[];
}

export function ThumbsUpAnimation({ intensity = 1 }: AnimationProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const fireworksRef = useRef<Firework[]>([]);
  const lastSpawnRef = useRef(0);

  const particleCount = 1000;

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    // Initialize all to hidden position
    for (let i = 0; i < particleCount * 3; i++) {
      positions[i] = 1000; // Far away
      colors[i] = 0;
    }

    return { positions, colors };
  }, []);

  const createFirework = (): Firework => {
    const x = (Math.random() - 0.5) * 3;
    const hue = Math.random();

    return {
      position: new THREE.Vector3(x, -2, 0),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        0.08 + Math.random() * 0.04,
        0
      ),
      color: new THREE.Color().setHSL(hue, 1, 0.5),
      life: 0,
      maxLife: 60 + Math.random() * 30,
      exploded: false,
      particles: [],
    };
  };

  const explodeFirework = (firework: Firework) => {
    const particleCount = 50 + Math.floor(Math.random() * 30);
    firework.particles = [];

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 0.03 + Math.random() * 0.05;

      firework.particles.push({
        position: firework.position.clone(),
        velocity: new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.sin(phi) * Math.sin(theta) * speed,
          Math.cos(phi) * speed
        ),
      });
    }

    firework.exploded = true;
    firework.life = 0;
    firework.maxLife = 80;
  };

  useFrame((state) => {
    if (!pointsRef.current) return;

    const time = state.clock.elapsedTime;

    // Spawn new fireworks
    if (time - lastSpawnRef.current > 0.5 / intensity) {
      fireworksRef.current.push(createFirework());
      lastSpawnRef.current = time;
    }

    // Limit active fireworks
    if (fireworksRef.current.length > 10) {
      fireworksRef.current = fireworksRef.current.slice(-10);
    }

    const positionAttr = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const colorAttr = pointsRef.current.geometry.attributes.color.array as Float32Array;

    // Reset positions
    for (let i = 0; i < particleCount * 3; i++) {
      positionAttr[i] = 1000;
    }

    let particleIndex = 0;

    // Update fireworks
    fireworksRef.current = fireworksRef.current.filter((fw) => {
      fw.life++;

      if (!fw.exploded) {
        // Rising phase
        fw.position.add(fw.velocity);
        fw.velocity.y -= 0.001; // Gravity

        // Draw trail
        if (particleIndex < particleCount) {
          const i3 = particleIndex * 3;
          positionAttr[i3] = fw.position.x;
          positionAttr[i3 + 1] = fw.position.y;
          positionAttr[i3 + 2] = fw.position.z;
          colorAttr[i3] = fw.color.r;
          colorAttr[i3 + 1] = fw.color.g;
          colorAttr[i3 + 2] = fw.color.b;
          particleIndex++;
        }

        // Explode at peak
        if (fw.velocity.y < 0 || fw.life > fw.maxLife) {
          explodeFirework(fw);
        }

        return true;
      } else {
        // Explosion phase
        const progress = fw.life / fw.maxLife;

        for (const particle of fw.particles) {
          if (particleIndex >= particleCount) break;

          particle.position.add(particle.velocity);
          particle.velocity.y -= 0.001; // Gravity
          particle.velocity.multiplyScalar(0.98); // Drag

          const i3 = particleIndex * 3;
          positionAttr[i3] = particle.position.x;
          positionAttr[i3 + 1] = particle.position.y;
          positionAttr[i3 + 2] = particle.position.z;

          // Fade color
          const fade = 1 - progress;
          colorAttr[i3] = fw.color.r * fade;
          colorAttr[i3 + 1] = fw.color.g * fade;
          colorAttr[i3 + 2] = fw.color.b * fade;

          particleIndex++;
        }

        return fw.life < fw.maxLife;
      }
    });

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.geometry.attributes.color.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={1}
        sizeAttenuation
      />
    </points>
  );
}
