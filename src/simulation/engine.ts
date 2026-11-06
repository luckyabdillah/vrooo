import { createLayout, createRoute, routePose, VEHICLE_SPECS, type IntersectionType, type Layout, type Route, type VehicleKind } from './layout.ts';

export type VehicleCounts = Record<VehicleKind, number>;
export type Scenario = { type: IntersectionType; counts: Record<string, VehicleCounts>; fixedGreen: number };
export type SignalPhase = 'green' | 'yellow' | 'all-red';
export type SignalColor = 'green' | 'yellow' | 'red';
export type ControlMode = 'adaptive' | 'fixed';
export const SIGNAL_CONFIG = { minGreen: 8, maxGreen: 26, yellow: 3, allRed: 2, gap: 1.8, step: 1 / 30 } as const;
export type SimVehicle = {
  id: number;
  source: number;
  lane: number;
  kind: VehicleKind;
  color: string;
  route: Route;
  progress: number;
  speed: number;
  waiting: number;
  done: boolean;
  committed: boolean;
  x: number;
  z: number;
  heading: number;
};
export type Metrics = {
  elapsed: number;
  total: number;
  passed: number;
  queued: number;
  averageWait: number;
  totalWait: number;
  done: boolean;
  active: string;
  phase: SignalPhase;
  phaseRemaining: number;
  approaches: { id: string; name: string; queued: number; remaining: number; signal: SignalColor }[];
};
const kinds: VehicleKind[] = ['car', 'motorcycle', 'bus', 'truck'];
const colors = ['#d9e2e2', '#3c5565', '#b8473b', '#e4c168', '#e7e6df', '#597587'];
export function defaultScenario(type: IntersectionType = 4): Scenario {
  const layout = createLayout(type);
  return {
    type,
    fixedGreen: 20,
    counts: Object.fromEntries(layout.approaches.map((a, i) => [a.id, { car: i === 0 ? 10 : 4, motorcycle: i === 0 ? 6 : 2, bus: 1, truck: i % 2 }])),
  };
}
export function scenarioTotal(scenario: Scenario) {
  return createLayout(scenario.type).approaches.reduce((sum, a) => sum + kinds.reduce((n, kind) => n + (scenario.counts[a.id]?.[kind] ?? 0), 0), 0);
}
export function validateScenario(scenario: Scenario): string | null {
  for (const a of createLayout(scenario.type).approaches)
    for (const kind of kinds) {
      const count = scenario.counts[a.id]?.[kind];
      if (!Number.isInteger(count) || count < 0 || count > 40) return 'Jumlah tiap jenis kendaraan harus berupa bilangan bulat antara 0–40.';
    }
  if (scenarioTotal(scenario) < 1) return 'Tambahkan setidaknya satu kendaraan sebelum menjalankan simulasi.';
  if (scenarioTotal(scenario) > 300) return 'Maksimal 300 kendaraan per skenario agar simulasi tetap lancar.';
  if (!Number.isFinite(scenario.fixedGreen) || scenario.fixedGreen < 8 || scenario.fixedGreen > 60)
    return 'Durasi hijau konvensional harus antara 8–60 detik.';
  return null;
}

// Oriented rectangle test with a small separation margin. The same guard covers turns and outgoing merges.
export function vehiclesOverlap(
  a: Pick<SimVehicle, 'x' | 'z' | 'heading' | 'kind'>,
  b: Pick<SimVehicle, 'x' | 'z' | 'heading' | 'kind'>,
  margin = 0.25,
) {
  const sa = VEHICLE_SPECS[a.kind],
    sb = VEHICLE_SPECS[b.kind];
  const dx = b.x - a.x,
    dz = b.z - a.z;
  if (Math.hypot(dx, dz) > (sa.length + sb.length) / 2 + 4) return false;
  const ax = [Math.cos(a.heading), Math.sin(a.heading)],
    az = [-ax[1], ax[0]];
  const bx = [Math.cos(b.heading), Math.sin(b.heading)],
    bz = [-bx[1], bx[0]];
  for (const axis of [ax, az, bx, bz]) {
    const projection = Math.abs(dx * axis[0] + dz * axis[1]);
    const ra =
      (sa.length / 2 + margin) * Math.abs(ax[0] * axis[0] + ax[1] * axis[1]) + (sa.width / 2 + margin) * Math.abs(az[0] * axis[0] + az[1] * axis[1]);
    const rb =
      (sb.length / 2 + margin) * Math.abs(bx[0] * axis[0] + bx[1] * axis[1]) + (sb.width / 2 + margin) * Math.abs(bz[0] * axis[0] + bz[1] * axis[1]);
    if (projection >= ra + rb) return false;
  }
  return true;
}

