import { useMemo } from 'react';
import { type TrafficEngine } from '../simulation/engine';
import { IntersectionRoads, StreetLight, TrafficSignal } from './Intersection';
import { Vehicle } from './Vehicle';
import { timeThemes, type TimeOfDay } from './time';
type BuildingProps = { x: number; z: number; width: number; depth: number; height: number; color: string; time: TimeOfDay; accent?: boolean };

function Building({ x, z, width, depth, height, color, time, accent = false }: BuildingProps) {
  const floors = Math.max(3, Math.floor(height / 3.4));
  const colsFront = Math.max(2, Math.floor(width / 2.4));
  const colsSide = Math.max(2, Math.floor(depth / 2.4));
  const theme = timeThemes[time];
  const frontWindows = useMemo(
    () =>
      Array.from({ length: floors * colsFront }, (_, index) => ({
        col: index % colsFront,
        floor: Math.floor(index / colsFront),
        lit: (index * 7 + Math.round(x)) % 9 === 0,
      })),
    [colsFront, floors, x],
  );
  const sideWindows = useMemo(
    () =>
      Array.from({ length: floors * colsSide }, (_, index) => ({
        col: index % colsSide,
        floor: Math.floor(index / colsSide),
        lit: (index * 11 + Math.round(z)) % 13 === 0,
      })),
    [colsSide, floors, z],
  );

  return (
    <group position={[x, 0.26, z]}>
      <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} roughness={accent ? 0.52 : 0.78} metalness={accent ? 0.25 : 0.04} />
      </mesh>
      <mesh receiveShadow position={[0, height + 0.15, 0]}>
        <boxGeometry args={[width + 0.22, 0.3, depth + 0.22]} />
        <meshStandardMaterial color={accent ? '#d6d5c8' : '#9da39f'} roughness={0.75} />
      </mesh>
      {frontWindows.map(({ col, floor, lit }) => (
        <mesh key={`f-${col}-${floor}`} position={[-width / 2 + ((col + 0.5) * width) / colsFront, 2.1 + floor * 3.34, depth / 2 + 0.015]}>
          <boxGeometry args={[(width / colsFront) * 0.7, 2.12, 0.035]} />
          <meshStandardMaterial
            color={lit && (time === 'night' || time === 'evening') ? theme.litWindow : theme.window}
            emissive={lit && (time === 'night' || time === 'evening') ? '#c8a36a' : '#000000'}
            emissiveIntensity={time === 'night' ? 0.43 : time === 'evening' ? 0.15 : 0}
            metalness={0.48}
            roughness={0.22}
          />
        </mesh>
      ))}
      {sideWindows.map(({ col, floor, lit }) => (
        <mesh
          key={`s-${col}-${floor}`}
          position={[width / 2 + 0.017, 2.1 + floor * 3.34, -depth / 2 + ((col + 0.5) * depth) / colsSide]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <boxGeometry args={[(depth / colsSide) * 0.7, 2.12, 0.035]} />
          <meshStandardMaterial
            color={lit && (time === 'night' || time === 'evening') ? theme.litWindow : theme.window}
            emissive={lit && (time === 'night' || time === 'evening') ? '#c8a36a' : '#000000'}
            emissiveIntensity={time === 'night' ? 0.43 : time === 'evening' ? 0.15 : 0}
            metalness={0.48}
            roughness={0.22}
          />
        </mesh>
      ))}
      {accent &&
        Array.from({ length: floors }, (_, i) => (
          <mesh key={`band-${i}`} position={[0, 3.45 + i * 3.34, depth / 2 + 0.045]}>
            <boxGeometry args={[width + 0.08, 0.13, 0.09]} />
            <meshStandardMaterial color="#e4e1d4" />
          </mesh>
        ))}
    </group>
  );
}

const buildings = [
  { x: -41, z: -41, width: 23, depth: 21, height: 49, color: '#b9beb7', accent: true },
  { x: -23, z: -46, width: 14, depth: 19, height: 31, color: '#8e9d9b' },
  { x: 27, z: -45, width: 17, depth: 22, height: 34, color: '#b1b8b4', accent: true },
  { x: 56, z: -45, width: 17, depth: 18, height: 39, color: '#9faead', accent: true },
  { x: -46, z: -24, width: 18, depth: 15, height: 18, color: '#adb0a9' },
  { x: 56, z: -25, width: 19, depth: 14, height: 22, color: '#c1bcb2' },
  { x: -53, z: 57, width: 20, depth: 17, height: 17, color: '#b1b0a9' },
  { x: 57, z: 57, width: 20, depth: 18, height: 15, color: '#b6b7af' },
] as const;

