"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

const MODES = [
  { id: "overview", label: "Обзор", href: (id: number) => `/players/${id}` },
  { id: "matches", label: "Матчи", href: (id: number) => `/players/${id}/matches` },
  { id: "heroes", label: "Герои", href: () => "/meta" },
  { id: "meta", label: "Своя мета", href: (id: number) => `/players/${id}/meta` },
  { id: "evolution", label: "Эволюция", href: (id: number) => `/players/${id}/evolution` },
] as const;

export function PlayerModes({
  accountId,
  current,
}: {
  accountId: number;
  current: "overview" | "matches" | "meta" | "evolution";
}) {
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    const box = nav.current;
    const tab = box?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!box || !tab) return;
    const left = tab.offsetLeft - (box.clientWidth - tab.offsetWidth) / 2;
    box.scrollLeft = Math.max(0, left);
  }, [current]);

  return (
    <nav ref={nav} className="modes" aria-label="Режимы игрока">
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
