import Link from "next/link";
import { formatDuration, formatNumber, formatWhen } from "@/lib/stats";

export function MatchLine({
  href,
  img,
  hero,
  won,
  kills,
  deaths,
  assists,
  duration,
  when,
  detail,
}: {
  href: string;
  img: string | null;
  hero: string;
  won: boolean;
  kills: number;
  deaths: number;
  assists: number;
  duration: number | null;
  when: number | string | null;
  detail?: string;
}) {
  return (
    <Link href={href} className="match-line">
      {img ? <img src={img} alt="" /> : <span className="portrait-fallback" />}
      <span className={won ? "pip win" : "pip loss"}>{won ? "W" : "L"}</span>
      <span className="match-main">
        <b>{hero}</b>
        <span className="kda">
          {formatNumber(kills)} / {formatNumber(deaths)} / {formatNumber(assists)}
          {detail ? ` · ${detail}` : ""}
        </span>
      </span>
      <span className="match-side">
        <b>{formatDuration(duration)}</b>
        {formatWhen(when)}
      </span>
    </Link>
  );
}
