"use client";

import { useState } from "react";
import { MatchLine } from "@/components/MatchLine";

export type FeedMatch = {
  matchId: number;
  hero: string;
  img: string | null;
  won: boolean;
  kills: number;
  deaths: number;
  assists: number;
  duration: number;
  startTime: number;
  turbo: boolean;
};

export function RankedMatches({ accountId, matches }: { accountId: number; matches: FeedMatch[] }) {
  const [turbo, setTurbo] = useState(false);
  const shown = matches.filter((match) => turbo || !match.turbo);

  return (
    <>
      <div className="match-tools">
        <label className="switch">
          <input
            type="checkbox"
            checked={turbo}
            onChange={(event) => setTurbo(event.target.checked)}
          />
          <span className="switch-track" aria-hidden="true" />
          <span>Turbo</span>
        </label>
        <span className="muted">{turbo ? "Рейтинговые и турбо" : "Только рейтинговые"}</span>
      </div>
      {shown.length === 0 ? (
        <p className="empty">{turbo ? "Рейтинговых матчей нет." : "Рейтинговых матчей без турбо нет."}</p>
      ) : (
        <div className="match-feed">
          {shown.map((match) => (
            <MatchLine
              key={match.matchId}
              href={`/matches/${match.matchId}?player=${accountId}`}
              img={match.img}
              hero={match.hero}
              won={match.won}
              kills={match.kills}
              deaths={match.deaths}
              assists={match.assists}
              duration={match.duration}
              when={match.startTime}
              detail={match.turbo ? "Turbo" : undefined}
            />
          ))}
        </div>
      )}
    </>
  );
}
