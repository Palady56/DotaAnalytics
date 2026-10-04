import Link from "next/link";
import { SLICES, sliceMedal, type SliceId } from "@/lib/meta";

export function SliceLinks({
  current,
  hrefFor,
}: {
  current: SliceId;
  hrefFor: (slice: SliceId) => string;
}) {
  return (
    <p className="chips rank-chips">
      {SLICES.map((item) => {
        const medal = sliceMedal(item.id);
        return (
          <Link
            key={item.id}
            href={hrefFor(item.id)}
            aria-current={item.id === current ? "page" : undefined}
            className={medal ? "rank-chip" : undefined}
            title={item.label}
          >
            {medal ? <img src={medal} alt={item.label} /> : item.label}
          </Link>
        );
      })}
    </p>
  );
}
