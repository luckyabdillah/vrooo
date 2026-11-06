import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, CanvasTexture, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace } from 'three';
import { type TrafficEngine } from '../simulation/engine';
import { type Layout } from '../simulation/layout';
import { glowTexture } from './glow';

export function IntersectionRoads({ layout }: { layout: Layout }) {
  const asphalt = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#555b5e';
    context.fillRect(0, 0, 128, 128);
    let seed = 42;
    for (let i = 0; i < 4200; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      context.fillStyle = i % 2 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.06)';
      context.fillRect(seed % 128, (seed >>> 8) % 128, 2, 1);
    }
    const texture = new CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(10, 2);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }, []);
  const stop = layout.stopRadius;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]} receiveShadow>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#a0aea0" roughness={1} />
      </mesh>
      {layout.type === 5 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.075, 0]} receiveShadow>
          <circleGeometry args={[stop + 1, 64]} />
          <meshStandardMaterial map={asphalt} roughness={0.95} />
        </mesh>
      )}
      {layout.approaches.map((approach, index) => (
        <group key={approach.id} position={[0, index * 0.002, 0]} rotation={[0, -approach.angle, 0]}>
          <mesh position={[80, 0, 0]} receiveShadow>
            <boxGeometry args={[160, 0.1, 27]} />
            <meshStandardMaterial map={asphalt} roughness={0.96} />
          </mesh>
          {[-1, 1].map((side) => (
            <group key={side}>
              <mesh position={[(160 + stop) / 2, 0.19, side * 15.5]} receiveShadow>
                <boxGeometry args={[160 - stop, 0.3, 4]} />
                <meshStandardMaterial color="#c9c6b9" roughness={0.95} />
              </mesh>
              <mesh position={[(160 + stop) / 2, 0.09, side * 13.25]}>
                <boxGeometry args={[160 - stop, 0.016, 0.14]} />
                <meshBasicMaterial color="#e5e5dc" />
              </mesh>
              <mesh position={[(150 + stop + 4) / 2, 0.09, side * 0.25]}>
                <boxGeometry args={[150 - stop - 4, 0.016, 0.12]} />
                <meshBasicMaterial color="#e2b755" />
              </mesh>
              {Array.from({ length: 18 }, (_, i) => stop + 7 + i * 6).map((x) => (
                <mesh key={x} position={[x, 0.091, side * 6.75]}>
                  <boxGeometry args={[2.5, 0.016, 0.14]} />
                  <meshBasicMaterial color="#eff0e9" />
                </mesh>
              ))}
            </group>
          ))}
          {Array.from({ length: 18 }, (_, i) => -11.9 + i * 1.4).map((z) => (
            <mesh key={z} position={[stop - 4, 0.1, z]}>
              <boxGeometry args={[3.3, 0.018, 0.8]} />
              <meshBasicMaterial color="#ebece4" />
            </mesh>
          ))}
          <mesh position={[stop, 0.11, 6.75]}>
            <boxGeometry args={[0.3, 0.02, 12.5]} />
            <meshBasicMaterial color="#f3f3eb" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function TrafficSignal({ engine, source }: { engine: TrafficEngine; source: number }) {
  const lamps = useRef<(MeshStandardMaterial | null)[]>([]);
  const colors = ['#fb5540', '#ffbd40', '#42eb92'];
  useFrame(() => {
    const signal = engine.signal(source);
    lamps.current.forEach((material, i) => {
      if (!material) return;
      const on = (i === 0 && signal === 'red') || (i === 1 && signal === 'yellow') || (i === 2 && signal === 'green');
      material.color.set(on ? colors[i] : '#233137');
      material.emissive.set(on ? colors[i] : '#000000');
      material.emissiveIntensity = on ? 2.3 : 0;
    });
  });
  return (
    <group rotation={[0, -engine.layout.approaches[source].angle, 0]}>
      <group position={[engine.layout.stopRadius - 1, 0.2, 15.2]}>
        <mesh position={[0, 4.2, 0]} castShadow>
          <cylinderGeometry args={[0.14, 0.2, 8.4, 10]} />
          <meshStandardMaterial color="#35464d" metalness={0.6} />
        </mesh>
        <mesh position={[0, 8.3, -4]} castShadow>
          <boxGeometry args={[0.19, 0.19, 8.1]} />
          <meshStandardMaterial color="#35464d" metalness={0.6} />
        </mesh>
        <mesh position={[0, 7.64, -7.6]} castShadow>
          <boxGeometry args={[0.78, 2.42, 0.95]} />
          <meshStandardMaterial color="#1c2b30" />
        </mesh>
        {[8.43, 7.66, 6.9].map((y, i) => (
          <mesh key={y} position={[0.43, y, -7.6]}>
            <sphereGeometry args={[0.27, 12, 10]} />
            <meshStandardMaterial
              ref={(material) => {
                lamps.current[i] = material;
              }}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export function StreetLight({ angle, radius, side, night, light }: { angle: number; radius: number; side: number; night: boolean; light: boolean }) {
  return (
    <group rotation={[0, -angle, 0]}>
      <group position={[radius, 0.35, side * 15.5]}>
        <mesh position={[0, 4.8, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.2, 9.6, 10]} />
          <meshStandardMaterial color="#687b80" metalness={0.65} roughness={0.4} />
        </mesh>
        <mesh position={[0, 9.55, -side * 1.4]}>
          <boxGeometry args={[0.14, 0.14, 2.9]} />
          <meshStandardMaterial color="#7a888a" metalness={0.6} />
        </mesh>
        <mesh position={[0, 9.45, -side * 2.8]}>
          <boxGeometry args={[1.15, 0.24, 0.62]} />
          <meshStandardMaterial color="#77888b" />
        </mesh>
        <mesh position={[0, 9.3, -side * 2.8]}>
          <boxGeometry args={[0.95, 0.035, 0.45]} />
          <meshStandardMaterial color={night ? '#fff3c1' : '#dbe7e4'} emissive="#ffe0a0" emissiveIntensity={night ? 5 : 0} toneMapped={false} />
        </mesh>
        {night && (
          <>
            <sprite position={[0, 9.22, -side * 2.8]} scale={[3, 3, 1]}>
              <spriteMaterial
                map={glowTexture()}
                color="#ffe1a1"
                transparent
                opacity={0.7}
                depthWrite={false}
                blending={AdditiveBlending}
                toneMapped={false}
              />
            </sprite>
            <mesh position={[0, -0.22, -side * 3.8]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[19, 16]} />
              <meshBasicMaterial map={glowTexture()} color="#ffe0a1" transparent opacity={0.25} depthWrite={false} blending={AdditiveBlending} />
            </mesh>
            {light && <pointLight position={[0, 8.8, -side * 2.8]} color="#ffdf9f" intensity={180} distance={24} decay={2} />}
          </>
        )}
      </group>
    </group>
  );
}
