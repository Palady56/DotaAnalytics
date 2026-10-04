"use client";

import { useState } from "react";

export function CopyText({ text }: { text: string }) {
  const [note, setNote] = useState<string | null>(null);
  return (
    <div className="copy-block">
      <h2>Короткий текст для ссылки</h2>
      <p className="summary">{text}</p>
      <button
        className="action"
        type="button"
        onClick={() => {
          const clipboard = navigator.clipboard;
          if (!clipboard) {
            setNote("Буфер недоступен: текст выше можно выделить вручную.");
            return;
          }
          clipboard.writeText(text).then(
            () => setNote("Скопировано"),
            () => setNote("Буфер недоступен: текст выше можно выделить вручную."),
          );
        }}
      >
        Скопировать абзац
      </button>
      {note ? <p className="muted">{note}</p> : null}
    </div>
  );
}
