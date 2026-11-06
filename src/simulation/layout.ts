export type IntersectionType = 3 | 4 | 5;
export type VehicleKind = 'car' | 'motorcycle' | 'bus' | 'truck';
export type Point = { x: number; z: number };
export type Approach = { id: string; name: string; angle: number };
export type Layout = { type: IntersectionType; approaches: Approach[]; stopRadius: number };
export const ROAD_HALF_WIDTH = 13.5;
export const LANE_CENTERS = [3.375, 10.125] as const;
export const ROAD_END = 100;
export const VEHICLE_SPECS: Record<VehicleKind, { length: number; width: number; speed: number; label: string }> = {
  car: { length: 4.4, width: 1.9, speed: 7, label: 'Mobil' },
  motorcycle: { length: 2.2, width: 0.8, speed: 7, label: 'Motor' },
  bus: { length: 9, width: 2.5, speed: 6, label: 'Bus' },
  truck: { length: 7.2, width: 2.45, speed: 6, label: 'Truk' },
};
const cardinal: Approach[] = [
  { id: 'north', name: 'Utara', angle: -Math.PI / 2 },
  { id: 'east', name: 'Timur', angle: 0 },
  { id: 'south', name: 'Selatan', angle: Math.PI / 2 },
  { id: 'west', name: 'Barat', angle: Math.PI },
];
export function createLayout(type: IntersectionType): Layout {
  return {
    type,
    approaches:
      type === 3
        ? cardinal.filter((a) => a.id !== 'north')
        : type === 5
          ? [cardinal[0], { id: 'northeast', name: 'Timur laut', angle: -Math.PI / 4 }, ...cardinal.slice(1)]
          : [...cardinal],
    stopRadius: type === 5 ? 40 : 25,
  };
}
export function roadPoint(angle: number, radius: number, offset: number): Point {
  return { x: Math.cos(angle) * radius - Math.sin(angle) * offset, z: Math.sin(angle) * radius + Math.cos(angle) * offset };
}
export type Route = {
  points: Point[];
  distances: number[];
  entry: number;
  exit: number;
  length: number;
  sourceAngle: number;
  destination: number;
  lane: number;
};
export function createRoute(layout: Layout, source: number, lane: number): Route {
  const approach = layout.approaches[source];
  // The most opposite available arm: straight where possible, a smooth turn for T/five-arm junctions.
  let destination = (source + 1) % layout.approaches.length;
  layout.approaches.forEach((candidate, i) => {
    if (i !== source && Math.cos(candidate.angle - approach.angle) < Math.cos(layout.approaches[destination].angle - approach.angle) - 0.001)
      destination = i;
  });
  const out = layout.approaches[destination];
  const offset = LANE_CENTERS[lane];
  const p0 = roadPoint(approach.angle, layout.stopRadius, offset);
  const p3 = roadPoint(out.angle, layout.stopRadius, -offset);
  const reach = layout.stopRadius * 0.85;
  const p1 = { x: p0.x - Math.cos(approach.angle) * reach, z: p0.z - Math.sin(approach.angle) * reach };
  const p2 = { x: p3.x - Math.cos(out.angle) * reach, z: p3.z - Math.sin(out.angle) * reach };
  const points: Point[] = [roadPoint(approach.angle, ROAD_END, offset), p0];
  const distances = [0, ROAD_END - layout.stopRadius];
  for (let i = 1; i <= 64; i++) {
    const t = i / 64,
      s = 1 - t;
    const point = {
      x: s ** 3 * p0.x + 3 * s * s * t * p1.x + 3 * s * t * t * p2.x + t ** 3 * p3.x,
      z: s ** 3 * p0.z + 3 * s * s * t * p1.z + 3 * s * t * t * p2.z + t ** 3 * p3.z,
    };
    const prev = points[points.length - 1];
    distances.push(distances[distances.length - 1] + Math.hypot(point.x - prev.x, point.z - prev.z));
    points.push(point);
  }
  const exit = distances[distances.length - 1];
  points.push(roadPoint(out.angle, ROAD_END, -offset));
  distances.push(exit + ROAD_END - layout.stopRadius);
  return {
    points,
    distances,
    entry: ROAD_END - layout.stopRadius,
    exit,
    length: distances[distances.length - 1],
    sourceAngle: approach.angle,
    destination,
    lane,
  };
}
export function routePose(route: Route, progress: number) {
  let segment = 0;
  while (segment < route.distances.length - 2 && route.distances[segment + 1] < progress) segment++;
  const a = route.points[segment],
    b = route.points[segment + 1];
  const length = route.distances[segment + 1] - route.distances[segment];
  const t = (progress - route.distances[segment]) / length;
  return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, heading: Math.atan2(b.z - a.z, b.x - a.x) };
}
