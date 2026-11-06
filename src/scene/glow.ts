import { CanvasTexture } from 'three';
let glow: CanvasTexture | undefined;
let beam: CanvasTexture | undefined;
export function glowTexture() {
  if (glow) return glow;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d')!;
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.16, 'rgba(255,255,255,.85)');
  gradient.addColorStop(0.45, 'rgba(255,255,255,.22)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  glow = new CanvasTexture(canvas);
  return glow;
}
export function beamTexture() {
  if (beam) return beam;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const context = canvas.getContext('2d')!;
  const gradient = context.createLinearGradient(0, 0, 128, 0);
  gradient.addColorStop(0, 'rgba(255,249,215,.7)');
  gradient.addColorStop(0.3, 'rgba(255,249,215,.3)');
  gradient.addColorStop(1, 'rgba(255,249,215,0)');
  context.fillStyle = gradient;
  context.beginPath();
  context.moveTo(0, 24);
  context.lineTo(128, 0);
  context.lineTo(128, 64);
  context.lineTo(0, 40);
  context.closePath();
  context.fill();
  beam = new CanvasTexture(canvas);
  return beam;
}
