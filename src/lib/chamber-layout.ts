/** World-space slots. The active athlete is central; neighbors recede into the room. */
export function chamberSlot(index: number, selected: number) {
  const offset = index - selected;
  return {
    x: offset * 4.8,
    y: 0,
    z: -Math.min(Math.abs(offset), 4) * 2.7,
  };
}

export const CHAMBER_MOTION = {
  entrance: 1.1,
  selection: 0.75,
  profile: 220,
} as const;

export function chamberEase(progress: number) {
  const t = Math.max(0, Math.min(1, progress));
  return 1 - Math.pow(1 - t, 3);
}
