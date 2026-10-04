import Link from "next/link";
import { SliceLinks } from "@/components/SliceLinks";
import {
  META_MIN_SAMPLE,
  SLICES,
  buildMeta,
  heroHref,
  metaHref,
  parseSlice,
  parseView,
  playPosition,
  presentMeta,
} from "@/lib/meta";
import { dota } from "@/lib/sources";
import { formatNumber, formatPercent } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function MetaPage({
  searchParams,
}: {
  searchParams: Promise<{ slice?: string; view?: string }>;
}) {
  const params = await searchParams;
  const slice = parseSlice(params.slice);
  const view = parseView(params.view);
  const catalogR = await dota.getHeroCatalog().catch((error: unknown) => {
    throw error instanceof Error ? error : new Error("Список героев недоступен");
  });

  const built = buildMeta(catalogR.data, slice);
  const rows = presentMeta(built, view);
  const totalPicks = built.reduce((sum, row) => sum + row.picks, 0);
  const sliceName = slice === "pub" ? "Публичные игры" : (SLICES.find((item) => item.id === slice)?.label ?? "Герои");
  const thin = view === "winning" && totalPicks > 0 && built.every((row) => row.picks < META_MIN_SAMPLE);

  return (
    <main className="sheet">
      <h1>Герои</h1>
      <p className="lead">{sliceName}</p>
      <SliceLinks current={slice} hrefFor={(item) => metaHref(item, view)} />
      <nav className="modes" aria-label="Порядок">
        <Link className="mode" href={metaHref(slice, "winning")} aria-current={view === "winning" ? "page" : undefined}>
          Топ
        </Link>
        <Link className="mode" href={metaHref(slice, "popular")} aria-current={view === "popular" ? "page" : undefined}>
          Частые
        </Link>
        <Link className="mode" href={metaHref(slice, "all")} aria-current={view === "all" ? "page" : undefined}>
          Все
        </Link>
      </nav>
      {catalogR.stale ? <p className="muted">Показаны сохранённые цифры.</p> : null}
      {thin ? <p className="muted">Мало игр для топа.</p> : null}

      {totalPicks === 0 ? (
        <p className="empty">В этом списке пусто.</p>
      ) : (
        <div>
          {rows.map((row, index) => {
            const rate = row.winRate ?? 0;
            const enough = row.picks >= META_MIN_SAMPLE;
            const position = playPosition(row.roles);
            return (
              <Link key={row.id} className="hero-line" href={heroHref(row.id, slice)}>
                <span className="hero-index">{index + 1}</span>
                {row.img ? <img src={row.img} alt="" /> : <span className="portrait-fallback" />}
                <span>
                  <b>{row.name}</b>
                  {position ? <span className="muted">{position}</span> : null}
                  {slice === "pro" && row.bans ? <span className="muted"> · баны {formatNumber(row.bans)}</span> : null}
                </span>
                <span className={enough ? (rate >= 0.5 ? "rate win" : "rate loss") : "rate"}>
                  {formatPercent(row.winRate)}
                </span>
                <span className="mini">
                  <i className={rate >= 0.5 ? "win" : "loss"} style={{ width: `${Math.round(rate * 100)}%` }} />
                </span>
                <span className="pick-count">
                  <b>{formatNumber(row.picks)}</b>
                  <span>пиков</span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
