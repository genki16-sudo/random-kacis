/** y konumunu [yTop,yBottom] bandında [minScale,maxScale] ölçeğe eşler (clamp'li). */
export function depthScale(
  y: number,
  yTop: number,
  yBottom: number,
  minScale: number,
  maxScale: number,
): number {
  if (yBottom === yTop) return maxScale;
  const t = Math.max(0, Math.min(1, (y - yTop) / (yBottom - yTop)));
  return minScale + t * (maxScale - minScale);
}
