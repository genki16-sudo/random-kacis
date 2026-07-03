export interface Pt {
  x: number;
  y: number;
}

/** Konum izine yeni nokta ekler; en fazla maxLen nokta tutar (en yenisi sonda). */
export function pushTrail(trail: Pt[], pos: Pt, maxLen: number): Pt[] {
  const next = [...trail, { x: pos.x, y: pos.y }];
  if (next.length > maxLen) next.splice(0, next.length - maxLen);
  return next;
}

/**
 * n takipçinin iz üzerindeki hedef konumları.
 * trail[trail.length-1] lider (en güncel). Her takipçi (i=1..count) lideri
 * i*gap nokta geriden izler; iz kısaysa en eski noktaya sabitlenir.
 */
export function followerPositions(trail: Pt[], count: number, gap: number): Pt[] {
  const res: Pt[] = [];
  if (trail.length === 0) {
    for (let i = 0; i < count; i++) res.push({ x: 0, y: 0 });
    return res;
  }
  for (let i = 1; i <= count; i++) {
    const idx = trail.length - 1 - i * gap;
    const p = idx >= 0 ? trail[idx] : trail[0];
    res.push({ x: p.x, y: p.y });
  }
  return res;
}
