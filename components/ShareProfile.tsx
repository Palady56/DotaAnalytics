"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type ProfileCard = {
  name: string;
  rank: string;
  winRate: string;
  matches: string;
  slice: string;
  lane: string;
  heroName: string | null;
  heroLine: string | null;
  heroImg: string | null;
};

export function ShareProfile({ card }: { card: ProfileCard }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function download() {
    setBusy(true);
    setNote(null);
    try {
      const blob = await renderCard(card);
      const file = new File([blob], "dota-analytics.png", { type: "image/png" });
      const share = navigator.share;
      const canShare = navigator.canShare?.({ files: [file] }) ?? false;
      if (share && canShare) {
        await share({ files: [file], title: card.name });
        return;
      }
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = "dota-analytics.png";
      link.click();
      URL.revokeObjectURL(href);
    } catch {
      setNote("Картинка не сохранилась. Карточку на экране можно снять самой.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button className="action" type="button" onClick={() => setOpen(true)}>
        Поделиться профилем
      </button>
      {open && mounted
        ? createPortal(
            <div className="share-layer" role="presentation" onClick={() => setOpen(false)}>
              <div className="share-dialog" role="dialog" aria-label="Карточка профиля" onClick={(event) => event.stopPropagation()}>
                <ProfileCardView card={card} />
                <div className="share-actions">
                  <button className="action" type="button" onClick={download} disabled={busy}>
                    {busy ? "Готовится" : "Сохранить картинку"}
                  </button>
                  <button className="text-link" type="button" onClick={() => setOpen(false)}>
                    Закрыть
                  </button>
                </div>
                {note ? <p className="muted">{note}</p> : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export function ProfileCardView({ card }: { card: ProfileCard }) {
  return (
    <article className="share-card">
      <p className="share-brand">Dota Analytics</p>
      {card.heroImg ? <img src={card.heroImg} alt="" /> : <span className="share-art" />}
      <h2 dir="auto">{card.name}</h2>
      <p>{card.rank}</p>
      <p className="share-rate">{card.winRate}</p>
      <p>{card.matches}</p>
      <p className="muted">{card.slice}</p>
      <p>Линия: {card.lane}</p>
      <p className="share-hero-label">Частый герой</p>
      <p>{card.heroName ? `${card.heroName} · ${card.heroLine}` : "нет данных"}</p>
    </article>
  );
}

async function renderCard(card: ProfileCard): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 840;
  canvas.height = 1180;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.fillStyle = "#07080a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#243049";
  ctx.lineWidth = 4;
  ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);
  ctx.fillStyle = "#8eb4ff";
  ctx.font = "600 28px Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("DOTA ANALYTICS", 420, 110);
  const image = card.heroImg ? await loadImage(`/api/card-asset?url=${encodeURIComponent(card.heroImg)}`) : null;
  if (image) {
    ctx.save();
    roundRect(ctx, 250, 160, 340, 190, 12);
    ctx.clip();
    ctx.drawImage(image, 250, 160, 340, 190);
    ctx.restore();
  } else {
    ctx.fillStyle = "#14171d";
    roundRect(ctx, 250, 160, 340, 190, 12);
    ctx.fill();
  }
  ctx.fillStyle = "#f4f7fb";
  ctx.font = "600 54px Segoe UI, sans-serif";
  ctx.fillText(fit(ctx, card.name, 700), 420, 450);
  ctx.fillStyle = "#c5d0e0";
  ctx.font = "400 32px Segoe UI, sans-serif";
  ctx.fillText(fit(ctx, card.rank, 700), 420, 510);
  ctx.fillStyle = "#f4f7fb";
  ctx.font = "600 64px Segoe UI, sans-serif";
  ctx.fillText(card.winRate, 420, 620);
  ctx.font = "400 32px Segoe UI, sans-serif";
  ctx.fillText(card.matches, 420, 680);
  ctx.fillStyle = "#8b97a8";
  ctx.font = "400 24px Segoe UI, sans-serif";
  ctx.fillText(card.slice, 420, 730);
  ctx.fillStyle = "#f4f7fb";
  ctx.font = "400 32px Segoe UI, sans-serif";
  ctx.fillText(fit(ctx, `Линия: ${card.lane}`, 700), 420, 820);
  ctx.fillStyle = "#8b97a8";
  ctx.font = "400 22px Segoe UI, sans-serif";
  ctx.fillText("ЧАСТЫЙ ГЕРОЙ", 420, 900);
  ctx.fillStyle = "#f4f7fb";
  ctx.font = "600 36px Segoe UI, sans-serif";
  ctx.fillText(fit(ctx, card.heroName ? `${card.heroName} · ${card.heroLine}` : "нет данных", 700), 420, 960);
  ctx.fillStyle = "#8eb4ff";
  ctx.font = "400 26px Segoe UI, sans-serif";
  ctx.fillText("Dota Analytics", 420, 1100);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("blob");
  return blob;
}

function fit(ctx: CanvasRenderingContext2D, text: string, max: number): string {
  if (ctx.measureText(text).width <= max) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > max) cut = cut.slice(0, -1);
  return `${cut}…`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}
