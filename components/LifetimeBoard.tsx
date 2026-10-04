import type { CountRow } from "@/lib/passport";
import { formatNumber, formatPercent } from "@/lib/stats";

function Group({ title, rows }: { title: string; rows: CountRow[] }) {
  const shown = rows.filter((row) => row.games > 0).slice(0, 6);
  if (shown.length === 0) return null;
  const max = Math.max(...shown.map((row) => row.games), 1);
  return (
    <section className="life-group">
      <h3>{title}</h3>
      <div className="life-head">
        <span />
        <span>Матчи</span>
        <span>Винрейт</span>
      </div>
      {shown.map((row) => {
        const losses = Math.max(row.games - row.wins, 0);
        return (
          <div className="life-row" key={`${title}-${row.id}`}>
            <span>{row.label}</span>
            <span className="life-count">
              <b>{formatNumber(row.games)}</b>
              <span className="life-bar" aria-hidden="true">
                <i className="win" style={{ width: `${(row.wins / max) * 100}%` }} />
                <i className="loss" style={{ width: `${(losses / max) * 100}%` }} />
              </span>
            </span>
            <span className={(row.winRate ?? 0) >= 0.5 ? "win" : "loss"}>{formatPercent(row.winRate)}</span>
          </div>
        );
      })}
    </section>
  );
}

export function LifetimeBoard({
  lobbies,
  modes,
  factions,
  regions,
}: {
  lobbies: CountRow[];
  modes: CountRow[];
  factions: CountRow[];
  regions: CountRow[];
}) {
  return (
    <div className="life-board">
      <Group title="Лобби" rows={lobbies} />
      <Group title="Режим" rows={modes} />
      <Group title="Сторона" rows={factions} />
      <Group title="Регион" rows={regions} />
    </div>
  );
}
