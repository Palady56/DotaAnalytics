export function Sparkline({ points }: { points: number[] | null }) {
  if (!points || points.length < 2) return <span className="muted">—</span>;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const width = 72;
  const height = 22;
  const path = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = max === min ? height / 2 : height - ((point - min) / (max - min)) * (height - 2) - 1;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg className="spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path className="draw" pathLength={1} d={path} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