function Tree({ x, z, size = 1 }: { x: number; z: number; size?: number }) {
  return (
    <group position={[x, 0.3, z]} scale={size}>
      <mesh castShadow position={[0, 2.3, 0]}>
        <cylinderGeometry args={[0.22, 0.32, 4.6, 7]} />
        <meshStandardMaterial color="#675b43" roughness={1} />
      </mesh>
      <mesh castShadow position={[0, 5, 0]}>
        <sphereGeometry args={[2.05, 9, 7]} />
        <meshStandardMaterial color="#527b4e" roughness={1} />
      </mesh>
      <mesh castShadow position={[1.05, 4.6, 0.2]}>
        <sphereGeometry args={[1.35, 8, 7]} />
        <meshStandardMaterial color="#61894e" roughness={1} />
      </mesh>
      <mesh castShadow position={[-1.1, 4.6, 0]}>
        <sphereGeometry args={[1.3, 8, 7]} />
        <meshStandardMaterial color="#6f9252" roughness={1} />
      </mesh>
      <mesh castShadow position={[0.1, 5.8, -0.5]}>
        <sphereGeometry args={[1.42, 8, 7]} />
        <meshStandardMaterial color="#759753" roughness={1} />
      </mesh>
    </group>
  );
}

function Planter({ x, z, width = 7 }: { x: number; z: number; width?: number }) {
  return (
    <group position={[x, 0.36, z]}>
      <mesh receiveShadow position={[0, 0.27, 0]}>
        <boxGeometry args={[width, 0.54, 1.15]} />
        <meshStandardMaterial color="#a5aa9d" />
      </mesh>
      <mesh position={[0, 0.56, 0]}>
        <boxGeometry args={[width - 0.3, 0.1, 0.87]} />
        <meshStandardMaterial color="#435b3c" />
      </mesh>
      {Array.from({ length: Math.floor(width) }, (_, i) => (
        <mesh key={i} position={[-width / 2 + 0.55 + i, 0.74, 0]}>
          <sphereGeometry args={[0.51, 7, 5]} />
          <meshStandardMaterial color={i % 2 ? '#5c814b' : '#426e43'} />
        </mesh>
      ))}
    </group>
  );
}

export function World({
  time,
  engine,
  compact,
  playground = false,
}: {
  time: TimeOfDay;
  engine: TrafficEngine;
  compact: boolean;
  playground?: boolean;
}) {
  const layout = engine.layout;
  const clearOfRoad = (x: number, z: number, margin: number) =>
    Math.hypot(x, z) > layout.stopRadius + margin &&
    layout.approaches.every((a) => {
      const along = x * Math.cos(a.angle) + z * Math.sin(a.angle);
      const across = -x * Math.sin(a.angle) + z * Math.cos(a.angle);
      return along < 0 || Math.abs(across) > 13.5 + margin;
    });
  const treePositions = [
    [-19, -38],
    [-64, -22],
    [-34, -19],
    [19, -38],
    [39, -19],
    [65, -28],
    [-19, 33],
    [-34, 19],
    [-62, 30],
    [19, 32],
    [34, 19],
    [64, 29],
    [-58, 57],
    [59, 60],
  ];
  return (
    <group>
      <IntersectionRoads layout={layout} />
      {buildings
        .filter((b, i) => (!compact || i % 2 === 0) && clearOfRoad(b.x, b.z, 13))
        .map((building) => (
          <Building key={`${building.x}-${building.z}`} {...building} height={playground ? building.height * 0.65 : building.height} time={time} />
        ))}
      {treePositions
        .filter(([x, z], i) => (!compact || i % 2 === 0) && clearOfRoad(x, z, 3))
        .map(([x, z], i) => (
          <Tree key={`${x}-${z}`} x={x} z={z} size={1.12 + (i % 3) * 0.13} />
        ))}
      {[
        [-29, -18],
        [29, -18],
        [-29, 18],
        [29, 18],
      ]
        .filter(([x, z]) => clearOfRoad(x, z, 4))
        .map(([x, z]) => (
          <Planter key={`${x}-${z}`} x={x} z={z} />
        ))}
      {layout.approaches.map((a, source) => (
        <group key={a.id}>
          <TrafficSignal engine={engine} source={source} />
          <StreetLight angle={a.angle} radius={layout.stopRadius + 13} side={1} night={time === 'night'} light />
          <StreetLight angle={a.angle} radius={layout.stopRadius + 32} side={-1} night={time === 'night'} light={false} />
        </group>
      ))}
      {engine.vehicles.map((vehicle) => (
        <Vehicle key={vehicle.id} vehicle={vehicle} night={time === 'night'} />
      ))}
    </group>
  );
}
