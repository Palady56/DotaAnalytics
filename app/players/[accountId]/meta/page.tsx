import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlayerModes } from "@/components/PlayerModes";
import { dota } from "@/lib/sources";
import { buildMeta } from "@/lib/meta";
import { loadPassport } from "@/lib/passport";
import { formatNumber, formatPercent, gamesPhrase } from "@/lib/stats";
import {
  heroesIn,
  yourMetaBlurb,
  buildYourMeta,
  type AdviceCard,
  type PlacedHero,
  type Quadrant,
  type YourMetaReport,
} from "@/lib/your-meta";

export const dynamic = "force-dynamic";

const QUADRANT_COPY: Record<Exclude<Quadrant, "inconclusive">, { title: string; note: string }> = {
  "familiar-strong": {
    title: "Свои и сильные",
    note: "Играет часто и не хуже своего обычного винрейта. У остальных этот герой тоже выигрывает.",
  },
  signature: {
    title: "Свои",
    note: "Играет часто и не хуже обычного. У остальных герой так не выделяется.",
  },
  "meta-only": {
    title: "Пока мало игр",
    note: "У остальных герой выигрывает. У этого игрока игр мало или винрейт ниже обычного.",
  },
  skip: {
    title: "Слабее обычного",
    note: "Мало игр или винрейт ниже своего обычного.",
  },
};

function HeroLine({ hero, accountId }: { hero: PlacedHero; accountId: number }) {
  const signal =
    hero.signal === "above"
      ? "не хуже обычного"
      : hero.signal === "below"
        ? "хуже обычного"
        : hero.signal === "crosses"
          ? "как обычно"
          : hero.signal === "small"
            ? "мало игр"
            : "";
  return (
    <li>
      <Link className="hero-cell" href={`/heroes/${hero.heroId}?player=${accountId}`}>
        {hero.img ? <img src={hero.img} alt="" /> : null}
        <span>
          {hero.name} · {gamesPhrase(hero.patchGames)} · {formatPercent(hero.patchWinRate)} · {signal}
        </span>
      </Link>
    </li>
  );
}

function QuadrantCell({
  id,
  report,
  accountId,
}: {
  id: Exclude<Quadrant, "inconclusive">;
  report: YourMetaReport;
  accountId: number;
}) {
  const heroes = heroesIn(report, id);
  const copy = QUADRANT_COPY[id];
  const shown = heroes.slice(0, 8);
  return (
    <article className="quad">
      <h3>{copy.title}</h3>
      <p className="muted">{copy.note}</p>
      {shown.length === 0 ? (
        <p className="empty">Пока пусто.</p>
      ) : (
        <ul className="quad-list">
          {shown.map((hero) => (
            <HeroLine key={hero.heroId} hero={hero} accountId={accountId} />
          ))}
        </ul>
      )}
      {heroes.length > shown.length ? (
        <p className="muted">Ещё {formatNumber(heroes.length - shown.length)}.</p>
      ) : null}
    </article>
  );
}

function Advice({ card, accountId }: { card: AdviceCard; accountId: number }) {
  const kind =
    card.kind === "familiar-strong"
      ? "Свои и сильные"
      : card.kind === "signature"
        ? "Свои"
        : card.kind === "below-self"
          ? "Хуже обычного"
          : "Попробовать";
  return (
    <article className="advice">
      <p className="muted">{kind}</p>
      <p>
        <Link href={`/heroes/${card.heroId}?player=${accountId}`}>{card.name}</Link>
      </p>
      <p>{card.text}</p>
    </article>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accountId: string }>;
}): Promise<Metadata> {
  const { accountId } = await params;
  const id = Number(accountId);
  if (!Number.isSafeInteger(id) || id <= 0) return { title: "Своя мета" };
  const passport = await loadPassport(id);
  const bucket = passport.patch.bucketName ?? "патч";
  const report = await reportFor(passport.patch.bucketName ?? "патч", passport);
  const description = yourMetaBlurb(passport.profile.persona, bucket, report);
  const title = `${passport.profile.persona} — своя мета`;
  return { title, description, openGraph: { title, description } };
}

async function reportFor(bucketName: string, passport: Awaited<ReturnType<typeof loadPassport>>) {
  let meta = null;
  try {
    const catalog = await dota.getHeroCatalog();
    meta = buildMeta(catalog.data, "pub");
  } catch {
    meta = null;
  }
  return buildYourMeta({
    bucketName,
    baseline: passport.patchRecord.ok
      ? { wins: passport.patchRecord.data.wins, losses: passport.patchRecord.data.losses }
      : null,
    patchHeroes: passport.patchHeroes.ok ? passport.patchHeroes.data : [],
    lifetimeHeroes: passport.heroes.ok ? passport.heroes.data : [],
    heroesKnown: passport.patchHeroes.ok,
    lifetimeKnown: passport.heroes.ok,
    meta,
  });
}

