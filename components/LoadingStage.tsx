"use client";

import { useLayoutEffect, useRef } from "react";

function paint(stage: HTMLElement, now: number, start: number) {
  const t = (now - start) / 1000;
  stage.querySelectorAll<SVGGElement>("[data-spin]").forEach((node) => {
    const speed = Number(node.getAttribute("data-spin"));
    node.setAttribute("transform", `rotate(${(t * speed) % 360} 105 105)`);
  });
  stage.querySelectorAll<SVGRectElement>("[data-bar]").forEach((node) => {
    const base = Number(node.getAttribute("data-bar"));
    const phase = Number(node.getAttribute("data-phase"));
    const bottom = Number(node.getAttribute("data-bottom"));
    const height = base * (0.62 + 0.38 * (0.5 + 0.5 * Math.sin(t * 3.5 + phase)));
    node.setAttribute("height", height.toFixed(2));
    node.setAttribute("y", (bottom - height).toFixed(2));
  });
}

const LOADER_SCRIPT = `(function(){
  var stage = document.currentScript && document.currentScript.previousElementSibling;
  if (!stage || stage.getAttribute("data-live") === "1") return;
  stage.setAttribute("data-live", "1");
  var start = performance.now();
  function frame(now){
    if (!stage.isConnected) return;
    var t = (now - start) / 1000;
    var spins = stage.querySelectorAll("[data-spin]");
    for (var i = 0; i < spins.length; i++) {
      var speed = +spins[i].getAttribute("data-spin");
      spins[i].setAttribute("transform", "rotate(" + ((t * speed) % 360) + " 105 105)");
    }
    var bars = stage.querySelectorAll("[data-bar]");
    for (var j = 0; j < bars.length; j++) {
      var base = +bars[j].getAttribute("data-bar");
      var phase = +bars[j].getAttribute("data-phase");
      var bottom = +bars[j].getAttribute("data-bottom");
      var h = base * (0.62 + 0.38 * (0.5 + 0.5 * Math.sin(t * 3.5 + phase)));
      bars[j].setAttribute("height", h.toFixed(2));
      bars[j].setAttribute("y", (bottom - h).toFixed(2));
    }
    requestAnimationFrame(frame);
  }
  frame(start);
  requestAnimationFrame(frame);
})();`;

function Ring({ radius, color, dash, speed }: { radius: number; color: string; dash: string; speed: number }) {
  return (
    <g data-spin={speed}>
      <circle cx="105" cy="105" r={radius} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeDasharray={dash} />
    </g>
  );
}

function Dot({ at, color, speed }: { at: number; color: string; speed: number }) {
  return (
    <g data-spin={speed}>
      <circle cx="105" cy={at} r="3.5" fill={color} />
    </g>
  );
}

function Bar({
  x,
  y,
  height,
  color,
  phase,
}: {
  x: number;
  y: number;
  height: number;
  color: string;
  phase: number;
}) {
  return <rect x={x} y={y} width="8" height={height} rx="1.5" fill={color} data-bar={height} data-phase={phase} data-bottom={y + height} />;
}

export function LoadingMark({ tiny = false }: { tiny?: boolean }) {
  if (tiny) {
    return (
      <svg className="loading-mark is-tiny" viewBox="0 0 22 18" aria-hidden="true">
        <rect x="1" y="10" width="4" height="8" rx="1" fill="#3dcc7a">
          <animate attributeName="height" values="5;8;5" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="y" values="13;10;13" dur="1.8s" repeatCount="indefinite" />
        </rect>
        <rect x="9" y="5" width="4" height="13" rx="1" fill="#7dffb2">
          <animate attributeName="height" values="8;13;8" dur="1.8s" begin="0.12s" repeatCount="indefinite" />
          <animate attributeName="y" values="10;5;10" dur="1.8s" begin="0.12s" repeatCount="indefinite" />
        </rect>
        <rect x="17" y="0" width="4" height="18" rx="1" fill="#e2b657">
          <animate attributeName="height" values="11;18;11" dur="1.8s" begin="0.24s" repeatCount="indefinite" />
          <animate attributeName="y" values="7;0;7" dur="1.8s" begin="0.24s" repeatCount="indefinite" />
        </rect>
      </svg>
    );
  }
  return (
    <svg className="loading-mark" viewBox="0 0 210 210" aria-hidden="true">
      <circle cx="105" cy="105" r="46" fill="rgba(226,182,87,0.14)" />
      <circle cx="105" cy="105" r="26" fill="rgba(61,204,122,0.1)" />
      <Ring radius={100} color="rgba(226,182,87,0.95)" dash="150 478" speed={40} />
      <Ring radius={86} color="rgba(244,247,251,0.35)" dash="28 512" speed={22} />
      <Ring radius={72} color="#7dffb2" dash="100 352" speed={-65} />
      <Dot at={19} color="#e2b657" speed={-30} />
      <Dot at={33} color="#3dcc7a" speed={51} />
      <Dot at={51} color="#ff5d6c" speed={72} />
      <Bar x={87} y={111} height={18} color="#3dcc7a" phase={0} />
      <Bar x={101} y={99} height={30} color="#7dffb2" phase={0.6} />
      <Bar x={115} y={85} height={44} color="#e2b657" phase={1.2} />
    </svg>
  );
}

export function LoadingStage({ label = "Загрузка" }: { label?: string }) {
  const stageRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || stage.getAttribute("data-live") === "1") return;
    stage.setAttribute("data-live", "1");
    const start = performance.now();
    paint(stage, start, start);
    let frame = requestAnimationFrame(function loop(now) {
      if (!stage.isConnected) return;
      paint(stage, now, start);
      frame = requestAnimationFrame(loop);
    });
    return () => {
      cancelAnimationFrame(frame);
      stage.removeAttribute("data-live");
    };
  }, []);
  return (
    <>
      <div ref={stageRef} className="loading-stage" data-loader role="status" aria-live="polite" aria-label={label}>
        <LoadingMark />
        <p className="loading-caption">{label}</p>
      </div>
      <script dangerouslySetInnerHTML={{ __html: LOADER_SCRIPT }} />
    </>
  );
}