export class TrafficEngine {
  readonly scenario: Scenario;
  readonly mode: ControlMode;
  readonly layout: Layout;
  readonly vehicles: SimVehicle[] = [];
  elapsed = 0;
  active = 0;
  phase: SignalPhase = 'green';
  phaseElapsed = 0;
  greenDuration = 8;
  done = false;
  private accumulator = 0;

  constructor(scenario: Scenario, mode: ControlMode) {
    this.scenario = structuredClone(scenario);
    this.mode = mode;
    const error = validateScenario(scenario);
    if (error) throw new Error(error);
    this.layout = createLayout(scenario.type);
    this.layout.approaches.forEach((approach, source) => {
      const remaining = { ...scenario.counts[approach.id] };
      const sequence: VehicleKind[] = [];
      // Interleave vehicle types so both lanes receive the requested mix deterministically.
      while (kinds.some((kind) => remaining[kind] > 0))
        for (const kind of kinds)
          if (remaining[kind] > 0) {
            sequence.push(kind);
            remaining[kind]--;
          }
      const tails = [ROAD_QUEUE_START(this.layout), ROAD_QUEUE_START(this.layout)];
      const routes = [createRoute(this.layout, source, 0), createRoute(this.layout, source, 1)];
      sequence.forEach((kind, index) => {
        const lane = index % 2,
          route = routes[lane],
          spec = VEHICLE_SPECS[kind];
        const progress = tails[lane] - spec.length / 2;
        tails[lane] = progress - spec.length / 2 - SIGNAL_CONFIG.gap;
        const id = this.vehicles.length;
        this.vehicles.push({
          id,
          source,
          lane,
          kind,
          color: kind === 'bus' ? '#2689bb' : colors[id % colors.length],
          route,
          progress,
          speed: 0,
          waiting: 0,
          done: false,
          committed: false,
          ...routePose(route, progress),
        });
      });
    });
    this.active = this.mode === 'adaptive' ? this.vehicles[0].source : 0;
    this.greenDuration = this.durationFor(this.active);
  }

