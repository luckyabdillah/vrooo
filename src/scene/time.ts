export type TimeOfDay = 'dawn' | 'day' | 'evening' | 'night';

export function getTimeOfDay(date = new Date()): TimeOfDay {
  const hour = date.getHours();
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 17) return 'day';
  if (hour >= 17 && hour < 19) return 'evening';
  return 'night';
}

export const timeThemes = {
  dawn: {
    sky: '#aab8c6',
    ground: '#a4aaa5',
    ambient: '#c8d5e1',
    sun: '#ffd6a5',
    sunIntensity: 2.3,
    ambientIntensity: 1.4,
    window: '#8cb1c5',
    litWindow: '#fff0c2',
    street: '#fff1bc',
  },
  day: {
    sky: '#a6c2d5',
    ground: '#a8afa7',
    ambient: '#e9f2f6',
    sun: '#fff0d0',
    sunIntensity: 2.8,
    ambientIntensity: 1.65,
    window: '#84acbd',
    litWindow: '#bdd6df',
    street: '#fff3c5',
  },
  evening: {
    sky: '#d7c4a5',
    ground: '#b9aa91',
    ambient: '#ffe7ca',
    sun: '#ffd39a',
    sunIntensity: 4.1,
    ambientIntensity: 1.7,
    window: '#97bac6',
    litWindow: '#ffe7aa',
    street: '#fff0b6',
  },
  night: {
    sky: '#26374f',
    ground: '#586574',
    ambient: '#7189ae',
    sun: '#9bbbea',
    sunIntensity: 0.6,
    ambientIntensity: 0.85,
    window: '#4e6b80',
    litWindow: '#f6dca5',
    street: '#ffd997',
  },
} satisfies Record<
  TimeOfDay,
  {
    sky: string;
    ground: string;
    ambient: string;
    sun: string;
    sunIntensity: number;
    ambientIntensity: number;
    window: string;
    litWindow: string;
    street: string;
  }
>;
