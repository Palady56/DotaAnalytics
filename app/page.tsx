import Link from "next/link";
import { Logo } from "@/components/Logo";
import { buildMeta, playPosition, presentMeta } from "@/lib/meta";
import { dota } from "@/lib/sources";
import { formatPercent } from "@/lib/stats";

const ERRORS: Record<string, string> = {
  friend_code: "Friend Code не открывает профиль. Вставьте ссылку steamcommunity.com или ник.",
  invalid: "Не разобрали запрос. Нужны ник, ссылка Steam или номер профиля.",
  vanity_missing: "Такой адрес Steam не найден.",
  vanity_failed: "Steam не ответил.",
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const [patches, catalog] = await Promise.all([
    dota.getPatches().catch(() => null),
    dota.getHeroCatalog().catch(() => null),
  ]);
  const bucket = patches ? [...patches.data].sort((a, b) => a.id - b.id).at(-1) : undefined;
  const leaders = catalog ? presentMeta(buildMeta(catalog.data, "pub"), "winning").slice(0, 8) : [];

  return (
    <main className="sheet">
      <section className="home-hero">
        <Logo size={56} />
        <div>
          <h1>Dota Analytics</h1>
          <p className="lead">Ник, ссылка Steam или герой. Дальше — матчи, герои и дуэт.</p>
        </div>
        <form className="search" action="/lookup" method="get">
          <input name="q" placeholder="Ник, ссылка или герой" aria-label="Найти игрока или героя" required />
          <button type="submit">Открыть</button>
        </form>
        {params.error ? <p className="error">{ERRORS[params.error] ?? "Запрос не выполнен."}</p> : null}
        {bucket ? <p className="muted">Патч {bucket.name}</p> : null}
      </section>

      <div className="home-cards">
        <Link className="home-card" href="/meta">
          <b>Герои</b>
          <span>Кто сейчас выигрывает чаще</span>
        </Link>
        <Link className="home-card" href="/duo">
          <b>Дуэт</b>
          <span>Вместе и друг против друга</span>
        </Link>
        <Link className="home-card" href="/compare">
          <b>Сравнение</b>
          <span>Два профиля рядом, без общих матчей</span>
        </Link>
      </div>

      {leaders.length > 0 ? (
        <section>
          <div className="section-head">
            <h2>Топ сейчас</h2>
            <Link href="/meta">Все герои</Link>
          </div>
          <div className="hero-board">
            {leaders.map((hero, index) => (
              <Link key={hero.id} className="hero-tile" href={`/heroes/${hero.id}`}>
                {hero.img ? <img src={hero.img} alt="" /> : <span className="portrait-fallback" />}
                <b>
                  {index + 1}. {hero.name}
                </b>
                <span className={(hero.winRate ?? 0) >= 0.5 ? "rate win" : "rate loss"}>{formatPercent(hero.winRate)}</span>
                {playPosition(hero.roles) ? <span className="muted">{playPosition(hero.roles)}</span> : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