  signal(source: number): SignalColor {
    return source !== this.active || this.phase === 'all-red' || this.done ? 'red' : this.phase;
  }
  private demand(source: number) {
    return this.vehicles.filter((v) => !v.done && !v.committed && v.source === source);
  }
  private durationFor(source: number) {
    if (this.mode === 'fixed') return this.scenario.fixedGreen;
    const queued = this.demand(source);
    const laneLoad = [0, 0];
    for (const v of queued) laneLoad[v.lane] += VEHICLE_SPECS[v.kind].length / 6 + 1.2;
    return Math.min(SIGNAL_CONFIG.maxGreen, Math.max(SIGNAL_CONFIG.minGreen, 3 + Math.max(...laneLoad)));
  }
  private occupied() {
    return this.vehicles.some((v) => v.committed && !v.done && v.progress - VEHICLE_SPECS[v.kind].length / 2 < v.route.exit + SIGNAL_CONFIG.gap);
  }
  private nextApproach() {
    for (let step = 1; step <= this.layout.approaches.length; step++) {
      const next = (this.active + step) % this.layout.approaches.length;
      if (this.mode === 'fixed' || this.demand(next).length > 0) return next;
    }
    return this.active;
  }
  private updateSignal(dt: number) {
    this.phaseElapsed += dt;
    if (this.phase === 'green') {
      const exhausted = this.mode === 'adaptive' && this.phaseElapsed >= SIGNAL_CONFIG.minGreen && this.demand(this.active).length === 0;
      if (this.phaseElapsed >= this.greenDuration || exhausted) {
        this.phase = 'yellow';
        this.phaseElapsed = 0;
      }
    } else if (this.phase === 'yellow' && this.phaseElapsed >= SIGNAL_CONFIG.yellow) {
      this.phase = 'all-red';
      this.phaseElapsed = 0;
    } else if (this.phase === 'all-red' && this.phaseElapsed >= SIGNAL_CONFIG.allRed && !this.occupied()) {
      this.active = this.nextApproach();
      this.phase = 'green';
      this.phaseElapsed = 0;
      this.greenDuration = this.durationFor(this.active);
    }
  }
  advance(seconds: number) {
    if (this.done) return;
    this.accumulator += Math.max(0, seconds);
    while (this.accumulator >= SIGNAL_CONFIG.step && !this.done) {
      this.step(SIGNAL_CONFIG.step);
      this.accumulator -= SIGNAL_CONFIG.step;
    }
  }
  private step(dt: number) {
    this.elapsed += dt;
    this.updateSignal(dt);
    const moving = this.vehicles.filter((v) => !v.done).sort((a, b) => b.progress - a.progress);
    for (const vehicle of moving) {
      const spec = VEHICLE_SPECS[vehicle.kind];
      let next = vehicle.progress + Math.min(spec.speed, vehicle.speed + dt * 3) * dt;
      const stop = vehicle.route.entry - spec.length / 2 - 0.3;
      if (!vehicle.committed && this.signal(vehicle.source) !== 'green') next = Math.min(next, stop);
      // One leader per lane; keep the gap using actual model lengths, including long buses and trucks.
      const leader = moving.reduce<SimVehicle | undefined>(
        (nearest, v) =>
          v !== vehicle &&
          v.source === vehicle.source &&
          v.lane === vehicle.lane &&
          v.progress > vehicle.progress &&
          (!nearest || v.progress < nearest.progress)
            ? v
            : nearest,
        undefined,
      );
      if (leader) next = Math.min(next, leader.progress - (spec.length + VEHICLE_SPECS[leader.kind].length) / 2 - SIGNAL_CONFIG.gap);
      next = Math.max(vehicle.progress, next);
      const pose = routePose(vehicle.route, next);
      const candidate = { ...pose, kind: vehicle.kind };
      if (moving.some((other) => other !== vehicle && vehiclesOverlap(candidate, other))) next = vehicle.progress;
      const traveled = next - vehicle.progress;
      vehicle.speed = traveled / dt;
      if (vehicle.speed < 0.1) vehicle.waiting += dt;
      vehicle.progress = next;
      Object.assign(vehicle, routePose(vehicle.route, next));
      if (next + spec.length / 2 > vehicle.route.entry + 0.01) vehicle.committed = true;
      if (next - spec.length / 2 > vehicle.route.length) {
        vehicle.done = true;
        vehicle.speed = 0;
      }
    }
    this.done = this.vehicles.every((v) => v.done);
  }
  metrics(): Metrics {
    const totalWait = this.vehicles.reduce((sum, v) => sum + v.waiting, 0);
    return {
      elapsed: this.elapsed,
      total: this.vehicles.length,
      passed: this.vehicles.filter((v) => v.done).length,
      queued: this.vehicles.filter((v) => !v.done && v.speed < 0.1).length,
      averageWait: totalWait / this.vehicles.length,
      totalWait,
      done: this.done,
      active: this.layout.approaches[this.active].name,
      phase: this.phase,
      phaseRemaining: Math.max(
        0,
        (this.phase === 'green' ? this.greenDuration : this.phase === 'yellow' ? SIGNAL_CONFIG.yellow : SIGNAL_CONFIG.allRed) - this.phaseElapsed,
      ),
      approaches: this.layout.approaches.map((a, source) => ({
        id: a.id,
        name: a.name,
        signal: this.signal(source),
        queued: this.vehicles.filter((v) => v.source === source && !v.done && v.speed < 0.1).length,
        remaining: this.demand(source).length,
      })),
    };
  }
}
function ROAD_QUEUE_START(layout: Layout) {
  return 100 - layout.stopRadius - 0.3;
}

export class SimulationPair {
  readonly scenario: Scenario;
  adaptive: TrafficEngine;
  fixed: TrafficEngine;
  running = false;
  speed = 1;
  constructor(scenario: Scenario) {
    this.scenario = structuredClone(scenario);
    this.adaptive = new TrafficEngine(scenario, 'adaptive');
    this.fixed = new TrafficEngine(scenario, 'fixed');
  }
  advance(dt: number) {
    if (this.running) {
      this.adaptive.advance(dt * this.speed);
      this.fixed.advance(dt * this.speed);
      if (this.adaptive.done && this.fixed.done) this.running = false;
    }
  }
}