export default async function YourMetaPage({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const id = Number(accountId);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  const passport = await loadPassport(id);
  const bucket = passport.patch.bucketName;
  let metaError: string | null = null;
  let meta = null;
  try {
    const catalog = await dota.getHeroCatalog();
    meta = buildMeta(catalog.data, "pub");
  } catch (error) {
    metaError = error instanceof Error ? error.message : "Публичная мета не прочитана.";
  }

  const report = buildYourMeta({
    bucketName: bucket ?? "патч",
    baseline: passport.patchRecord.ok
      ? { wins: passport.patchRecord.data.wins, losses: passport.patchRecord.data.losses }
      : null,
    patchHeroes: passport.patchHeroes.ok ? passport.patchHeroes.data : [],
    lifetimeHeroes: passport.heroes.ok ? passport.heroes.data : [],
    heroesKnown: passport.patchHeroes.ok,
    lifetimeKnown: passport.heroes.ok,
    meta,
  });
  const inconclusive = heroesIn(report, "inconclusive");
  const familiar = report.played.filter((hero) => hero.patchGames >= 20).length;

  return (
    <main className="sheet">
      <h1>Своя мета</h1>
      <PlayerModes accountId={id} current="meta" />
      <p className="lead">{passport.profile.persona}: герои этого патча рядом с тем, как их играют все.</p>
      <p>
        <Link href={`/players/${id}`}>Обзор</Link>
        {" · "}
        <Link href="/meta">Все герои</Link>
      </p>

      {bucket ? <p className="muted">Патч {bucket}</p> : <p className="empty">Патч не прочитан.</p>}

      {!passport.patchHeroes.ok ? <p className="empty">Герои этого патча не загрузились.</p> : null}
      {!passport.patchRecord.ok ? <p className="empty">Винрейт этого патча не загрузился.</p> : null}
      {metaError ? <p className="empty">Общий список героев не загрузился.</p> : null}

      {report.heroesKnown && passport.patchRecord.ok ? (
      <section className="board">
        <article className="stat-tile">
          <span>Винрейт патча</span>
          <strong className={(report.baselineRate ?? 0) >= 0.5 ? "win" : "loss"}>{formatPercent(report.baselineRate)}</strong>
          <span className="muted">{formatNumber(report.baselineGames)} игр</span>
        </article>
        <article className="stat-tile">
          <span>Знакомые герои</span>
          <strong>{formatNumber(familiar)}</strong>
          <span className="muted">от 20 игр</span>
        </article>
        <article className="stat-tile">
          <span>Не хуже обычного</span>
          <strong className="win">{formatNumber(report.played.filter((hero) => hero.signal === "above").length)}</strong>
        </article>
        <article className="stat-tile">
          <span>Хуже обычного</span>
          <strong className="loss">{formatNumber(report.played.filter((hero) => hero.signal === "below").length)}</strong>
        </article>
      </section>
      ) : null}

      {!report.heroesKnown ? (
        <p className="empty">Список героев не загрузился.</p>
      ) : report.metaReady ? (
        <section className="block">
          <h2>Герои</h2>
          <div className="quads">
            <QuadrantCell id="familiar-strong" report={report} accountId={id} />
            <QuadrantCell id="signature" report={report} accountId={id} />
            <QuadrantCell id="meta-only" report={report} accountId={id} />
            <QuadrantCell id="skip" report={report} accountId={id} />
          </div>
          <h3>Без вывода</h3>
          {inconclusive.length === 0 ? (
            <p className="empty">Таких героев нет.</p>
          ) : (
            <>
              <p className="muted">Винрейт как обычно, у остальных герой не выделяется.</p>
              <ul className="quad-list">
                {inconclusive.slice(0, 8).map((hero) => (
                  <HeroLine key={hero.heroId} hero={hero} accountId={id} />
                ))}
              </ul>
              {inconclusive.length > 8 ? <p className="muted">Ещё {formatNumber(inconclusive.length - 8)}.</p> : null}
            </>
          )}
        </section>
      ) : (
        <section className="block">
          <p className="empty">Общий список героев не загрузился.</p>
          {report.played.length > 0 ? (
            <ul className="quad-list">
              {report.played.slice(0, 12).map((hero) => (
                <HeroLine key={hero.heroId} hero={hero} accountId={id} />
              ))}
            </ul>
          ) : null}
        </section>
      )}

      <section className="block">
        <h2>Куда смотреть</h2>
        {!report.heroesKnown ? (
          <p className="empty">Список героев не загрузился.</p>
        ) : !report.lifetimeKnown ? (
          <p className="empty">История героев не загрузилась.</p>
        ) : report.thin ? (
          <p className="empty">Мало игр, чтобы что-то советовать.</p>
        ) : report.cards.length === 0 ? (
          <p className="empty">Пока нечего выделить.</p>
        ) : (
          <div className="advice-list">
            {report.cards.map((card) => (
              <Advice key={`${card.kind}-${card.heroId}`} card={card} accountId={id} />
            ))}
          </div>
        )}
      </section>

    </main>
  );
}
