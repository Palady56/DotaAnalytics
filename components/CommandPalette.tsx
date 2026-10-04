"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingMark } from "@/components/LoadingStage";
import { readRecent, type RecentPlayer } from "@/components/RememberRecent";

type HeroHit = { id: number; name: string; img: string | null };
type PlayerHit = { id: number; name: string; avatar: string | null; lastMatch: string | null };

type Row =
  | { kind: "hero"; id: number; name: string; img: string | null }
  | { kind: "player"; id: number; name: string; img: string | null; lastMatch: string | null }
  | { kind: "go"; href: string; name: string; icon: string };

export function CommandPalette({
  open,
  onClose,
  profileHref,
}: {
  open: boolean;
  onClose: () => void;
  profileHref: string;
}) {
  const router = useRouter();
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [heroes, setHeroes] = useState<HeroHit[]>([]);
  const [players, setPlayers] = useState<PlayerHit[]>([]);
  const [heroError, setHeroError] = useState<string | null>(null);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [settled, setSettled] = useState(false);
  const [recent, setRecent] = useState<RecentPlayer[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setHeroes([]);
    setPlayers([]);
    setHeroError(null);
    setPlayerError(null);
    setRecent(readRecent());
    setIndex(0);
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const needle = query.trim();
    if (needle.length < 2) {
      setHeroes([]);
      setPlayers([]);
      setHeroError(null);
      setPlayerError(null);
      setLoading(false);
      setSettled(false);
      return;
    }
    setLoading(true);
    setSettled(false);
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetch(`/api/palette?q=${encodeURIComponent(needle)}`, { signal: controller.signal })
        .then((response) => response.json())
        .then((body: { heroes: HeroHit[]; players: PlayerHit[]; heroError: string | null; playerError: string | null }) => {
          setHeroes(body.heroes ?? []);
          setPlayers(body.players ?? []);
          setHeroError(body.heroError);
          setPlayerError(body.playerError);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setPlayerError("Поиск не ответил.");
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setLoading(false);
            setSettled(true);
          }
        });
    }, 180);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [open, query]);

  const rows = useMemo<Row[]>(() => {
    const needle = query.trim();
    if (needle.length < 2) {
      return [
        ...recent.map((player) => ({ kind: "player" as const, id: player.id, name: player.name, img: player.avatar, lastMatch: null })),
        { kind: "go", href: "/meta", name: "Герои", icon: "M3 2.5h10v11H3v-11ZM6 6h4M6 9h4" },
        { kind: "go", href: "/duo", name: "Дуэт", icon: "M4.5 6.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM11.5 6.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM2 13.5c.4-2 1.6-3 2.5-3s2.1 1 2.5 3M9 13.5c.4-2 1.6-3 2.5-3s2.1 1 2.5 3" },
        { kind: "go", href: "/compare", name: "Сравнение", icon: "M2 12.5 6 7l3 3 5-6" },
        { kind: "go", href: profileHref, name: "Профиль", icon: "M8 8.2a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8ZM3.2 13.5c.7-2.2 2.4-3.2 4.8-3.2s4.1 1 4.8 3.2" },
      ];
    }
    return [
      ...heroes.map((hero) => ({ kind: "hero" as const, id: hero.id, name: hero.name, img: hero.img })),
      ...players.map((player) => ({
        kind: "player" as const,
        id: player.id,
        name: player.name,
        img: player.avatar,
        lastMatch: player.lastMatch,
      })),
    ];
  }, [heroes, players, profileHref, query, recent]);

  useEffect(() => {
    setIndex(0);
  }, [query, rows.length]);

  const selected = rows[index] ?? null;

  function go(href: string) {
    onClose();
    router.push(href);
  }

  function run(row: Row | null) {
    if (!row) {
      const needle = query.trim();
      if (needle) go(`/lookup?q=${encodeURIComponent(needle)}`);
      return;
    }
    if (row.kind === "go") go(row.href);
    if (row.kind === "hero") go(`/heroes/${row.id}`);
    if (row.kind === "player") go(`/players/${row.id}`);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIndex((value) => Math.min(rows.length - 1, value + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setIndex((value) => Math.max(0, value - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      run(selected);
    }
  }

  async function copyLink(id: number) {
    const href = `${window.location.origin}/players/${id}`;
    try {
      await navigator.clipboard.writeText(href);
    } catch {
      return;
    }
  }

  if (!open) return null;

  const needle = query.trim();

  return (
    <div className="palette-scrim" onMouseDown={onClose}>
      <div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <h2 id={titleId} className="palette-group">
          Поиск
        </h2>
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="SteamID, ник, герой или матч"
          aria-label="Найти игрока, героя или матч"
          aria-controls="palette-results"
          aria-activedescendant={selected ? `palette-row-${index}` : undefined}
        />
        <div className="palette-list" id="palette-results" role="listbox" aria-label="Результаты">
          {needle.length < 2 ? (
            <>
              {recent.length > 0 ? <p className="palette-group">Недавние</p> : null}
              {rows.map((row, rowIndex) =>
                row.kind === "player" ? (
                  <PaletteRow key={`recent-${row.id}`} row={row} selected={rowIndex === index} id={`palette-row-${rowIndex}`} onPick={() => run(row)} />
                ) : null,
              )}
              <p className="palette-group">Разделы</p>
              {rows.map((row, rowIndex) =>
                row.kind === "go" ? (
                  <PaletteRow key={row.href} row={row} selected={rowIndex === index} id={`palette-row-${rowIndex}`} onPick={() => run(row)} />
                ) : null,
              )}
            </>
          ) : (
            <>
              <p className="palette-group">Герои</p>
              {heroError ? <p className="error">{heroError}</p> : null}
              {!heroError && heroes.length === 0 && settled ? <p className="empty">Героев нет.</p> : null}
              {rows.map((row, rowIndex) =>
                row.kind === "hero" ? (
                  <PaletteRow key={`h-${row.id}`} row={row} selected={rowIndex === index} id={`palette-row-${rowIndex}`} onPick={() => run(row)} />
                ) : null,
              )}
              <p className="palette-group">Игроки</p>
              {playerError ? <p className="error">{playerError}</p> : null}
              {!playerError && players.length === 0 && settled ? <p className="empty">Игроков нет. Enter откроет разбор запроса.</p> : null}
              {rows.map((row, rowIndex) =>
                row.kind === "player" ? (
                  <PaletteRow key={`p-${row.id}`} row={row} selected={rowIndex === index} id={`palette-row-${rowIndex}`} onPick={() => run(row)} />
                ) : null,
              )}
              {loading ? (
                <p className="muted loading-inline">
                  <LoadingMark tiny />
                  Загрузка
                </p>
              ) : null}
            </>
          )}
        </div>
        {selected?.kind === "player" ? (
          <div className="palette-actions">
            <button type="button" onClick={() => go(`/players/${selected.id}`)}>
              Открыть профиль
            </button>
            <button type="button" onClick={() => go(`/players/${selected.id}/matches`)}>
              Матчи
            </button>
            <button type="button" onClick={() => go(`/players/${selected.id}#heroes`)}>
              Герои
            </button>
            <button type="button" onClick={() => go(`/duo?a=${selected.id}`)}>
              В дуэт
            </button>
            <button type="button" onClick={() => go(`/compare?a=${selected.id}`)}>
              Сравнить
            </button>
            <button type="button" onClick={() => copyLink(selected.id)}>
              Копировать ссылку
            </button>
          </div>
        ) : null}
        {selected?.kind === "hero" ? (
          <div className="palette-actions">
            <button type="button" onClick={() => go(`/heroes/${selected.id}`)}>
              Открыть героя
            </button>
            <button type="button" onClick={() => go("/meta")}>
              Все герои
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PaletteRow({
  row,
  selected,
  id,
  onPick,
}: {
  row: Row;
  selected: boolean;
  id: string;
  onPick: () => void;
}) {
  const img = row.kind === "go" ? null : row.img;
  const meta = row.kind === "player" ? "игрок" : row.kind === "hero" ? "герой" : "";
  return (
    <button type="button" className="palette-row" role="option" id={id} aria-selected={selected} onClick={onPick}>
      {img ? (
        <img src={img} alt="" />
      ) : row.kind === "go" ? (
        <span className="palette-fallback">
          <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d={row.icon} />
          </svg>
        </span>
      ) : (
        <span className="palette-fallback" />
      )}
      <span>{row.name}</span>
      <span className="muted">{meta}</span>
    </button>
  );
}
