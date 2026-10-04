"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CommandPalette } from "@/components/CommandPalette";
import { Logo } from "@/components/Logo";

function Icon({ d }: { d: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  search: "M7 12.5a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11ZM11 11l3 3",
  overview: "M2 3.5h5v4H2v-4ZM9 3.5h5v2H9v-2ZM9 8h5v4.5H9V8ZM2 10h5v2.5H2V10Z",
  matches: "M2 3h12M2 8h12M2 13h8",
  heroes: "M3 2.5h10v11H3v-11ZM6 6h4M6 9h4",
  meta: "M2 12.5 6 7l3 3 5-6",
  duo: "M4.5 6.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM11.5 6.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM2 13.5c.4-2 1.6-3 2.5-3s2.1 1 2.5 3M9 13.5c.4-2 1.6-3 2.5-3s2.1 1 2.5 3",
  compare: "M2 3.5h5.2v9H2v-9ZM8.8 3.5H14v9H8.8v-9Z",
  profile: "M8 8.2a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8ZM3.2 13.5c.7-2.2 2.4-3.2 4.8-3.2s4.1 1 4.8 3.2",
  panel: "M2.5 3h11v10h-11V3ZM6 3v10",
};

export function AppShell({
  children,
  accountId,
  viewer,
}: {
  children: React.ReactNode;
  accountId: number | null;
  viewer: { name: string; avatar: string | null } | null;
}) {
  const pathname = usePathname();
  const player = pathname.match(/^\/players\/(\d+)/);
  const playerId = player?.[1] ?? null;
  const profileHref = accountId ? `/players/${accountId}` : "/me";
  const [collapsed, setCollapsed] = useState(false);
  const [width, setWidth] = useState(232);
  const [overlay, setOverlay] = useState(false);
  const [palette, setPalette] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("passport-nav");
    const storedWidth = Number(localStorage.getItem("passport-nav-width"));
    if (stored === "collapsed") setCollapsed(true);
    if (storedWidth >= 200 && storedWidth <= 280) setWidth(storedWidth);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPalette((open) => !open);
      } else if (event.key === "Escape") {
        setPalette(false);
        setOverlay(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setOverlay(false);
  }, [pathname]);

  const overviewHref = playerId ? `/players/${playerId}` : "/";
  const matchesId = playerId ?? (accountId != null ? String(accountId) : null);
  const matchesHref = matchesId ? `/players/${matchesId}/matches` : "/matches";
  const heroesHref = "/meta";
  const items = [
    { href: overviewHref, label: "Обзор", icon: ICONS.overview, current: playerId ? pathname === `/players/${playerId}` : pathname === "/" || pathname.startsWith("/search") },
    { href: matchesHref, label: "Матчи", icon: ICONS.matches, current: pathname === "/matches" || pathname.startsWith("/matches/") || (matchesId != null && pathname.startsWith(`/players/${matchesId}/matches`)) },
    { href: heroesHref, label: "Герои", icon: ICONS.heroes, current: pathname === "/meta" || pathname.startsWith("/heroes") },
    { href: "/duo", label: "Дуэт", icon: ICONS.duo, current: pathname === "/duo" || pathname.startsWith("/duo/") },
    { href: "/compare", label: "Сравнение", icon: ICONS.compare, current: pathname === "/compare" || pathname.startsWith("/compare/") },
    { href: profileHref, label: "Профиль", icon: ICONS.profile, current: pathname === "/me" },
  ];
  const mobile = items.filter((item) => item.label !== "Профиль");

  const scope = pathname.startsWith("/players/") && pathname.includes("/matches")
    ? "Матчи"
    : pathname.startsWith("/players/") && pathname.includes("/meta")
      ? "Своя мета"
      : pathname.startsWith("/players/") && pathname.endsWith("/evolution")
        ? "Эволюция"
        : pathname.startsWith("/players/")
          ? "Обзор"
        : pathname.startsWith("/matches/")
          ? "Матч"
          : pathname.startsWith("/heroes")
            ? "Герой"
            : pathname.startsWith("/meta")
              ? "Герои"
              : pathname.startsWith("/duo")
                ? "Дуэт"
                : pathname.startsWith("/compare")
                  ? "Сравнение"
                  : pathname.startsWith("/me") || pathname.startsWith("/privacy")
                    ? "Профиль"
                    : "Поиск";

  function toggleCollapsed() {
    setCollapsed((value) => {
      localStorage.setItem("passport-nav", value ? "expanded" : "collapsed");
      return !value;
    });
  }

  function onResizeStart(event: React.PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    const startX = event.clientX;
    const startW = width;
    function move(next: PointerEvent) {
      const value = Math.min(280, Math.max(200, startW + next.clientX - startX));
      setWidth(value);
      localStorage.setItem("passport-nav-width", String(value));
    }
    function up() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <div className={collapsed ? "app collapsed" : "app"} style={{ ["--sidebar-w" as string]: `${collapsed ? 56 : width}px` }}>
      <aside className={overlay ? "sidebar open" : "sidebar"}>
        <Link href="/" className="brand">
          <Logo />
          <span className="brand-full">Dota Analytics</span>
        </Link>
        <button className="icon-btn" type="button" onClick={() => setPalette(true)}>
          <Icon d={ICONS.search} />
          <span className="nav-label">
            Поиск <span className="kbd">Ctrl K</span>
          </span>
        </button>
        <nav aria-label="Разделы">
          {items.map((item) => (
            <Link key={item.label} href={item.href} className="nav-link" aria-current={item.current ? "page" : undefined} title={item.label}>
              <Icon d={item.icon} />
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-foot">
          <button className="icon-btn" type="button" onClick={toggleCollapsed} aria-pressed={collapsed}>
            <Icon d={ICONS.panel} />
            <span className="nav-label">{collapsed ? "Развернуть" : "Свернуть"}</span>
          </button>
        </div>
        <button className="resizer" type="button" aria-label="Ширина разделов" onPointerDown={onResizeStart} />
      </aside>
      <button className={overlay ? "scrim on" : "scrim"} type="button" aria-label="Закрыть разделы" onClick={() => setOverlay(false)} />
      <div className="main-col">
        <header className="topbar">
          <div className="top-actions">
            <button className="icon-btn menu-toggle" type="button" aria-label="Разделы" onClick={() => setOverlay(true)}>
              <Icon d={ICONS.panel} />
            </button>
            <p className="scope">{scope}</p>
          </div>
          <div className="top-actions">
            <button className="icon-btn" type="button" onClick={() => setPalette(true)} aria-label="Поиск">
              <Icon d={ICONS.search} />
            </button>
            {viewer ? (
              <Link className="me-chip" href={profileHref} title={viewer.name} aria-label={viewer.name}>
                {viewer.avatar ? <img src={viewer.avatar} alt="" /> : <span className="avatar-fallback" />}
                <span className="me-name" dir="auto">
                  {viewer.name}
                </span>
              </Link>
            ) : (
              <Link className="icon-btn" href={profileHref} aria-label="Войти">
                <Icon d={ICONS.profile} />
                <span className="nav-label">Войти</span>
              </Link>
            )}
          </div>
        </header>
        <div className="content">
          {children}
          <footer className="colophon">
            <Link href="/privacy">Конфиденциальность</Link>
          </footer>
        </div>
      </div>
      <nav className="bottombar" aria-label="Разделы">
        {mobile.map((item) => (
          <Link key={item.label} href={item.href} aria-current={item.current ? "page" : undefined}>
            <Icon d={item.icon} />
            {item.label}
          </Link>
        ))}
      </nav>
      <CommandPalette open={palette} onClose={() => setPalette(false)} profileHref={profileHref} />
    </div>
  );
}
