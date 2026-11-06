# Trafflow — landing page & traffic playground

A responsive landing page for Trafflow with a procedural, animated Three.js intersection. The supplied reference image informed the camera, intersection composition, lighting, and typography; it is not displayed as the hero background.

## Run locally

```sh
npm install
npm run dev
```

Build with `npm run build`. Run the simulation regression suite with `npm test` (Node 22.18+ or 24 recommended).

The hero reads the visitor's local browser time and uses dawn, day, evening, or night lighting. During development, preview a state with `?time=dawn`, `?time=day`, `?time=evening`, or `?time=night`. The override is ignored in production.

## Playground

Open `/playground`, choose a 3-, 4-, or 5-arm junction, then set cars, motorcycles, buses and trucks for each approach. Each type accepts 0–40 vehicles per approach, with a total limit of 300. Play starts both modes from identical queues. Pause/resume, reset, 0.5–4× speed, camera controls, and day/night lighting are available. The displayed mode can change without restarting either simulation.

The conventional green duration is configurable from 8–60 seconds. Adaptive timing follows a circular order, skips empty approaches, and assigns 8–26 seconds based on vehicle lengths and lane demand. Only one approach is green at a time. Both modes use a 3-second yellow and at least 2 seconds of all-red, extended until the intersection clears.

Vehicles are assigned to the centers of both incoming lanes. Length-aware following gaps and oriented collision bounds protect both straight routes and turns. On T/five-arm junctions, vehicles take the most opposite available exit. All vehicles start queued at time zero; queues outside the camera remain simulated and counted. This is a finite educational model, without arrivals, lane changes, pedestrian phases, or calibrated real-world measurements.

### Waiting-time comparison

Each vehicle accumulates stopped time when its speed is below 0.1 simulation units per second. Average waiting time is the total stopped time divided by all requested vehicles. The percentage is `(fixed average − adaptive average) / fixed average × 100`. Live values are provisional; final results appear only when both simulations finish. Adaptive can perform worse on some scenarios, and the UI reports that outcome.

### Code map

- `src/simulation/layout.ts`: junction geometry, lane centers, vehicle dimensions, sampled routes.
- `src/simulation/engine.ts`: deterministic 30 Hz movement, signal phases, following gaps, collision checks, metrics.
- `src/scene/`: shared procedural 3D scene, vehicle models, illuminated streetlights and headlights.
- `src/playground/`: selection, configuration, playback and comparison UI.
- `tests/simulation.test.mjs`: signal exclusivity, clearance, red-light entry, lane assignment, collision/deadlock checks, metric accounting and playback tests.

The landing hero follows the visitor's local time. Playground lighting is manually selectable. The comparison engine runs independently of WebGL, so results remain available if 3D rendering is unavailable. The mobile hero uses a wider view shifted toward the west approach.

## Hosting

Deploy `dist/` after building. Configure the host to serve `index.html` for `/playground` (SPA fallback); Vite development and preview servers already support this route.
