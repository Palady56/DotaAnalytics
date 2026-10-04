import { rankIcon, rankStar } from "@/lib/stats";

export function RankMedal({
  tier,
  place,
}: {
  tier: number | null;
  place?: number | null;
}) {
  const src = rankIcon(tier, place);
  if (!src || tier == null) return null;
  const immortal = Math.floor(tier / 10) === 8;
  const shown = immortal && place != null && place > 0 ? String(place) : null;
  const star = rankStar(tier);
  return (
    <span className="medal-plate">
      <img className="rank-medal" src={src} alt="" />
      {star ? <img className="medal-star" src={star} alt="" /> : null}
      {shown ? <span className="medal-rank">{shown}</span> : null}
    </span>
  );
}
