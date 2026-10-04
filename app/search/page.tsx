import Link from "next/link";
import { findHeroes, type HeroQueryHit } from "@/lib/meta";
import { dota } from "@/lib/sources";
import { formatWhen } from "@/lib/stats";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; unverified?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";

  let hits: Awaited<ReturnType<typeof dota.searchPlayers>>["data"] = [];
  let heroes: HeroQueryHit[] = [];
  let error: string | null = null;
  let heroError: string | null = null;
  if (query) {
    const [players, catalog] = await Promise.all([
      dota.searchPlayers(query).then(
        (result) => result.data,
        (caught: unknown) => {
          error = "Поиск игроков не ответил.";
          return [];
        },
      ),
      dota.getHeroCatalog().then(
        (result) => findHeroes(result.data, query),
        (caught: unknown) => {
          heroError = "Список героев не ответил.";
          return [];
        },
      ),
    ]);
    hits = players;
    heroes = catalog;
  }

  return (
    <main className="sheet">
      <h1>Поиск</h1>
      <p className="lead">Ник или герой. Одинаковые ники — разные игроки, выберите сами.</p>
      {params.unverified ? <p className="banner">Адрес Steam не проверен. Ниже похожие ники.</p> : null}
      <form className="search" action="/lookup">
        <input name="q" defaultValue={query} aria-label="Ник или герой" />
        <button type="submit">Искать</button>
      </form>
      {heroError ? <p className="error">{heroError}</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {query && heroes.length > 0 ? (
        <section>
          <h2>Герои</h2>
          <p className="muted">Имена на английском.</p>
          <div className="results">
            {heroes.map((hero) => (
              <Link key={hero.id} className="result" href={`/heroes/${hero.id}`}>
                {hero.img ? <img src={hero.img} alt="" /> : <span className="avatar-fallback" />}
                <span>
                  <strong>{hero.name}</strong>
                </span>
                <span className="muted">герой</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      {query ? <h2>Игроки</h2> : null}
      {!error && query && hits.length === 0 ? <p className="empty">Игроков с таким ником нет.</p> : null}
      <div className="results">
        {hits.slice(0, 20).map((hit) => (
          <Link key={hit.account_id} className="result" href={`/players/${hit.account_id}`}>
            {hit.avatarfull ? <img src={hit.avatarfull} alt="" /> : <span className="avatar-fallback" />}
            <span>
              <strong>{hit.personaname || "Без ника"}</strong>
              <br />
              <span className="muted">игрок</span>
            </span>
            <span className="muted">{formatWhen(hit.last_match_time)}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
