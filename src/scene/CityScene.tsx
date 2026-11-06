import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Color, MathUtils, PerspectiveCamera as ThreePerspectiveCamera } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { defaultScenario, SimulationPair, TrafficEngine, type ControlMode } from '../simulation/engine';
import { World } from './World';
import { getTimeOfDay, timeThemes, type TimeOfDay } from './time';

function useLocalTime(override?: TimeOfDay) {
  const [date, setDate] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setDate(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const debug = import.meta.env.DEV ? new URLSearchParams(window.location.search).get('time') : null;
  const time = override ?? (debug && debug in timeThemes ? (debug as TimeOfDay) : getTimeOfDay(date));
  return { time, clock: date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) };
}

function SceneLighting({
  time,
  reducedMotion,
  compact,
  playground,
}: {
  time: TimeOfDay;
  reducedMotion: boolean;
  compact: boolean;
  playground: boolean;
}) {
  const theme = timeThemes[time];
  const { scene, camera } = useThree();
  const targetSky = useMemo(() => new Color(theme.sky), [theme.sky]);
  useFrame(({ clock }, delta) => {
    if (scene.background instanceof Color) scene.background.lerp(targetSky, Math.min(1, delta * 0.55));
    if (!playground && camera instanceof ThreePerspectiveCamera) {
      const t = reducedMotion ? 0 : clock.getElapsedTime();
      const base = compact ? { x: 70, y: 105, z: 102, target: -15, fov: 50 } : { x: 41, y: 64, z: 72, target: -17, fov: 40 };
      camera.position.set(base.x + Math.sin(t * 0.085) * 1.2, base.y + Math.cos(t * 0.065) * 0.5, base.z + Math.sin(t * 0.07) * 0.8);
      camera.lookAt(base.target, compact ? 14 : 0, 0);
      if (camera.fov !== base.fov) {
        camera.fov = base.fov;
        camera.updateProjectionMatrix();
      }
    }
  });
  return (
    <>
      <color attach="background" args={[theme.sky]} />
      <fog attach="fog" args={[theme.sky, playground || compact ? 160 : 95, 280]} />
      <hemisphereLight color={theme.ambient} groundColor={theme.ground} intensity={theme.ambientIntensity} />
      <directionalLight
        position={[-55, 66, -34]}
        color={theme.sun}
        intensity={theme.sunIntensity}
        castShadow
        shadow-mapSize={[compact ? 1024 : 2048, compact ? 1024 : 2048]}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
        shadow-normalBias={0.025}
      />
    </>
  );
}

function PlaygroundCamera({ preset, wide }: { preset: 'overview' | 'top'; wide: boolean }) {
  const { camera, gl } = useThree();
  const controls = useMemo(() => new OrbitControls(camera, gl.domElement), [camera, gl]);
  useEffect(() => {
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 55;
    controls.maxDistance = 260;
    controls.maxPolarAngle = Math.PI * 0.46;
    controls.target.set(0, 0, 0);
    return () => controls.dispose();
  }, [controls]);
  useEffect(() => {
    const scale = wide ? 1.15 : 1;
    camera.position.set(preset === 'top' ? 0 : 78 * scale, preset === 'top' ? 175 * scale : 100 * scale, preset === 'top' ? 0.1 : 92 * scale);
    controls.target.set(0, 0, 0);
    controls.update();
  }, [preset, camera, controls, wide]);
  useFrame(() => {
    controls.target.x = MathUtils.clamp(controls.target.x, -55, 55);
    controls.target.z = MathUtils.clamp(controls.target.z, -55, 55);
    controls.target.y = 0;
    controls.update();
  });
  return null;
}

function Driver({ engine, reducedMotion, onCycle }: { engine: TrafficEngine; reducedMotion: boolean; onCycle: () => void }) {
  useFrame((_, delta) => {
    if (!reducedMotion) {
      engine.advance(Math.min(delta, 0.1));
      if (engine.done) onCycle();
    }
  }, -2);
  return null;
}
function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2');
    if (!context) return false;
    context.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}
type CitySceneProps = {
  onTimeChange?: (time: TimeOfDay, clock: string) => void;
  simulation?: SimulationPair;
  view?: ControlMode;
  timeOverride?: TimeOfDay;
  cameraPreset?: 'overview' | 'top';
};
export function CityScene({ onTimeChange, simulation, view = 'adaptive', timeOverride, cameraPreset = 'overview' }: CitySceneProps) {
  const { time, clock } = useLocalTime(timeOverride);
  const [hero, setHero] = useState(() => new TrafficEngine(defaultScenario(4), 'adaptive'));
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 700px)').matches);
  const webGL = useMemo(supportsWebGL, []);
  const cycle = useCallback(() => setHero(new TrafficEngine(defaultScenario(4), 'adaptive')), []);
  const engine = simulation ? simulation[view] : hero;
  useEffect(() => onTimeChange?.(time, clock), [time, clock, onTimeChange]);
  // Keep both comparisons running even when WebGL is unavailable or the displayed mode changes.
  useEffect(() => {
    if (!simulation) return;
    let previous = performance.now(),
      frame = 0;
    const tick = (now: number) => {
      simulation.advance(Math.min((now - previous) / 1000, 0.12));
      previous = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [simulation]);
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)'),
      small = window.matchMedia('(max-width: 700px)');
    const update = () => {
      setReducedMotion(motion.matches);
      setCompact(small.matches);
    };
    motion.addEventListener('change', update);
    small.addEventListener('change', update);
    return () => {
      motion.removeEventListener('change', update);
      small.removeEventListener('change', update);
    };
  }, []);
  if (!webGL) return <div className="scene-fallback" role="img" aria-label="WebGL tidak tersedia. Informasi dan kontrol tetap dapat digunakan." />;
  return (
    <Canvas
      className="city-canvas"
      shadows
      dpr={compact ? 1 : [1, 1.5]}
      camera={{ position: [41, 64, 72], fov: simulation ? 47 : 40, near: 0.1, far: 400 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      aria-label="Simulasi persimpangan 3D dengan dua lajur kendaraan per arah"
    >
      {!simulation && <Driver engine={engine} reducedMotion={reducedMotion} onCycle={cycle} />}
      <SceneLighting time={time} reducedMotion={reducedMotion} compact={compact} playground={Boolean(simulation)} />
      {simulation && <PlaygroundCamera preset={cameraPreset} wide={engine.layout.type === 5} />}
      <World time={time} engine={engine} compact={compact} playground={Boolean(simulation)} />
    </Canvas>
  );
}
