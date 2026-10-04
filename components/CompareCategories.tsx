import Link from "next/link";
import {
  heroCountText,
  type CompareView,
} from "@/lib/compare-categories";
import { duoPath } from "@/lib/duo";
import { formatNumber } from "@/lib/stats";

export type BattleFace = {
  winRate: string;
  kda: string;
  games: string;
  lane: string;
};

export function CompareCategories({
  view,
  leftId,
  rightId,
  leftName,
  rightName,
  poolA,
  poolB,
  leftFace,
  rightFace,
}: {
  view: CompareView;
  leftId: number;
  rightId: number;
  leftName: string;
  rightName: string;
  leftRank: number | null;
  rightRank: number | null;
  leftPlace: number | null;
  rightPlace: number | null;
  poolA: number | null;
  poolB: number | null;
  gamesA: number | null;
  gamesB: number | null;
  leftFace: BattleFace;
  rightFace: BattleFace;
}) {
  const heading = verdictHeading(view.report.verdictText);

  return (
    <section className="block">
      <div className="section-head">
        <h2>{heading}</h2>
        <span className="muted">без Turbo</span>
      </div>
      <p className="mode-note">
        Цифры ниже — по уже сыгранным матчам, без Turbo. «Близко» значит, что разница маленькая. «Мало игр» — выборка слишком короткая, чтобы сказать, кто выше. Это не шанс победы в следующей игре.
      </p>
      <div className="evo-split">
        <FaceTile name={leftName} face={leftFace} pool={poolA} />
        <FaceTile name={rightName} face={rightFace} pool={poolB} />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th />
              <th>{leftName}</th>
              <th>{rightName}</th>
            </tr>
          </thead>
          <tbody>
            {view.categories.map((category) => (
              <tr key={category.id}>
                <td>
                  {categoryTitle(category.name)}
                  {rowHint(category.status, leftName, rightName) ? <span className="muted"> · {rowHint(category.status, leftName, rightName)}</span> : null}
                </td>
                <td>
                  <b>{category.a.primary}</b>
                  {sideNote(category.a.detail) ? <span className="muted"> {sideNote(category.a.detail)}</span> : null}
                </td>
                <td>
                  <b>{category.b.primary}</b>
                  {sideNote(category.b.detail) ? <span className="muted"> {sideNote(category.b.detail)}</span> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {view.heroes.length > 0 ? (
        <>
          <h3>Одни и те же герои</h3>
          <div className="match-feed">
            {view.heroes.map((hero) => {
              const who = heroWho(hero.status, leftName, rightName);
              return (
                <Link className="cmp-hero" key={hero.heroId} href={`/heroes/${hero.heroId}`}>
                  {hero.img ? <img src={hero.img} alt="" /> : <span className="portrait-fallback" />}
                  <span>
                    <b>{hero.name}</b>
                    {who ? <span className="muted">выше у {who}</span> : <span className="muted">близко</span>}
                  </span>
                  <span className={rateClass(hero.aRate)}>{heroCountText(hero.aGames, hero.aRate)}</span>
                  <span className={rateClass(hero.bRate)}>{heroCountText(hero.bGames, hero.bRate)}</span>
                </Link>
              );
            })}
          </div>
        </>
      ) : null}

      <p>
        <Link href={duoPath(leftId, rightId)}>Их общие матчи</Link>
      </p>
    </section>
  );
}

function FaceTile({ name, face, pool }: { name: string; face: BattleFace; pool: number | null }) {
  const wr = face.winRate === "нет данных" ? null : Number(face.winRate.replace("%", "").replace(",", "."));
  const wrClass = wr === null || Number.isNaN(wr) ? undefined : wr >= 50 ? "win" : "loss";
  const kda = face.kda.split(" · ")[0];
  return (
    <article className="stat-tile">
      <span dir="auto">{name}</span>
      <strong className={wrClass}>{face.winRate}</strong>
      <em>
        {face.games}
        {pool !== null ? ` · пул ${formatNumber(pool)}` : ""}
      </em>
      <em>KDA {kda}</em>
      <em>{face.lane === "линия не названа" ? "нет основной линии" : face.lane}</em>
    </article>
  );
}

function verdictHeading(text: string): string {
  if (text === "Недостаточно категорий") return "Пока мало матчей, чтобы сказать, кто выше";
  if (text === "Слишком близко") return "Почти вровень";
  return text.replace(" по категориям", "");
}

function categoryTitle(name: string): string {
  if (name === "Винрейт среза") return "Винрейт";
  if (name.startsWith("Винрейт последних")) return "Последние 20";
  if (name.startsWith("Винрейт патча ")) return name.replace("Винрейт патча ", "Патч ");
  return name;
}

function rowHint(status: string, leftName: string, rightName: string): string | null {
  if (status.includes("Слишком близко")) return "близко";
  if (status.includes("Мало матчей")) return "мало игр";
  if (status.includes("атч не один")) return "разные патчи";
  if (status.startsWith(leftName) && (status.includes("впереди") || status.includes("выше"))) return `выше у ${leftName}`;
  if (status.startsWith(rightName) && (status.includes("впереди") || status.includes("выше"))) return `выше у ${rightName}`;
  return null;
}

function sideNote(detail: string): string | null {
  if (!detail || detail === "KDA" || detail === "GPM" || detail === "XPM") return null;
  const few = detail.includes("мало матчей") ? " · мало игр" : "";
  const counted = detail.match(/n=([0-9\s\u00a0]+)/);
  if (counted) return `${counted[1].trim()} игр${few}`;
  const known = detail.match(/известно в ([0-9\s\u00a0]+) из ([0-9\s\u00a0]+)/);
  if (known && known[1].trim() === known[2].trim() && !few) return null;
  if (known) return `${known[1].trim()} из ${known[2].trim()}${few}`;
  return null;
}

function heroWho(status: string, leftName: string, rightName: string): string | null {
  if (status.startsWith(leftName)) return leftName;
  if (status.startsWith(rightName)) return rightName;
  return null;
}

function rateClass(rate: number | null): string {
  if (rate === null) return "muted";
  return rate >= 0.5 ? "rate win" : "rate loss";
}
