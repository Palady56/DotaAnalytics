"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readRecent, type RecentPlayer } from "@/components/RememberRecent";

export default function MatchesIndexPage() {
  const [recent, setRecent] = useState<RecentPlayer[]>([]);

  useEffect(() => {
    setRecent(readRecent());
  }, []);

  return (
    <main className="sheet">
      <h1>Матчи</h1>
      <p className="lead">Выберите игрока. Это не поиск по сайту.</p>
      {recent.length === 0 ? (
        <p className="empty">
          Сначала откройте игрока на <Link href="/">обзоре</Link>.
        </p>
      ) : (
        <div className="results">
          {recent.map((player) => (
            <Link key={player.id} className="result" href={`/players/${player.id}/matches`}>
              {player.avatar ? <img src={player.avatar} alt="" /> : <span className="avatar-fallback" />}
              <span>
                <strong>{player.name}</strong>
                <br />
                <span className="muted">матчи</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
