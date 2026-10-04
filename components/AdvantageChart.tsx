export function AdvantageChart({ title, series, color }: { title: string; series: number[]; color: string }) {
  const clean = series.filter((value) => Number.isFinite(value));
  if (clean.length < 2) return null;
  const width = 640;
  const height = 132;
  const pad = 10;
  const max = Math.max(1, ...clean.map((value) => Math.abs(value)));
  const x = (index: number) => (index / (clean.length - 1)) * width;
  const y = (value: number) => height / 2 - (value / max) * (height / 2 - pad);
  const line = clean.map((value, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)},${y(value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(clean.length - 1).toFixed(1)},${(height / 2).toFixed(1)} L0,${(height / 2).toFixed(1)} Z`;
  return (
    <figure className="advantage">
      <figcaption>{title}</figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="rgba(255,255,255,0.16)" />
        <path className="area" d={area} fill={color} pathLength={1} />
        <path className="draw" d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" pathLength={1} />
      </svg>
    </figure>
  );
}
