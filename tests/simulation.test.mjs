import assert from 'node:assert/strict';
import test from 'node:test';
import {
  defaultScenario,
  scenarioTotal,
  SIGNAL_CONFIG,
  SimulationPair,
  TrafficEngine,
  validateScenario,
  vehiclesOverlap,
} from '../src/simulation/engine.ts';
import { createLayout, LANE_CENTERS, VEHICLE_SPECS } from '../src/simulation/layout.ts';

function verifyRun(scenario, mode) {
  const engine = new TrafficEngine(scenario, mode);
  const served = new Set();
  let previousPhase = engine.phase,
    previousActive = engine.active,
    phaseAge = 0;
  for (let frame = 0; frame < 30 * 600 && !engine.done; frame++) {
    const committed = engine.vehicles.map((v) => v.committed);
    const occupied = engine.vehicles.some(
      (v) => v.committed && !v.done && v.progress - VEHICLE_SPECS[v.kind].length / 2 < v.route.exit + SIGNAL_CONFIG.gap,
    );
    engine.advance(SIGNAL_CONFIG.step);
    phaseAge += SIGNAL_CONFIG.step;
    const greens = engine.layout.approaches.filter((_, source) => engine.signal(source) === 'green');
    assert.ok(greens.length <= 1, 'only one approach may have green');
    if (engine.phase !== previousPhase) {
      if (previousPhase === 'yellow') assert.ok(phaseAge >= SIGNAL_CONFIG.yellow, 'yellow clearance is respected');
      if (previousPhase === 'all-red') {
        assert.ok(phaseAge >= SIGNAL_CONFIG.allRed, 'minimum all-red clearance is respected');
        assert.equal(occupied, false, 'new approach waits for the last vehicle to leave the intersection');
      }
      if (previousPhase === 'green' && mode === 'fixed')
        assert.ok(Math.abs(phaseAge - scenario.fixedGreen) <= SIGNAL_CONFIG.step * 1.01, 'conventional green duration stays fixed');
      previousPhase = engine.phase;
      phaseAge = 0;
    }
    if (engine.active !== previousActive) {
      assert.equal(engine.phase, 'green');
      previousActive = engine.active;
    }
    for (const v of engine.vehicles) {
      if (!committed[v.id] && v.committed) {
        assert.equal(engine.signal(v.source), 'green', 'new vehicles never enter on red or yellow');
        served.add(v.source);
      }
    }
    const visible = engine.vehicles.filter((v) => !v.done);
    for (let i = 0; i < visible.length; i++)
      for (let j = i + 1; j < visible.length; j++) {
        assert.equal(vehiclesOverlap(visible[i], visible[j], 0), false, `overlap at ${engine.elapsed}: ${visible[i].id}/${visible[j].id}`);
      }
  }
  assert.equal(engine.done, true, 'all approaches drain without deadlock');
  const metrics = engine.metrics();
  assert.equal(metrics.passed, scenarioTotal(scenario));
  assert.equal(metrics.queued, 0);
  assert.equal(metrics.averageWait, metrics.totalWait / metrics.total);
  assert.equal(
    served.size,
    engine.layout.approaches.filter((a) => Object.values(scenario.counts[a.id]).some(Boolean)).length,
    'every nonempty approach is served',
  );
  return metrics;
}

for (const type of [3, 4, 5])
  for (const mode of ['adaptive', 'fixed']) {
    test(`${type}-arm ${mode}: mixed vehicles, single green, clearance, no collisions and no starvation`, () => {
      const scenario = defaultScenario(type);
      for (const a of createLayout(type).approaches) scenario.counts[a.id] = { car: 6, motorcycle: 3, bus: 3, truck: 2 };
      verifyRun(scenario, mode);
    });
  }

test('both lanes match their road markings and requested vehicle counts', () => {
  const scenario = defaultScenario(5),
    engine = new TrafficEngine(scenario, 'adaptive');
  engine.layout.approaches.forEach((a, source) => {
    const vehicles = engine.vehicles.filter((v) => v.source === source);
    assert.deepEqual([...new Set(vehicles.map((v) => v.lane))].sort(), [0, 1]);
    for (const [kind, count] of Object.entries(scenario.counts[a.id])) assert.equal(vehicles.filter((v) => v.kind === kind).length, count);
    for (const v of vehicles) assert.ok(Math.abs(-v.x * Math.sin(a.angle) + v.z * Math.cos(a.angle) - LANE_CENTERS[v.lane]) < 1e-8);
  });
});

test('empty directions are skipped by adaptive and retained by the fixed baseline', () => {
  const scenario = defaultScenario(5);
  for (const a of createLayout(5).approaches) scenario.counts[a.id] = { car: 0, motorcycle: 0, bus: 0, truck: 0 };
  scenario.counts.west = { car: 2, motorcycle: 2, bus: 1, truck: 1 };
  assert.equal(new TrafficEngine(scenario, 'adaptive').active, 4);
  assert.equal(new TrafficEngine(scenario, 'fixed').active, 0);
  const adaptive = verifyRun(scenario, 'adaptive'),
    fixed = verifyRun(scenario, 'fixed');
  assert.ok(adaptive.averageWait < fixed.averageWait);
});

test('pause, speed, fixed-step determinism, equal initial conditions and reset', () => {
  const scenario = defaultScenario(4),
    pair = new SimulationPair(scenario);
  assert.deepEqual(pair.adaptive.vehicles, pair.fixed.vehicles);
  pair.advance(5);
  assert.equal(pair.adaptive.elapsed, 0);
  pair.running = true;
  pair.speed = 4;
  pair.advance(1);
  const engine = new TrafficEngine(scenario, 'adaptive');
  for (let i = 0; i < 120; i++) engine.advance(1 / 30);
  assert.ok(Math.abs(pair.adaptive.elapsed - engine.elapsed) < 1e-7);
  assert.deepEqual(pair.adaptive.vehicles, engine.vehicles);
  pair.running = false;
  const before = pair.adaptive.metrics();
  pair.advance(10);
  assert.deepEqual(pair.adaptive.metrics(), before);
  const reset = new SimulationPair(scenario);
  assert.equal(reset.adaptive.elapsed, 0);
  assert.equal(reset.adaptive.metrics().passed, 0);
  scenario.counts.north.car = 0;
  assert.equal(reset.scenario.counts.north.car, 10, 'scenario inputs are isolated');
});

test('reject invalid inputs and preserve all 300 vehicles including offscreen queues', () => {
  const scenario = defaultScenario(5);
  for (const a of createLayout(5).approaches) scenario.counts[a.id] = { car: 30, motorcycle: 10, bus: 10, truck: 10 };
  assert.equal(validateScenario(scenario), null);
  const engine = new TrafficEngine(scenario, 'adaptive');
  assert.equal(engine.vehicles.length, 300);
  assert.ok(engine.vehicles.some((v) => v.progress < 0));
  scenario.counts.north.car++;
  assert.match(validateScenario(scenario), /300/);
  scenario.counts.north.car = -1;
  assert.match(validateScenario(scenario), /bilangan bulat/);
  scenario.counts.north.car = 1.5;
  assert.throws(() => new TrafficEngine(scenario, 'fixed'));
});
