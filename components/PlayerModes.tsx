import Link from "next/link";

const MODES = [
  { id: "overview", label: "Обзор", href: (id: number) => `/players/${id}` },
  { id: "matches", label: "Матчи", href: (id: number) => `/players/${id}/matches` },
  { id: "heroes", label: "Герои", href: () => "/meta" },
  { id: "meta", label: "Своя мета", href: (id: number) => `/players/${id}/meta` },
] as const;

export function PlayerModes({
  accountId,
  current,
}: {
  accountId: number;
  current: "overview" | "matches" | "meta";
}) {
  return (
    <nav className="modes" aria-label="Режимы игрока">
      {MODES.map((mode) => (
        <Link
          key={mode.id}
          className="mode"
          href={mode.href(accountId)}
          aria-current={mode.id === current ? "page" : undefined}
        >
          {mode.label}
        </Link>
      ))}
    </nav>
  );
}
