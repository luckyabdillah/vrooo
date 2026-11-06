import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, type Group } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { type SimVehicle } from '../simulation/engine';
import { VEHICLE_SPECS, type VehicleKind } from '../simulation/layout';
import { beamTexture, glowTexture } from './glow';

function Box({
  position,
  size,
  color,
  glass = false,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  glass?: boolean;
}) {
  return (
    <mesh castShadow={!glass} receiveShadow position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={glass ? 0.2 : 0.45} metalness={glass ? 0.25 : 0.15} />
    </mesh>
  );
}
function Bus({ color }: { color: string }) {
  const body = useMemo(() => new RoundedBoxGeometry(9, 2.65, 2.5, 2, 0.16), []);
  return (
    <group>
      <mesh geometry={body} position={[0, 1.98, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.36} metalness={0.22} />
      </mesh>
      <Box position={[0, 3.32, 0]} size={[8.4, 0.14, 2.28]} color="#e3e8e8" />
      <Box position={[-0.65, 3.46, 0]} size={[2.8, 0.18, 1.3]} color="#bcc9ce" />
      <Box position={[4.51, 2.25, 0]} size={[0.025, 1.25, 2.17]} color="#172f3b" glass />
      <Box position={[4.52, 2.99, 0]} size={[0.025, 0.22, 1.3]} color="#14282b" />
      <Box position={[4.54, 3, 0]} size={[0.028, 0.045, 0.77]} color="#f3d486" />
      {[-1, 1].map((side) => (
        <group key={side}>
          {[-3.5, -2.05, -0.6, 0.85, 2.3, 3.65].map((x) => (
            <Box key={x} position={[x, 2.4, side * 1.257]} size={[1.24, 1.05, 0.025]} color="#203f51" glass />
          ))}
          <Box position={[0, 1.28, side * 1.266]} size={[8.8, 0.14, 0.03]} color="#edf2ee" />
          <Box position={[2.65, 1.78, side * 1.275]} size={[1.03, 1.8, 0.035]} color="#193849" glass />
          <Box position={[2.65, 1.78, side * 1.298]} size={[0.045, 1.8, 0.028]} color="#a6bec7" />
          <Box position={[4.08, 2.4, side * 1.52]} size={[0.27, 0.38, 0.2]} color="#1c333e" />
        </group>
      ))}
      <Box position={[4.53, 0.89, 0]} size={[0.05, 0.14, 2.3]} color="#d1d9da" />
      <Box position={[-4.52, 2.36, 0]} size={[0.025, 0.9, 2.1]} color="#203f51" glass />
      {[-0.32, 0, 0.32].map((y) => (
        <Box key={y} position={[-4.52, 1.4 + y, 0]} size={[0.03, 0.055, 1.7]} color="#254954" />
      ))}
    </group>
  );
}
export function VehicleModel({ kind, color, night }: { kind: VehicleKind; color: string; night: boolean }) {
  const spec = VEHICLE_SPECS[kind],
    bike = kind === 'motorcycle';
  const wheelRadius = bike ? 0.34 : kind === 'bus' || kind === 'truck' ? 0.52 : 0.43;
  const wheelX = kind === 'bus' ? 2.95 : spec.length * 0.31;
  const lensY = bike ? 1.05 : 1.0;
  return (
    <group>
      {kind === 'bus' ? (
        <Bus color={color} />
      ) : kind === 'truck' ? (
        <>
          <Box position={[0, 0.94, 0]} size={[7.2, 0.62, 2.35]} color="#34434b" />
          <Box position={[-0.85, 2.07, 0]} size={[5.4, 2.26, 2.45]} color="#e3e5df" />
          <Box position={[2.71, 1.6, 0]} size={[1.68, 1.95, 2.25]} color={color} />
          <Box position={[3.56, 2.03, 0]} size={[0.025, 0.79, 2.04]} color="#284958" glass />
          {[-1, 1].map((side) => (
            <Box key={side} position={[2.65, 2.06, side * 1.14]} size={[1.19, 0.68, 0.025]} color="#284958" glass />
          ))}
        </>
      ) : bike ? (
        <>
          <Box position={[0, 0.68, 0]} size={[1.7, 0.3, 0.5]} color={color} />
          <Box position={[-0.15, 0.98, 0]} size={[0.7, 0.23, 0.48]} color="#21313b" />
          <mesh position={[-0.12, 1.38, 0]}>
            <capsuleGeometry args={[0.22, 0.42, 4, 8]} />
            <meshStandardMaterial color="#354a5a" />
          </mesh>
          <mesh position={[0, 1.9, 0]}>
            <sphereGeometry args={[0.24, 10, 8]} />
            <meshStandardMaterial color="#d9e1df" roughness={0.3} />
          </mesh>
        </>
      ) : (
        <>
          <Box position={[0, 0.89, 0]} size={[4.4, 0.76, 1.9]} color={color} />
          <Box position={[-0.25, 1.52, 0]} size={[2.32, 0.75, 1.65]} color={color} />
          <Box position={[0.92, 1.53, 0]} size={[0.025, 0.57, 1.48]} color="#24495d" glass />
          <Box position={[-1.42, 1.51, 0]} size={[0.025, 0.5, 1.46]} color="#24495d" glass />
          {[-1, 1].map((side) => (
            <group key={side}>
              <Box position={[-0.25, 1.53, side * 0.835]} size={[1.94, 0.5, 0.025]} color="#315b70" glass />
              <Box position={[-0.35, 1.53, side * 0.852]} size={[0.1, 0.58, 0.025]} color={color} />
            </group>
          ))}
        </>
      )}
      {[-wheelX, wheelX].flatMap((x) =>
        (bike ? [0] : [-1, 1]).map((side) => (
          <group key={`${x}-${side}`} position={[x, wheelRadius, side * (spec.width / 2 + 0.015)]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[wheelRadius, wheelRadius, bike ? 0.18 : 0.22, 16]} />
              <meshStandardMaterial color="#192229" roughness={0.85} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, side * 0.12]}>
              <cylinderGeometry args={[wheelRadius * 0.52, wheelRadius * 0.52, 0.024, 12]} />
              <meshStandardMaterial color="#a8b6bd" metalness={0.65} roughness={0.3} />
            </mesh>
          </group>
        )),
      )}
      {(bike ? [0] : [-0.32, 0.32]).map((side) => (
        <group key={side}>
          <mesh position={[spec.length / 2 + 0.025, lensY, side * spec.width]}>
            <boxGeometry args={[0.05, 0.19, bike ? 0.25 : 0.37]} />
            <meshStandardMaterial color="#fff8dd" emissive="#fff1b7" emissiveIntensity={night ? 7 : 0.65} toneMapped={!night} />
          </mesh>
          <mesh position={[-spec.length / 2 - 0.025, lensY, side * spec.width]}>
            <boxGeometry args={[0.05, 0.18, bike ? 0.18 : 0.28]} />
            <meshStandardMaterial color="#e9402c" emissive="#ff321c" emissiveIntensity={night ? 4 : 0.45} toneMapped={!night} />
          </mesh>
          {night && (
            <>
              <sprite position={[spec.length / 2 + 0.08, lensY, side * spec.width]} scale={[1.5, 1.5, 1]}>
                <spriteMaterial
                  map={glowTexture()}
                  color="#fff5c9"
                  transparent
                  opacity={0.75}
                  depthWrite={false}
                  blending={AdditiveBlending}
                  toneMapped={false}
                />
              </sprite>
              <sprite position={[-spec.length / 2 - 0.08, lensY, side * spec.width]} scale={[0.85, 0.85, 1]}>
                <spriteMaterial
                  map={glowTexture()}
                  color="#ff3927"
                  transparent
                  opacity={0.65}
                  depthWrite={false}
                  blending={AdditiveBlending}
                  toneMapped={false}
                />
              </sprite>
            </>
          )}
        </group>
      ))}
      {night && (
        <mesh position={[spec.length / 2 + 4.3, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[8.6, bike ? 2.7 : 4.8]} />
          <meshBasicMaterial map={beamTexture()} transparent opacity={0.65} depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}
export function Vehicle({ vehicle, night }: { vehicle: SimVehicle; night: boolean }) {
  const group = useRef<Group>(null);
  useFrame(() => {
    if (!group.current) return;
    group.current.visible = !vehicle.done && vehicle.progress > -12;
    group.current.position.set(vehicle.x, 0.13, vehicle.z);
    group.current.rotation.y = -vehicle.heading;
  });
  return (
    <group ref={group} visible={!vehicle.done && vehicle.progress > -12} position={[vehicle.x, 0.13, vehicle.z]} rotation={[0, -vehicle.heading, 0]}>
      <VehicleModel kind={vehicle.kind} color={vehicle.color} night={night} />
    </group>
  );
}
