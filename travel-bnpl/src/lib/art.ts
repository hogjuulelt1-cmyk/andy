/**
 * Framework-free SVG illustrations and the route map, returned as strings so
 * both the Next.js app and tools/build-preview.ts can use them. No external
 * images: the artifact sandbox blocks them, and these stay crisp at any size.
 *
 * Scenes are deliberately stylised (flat, layered silhouettes), labelled as
 * illustrations in the UI, not passed off as photos.
 */

export type Scene =
  | "dunes"
  | "canyon"
  | "cliffs"
  | "steppe"
  | "horses"
  | "lake"
  | "stars"
  | "city"
  | "hotspring"
  | "monastery"
  | "rocks";

const W = 400;
const H = 220;

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
}

function hill(y: number, amp: number, fill: string, seed: number, steps = 7): string {
  const r = rng(seed);
  const pts: string[] = [`M0 ${H}`, `L0 ${y}`];
  const dx = W / steps;
  for (let i = 1; i <= steps; i++) {
    const x = i * dx;
    const cy = y - amp * (0.3 + r());
    pts.push(`Q${x - dx / 2} ${cy} ${x} ${y + amp * (r() - 0.5) * 0.6}`);
  }
  pts.push(`L${W} ${H} Z`);
  return `<path d="${pts.join(" ")}" fill="${fill}"/>`;
}

function ger(x: number, y: number, s: number, fill = "#f5f1e8"): string {
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-14 0 L-14 -8 Q0 -22 14 -8 L14 0 Z" fill="${fill}"/><rect x="-3" y="-8" width="6" height="8" fill="#b4542e"/><path d="M-15 -7 Q0 -21 15 -7" fill="none" stroke="#c9b99a" stroke-width="1"/></g>`;
}

function camel(x: number, y: number, s: number, fill = "#4a3728"): string {
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="${fill}"><path d="M-16 0 L-16 -9 Q-14 -14 -9 -13 Q-7 -19 -3 -14 Q1 -19 5 -13 L9 -13 L13 -17 L15 -16 L13 -11 L12 -9 L12 0 L10 0 L10 -7 L-12 -7 L-12 0 Z"/></g>`;
}

function horse(x: number, y: number, s: number, fill = "#3b2f2a"): string {
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="${fill}"><path d="M-12 0 L-12 -8 L-10 -10 L2 -10 L6 -16 L11 -17 L13 -14 L10 -12 L10 -8 L8 -8 L8 0 L6 0 L6 -6 L-8 -6 L-8 0 Z"/><path d="M-12 -9 L-16 -4" stroke="${fill}" stroke-width="2"/></g>`;
}

function stars(seed: number, n: number, maxY: number): string {
  const r = rng(seed);
  let s = "";
  for (let i = 0; i < n; i++) {
    const x = r() * W;
    const y = r() * maxY;
    const rad = 0.4 + r() * 1.1;
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad.toFixed(1)}" fill="#fff" opacity="${(0.5 + r() * 0.5).toFixed(2)}"/>`;
  }
  return s;
}

function sky(id: string, top: string, bottom: string): string {
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${id})"/>`;
}

const SCENES: Record<Scene, (seed: number) => string> = {
  dunes: (s) =>
    sky("g" + s, "#ffd9a8", "#f29e5a") +
    `<circle cx="300" cy="70" r="26" fill="#fff3d6" opacity=".9"/>` +
    hill(150, 40, "#e2944f", s + 1, 4) +
    hill(170, 30, "#c9733a", s + 2, 5) +
    hill(192, 18, "#a8582a", s + 3, 6) +
    camel(150, 190, 1.1) +
    camel(190, 193, 0.9) +
    camel(225, 191, 1),
  canyon: (s) =>
    sky("g" + s, "#9ec5e8", "#f4d9b8") +
    hill(120, 30, "#d8a877", s + 1, 5) +
    `<path d="M0 140 L60 140 L75 95 L120 95 L135 140 L220 140 L235 85 L290 85 L305 140 L400 140 L400 220 L0 220 Z" fill="#b36a3b"/>` +
    `<path d="M0 160 L400 160 L400 220 L0 220 Z" fill="#8f4f2b"/>` +
    hill(200, 10, "#6f3b1f", s + 4, 8),
  cliffs: (s) =>
    sky("g" + s, "#f7c6a0", "#e86f4f") +
    `<circle cx="80" cy="60" r="22" fill="#fff0d8" opacity=".95"/>` +
    `<path d="M0 150 L40 150 L55 110 L110 110 L125 150 L170 150 L190 100 L250 100 L265 150 L320 150 L335 120 L380 120 L400 150 L400 220 L0 220 Z" fill="#c2452a"/>` +
    hill(185, 14, "#8f2f1c", s + 2, 7) +
    ger(60, 200, 1) +
    ger(95, 203, 0.8),
  steppe: (s) =>
    sky("g" + s, "#9fd0f0", "#dff0fb") +
    `<ellipse cx="90" cy="60" rx="40" ry="14" fill="#fff" opacity=".8"/><ellipse cx="300" cy="45" rx="55" ry="16" fill="#fff" opacity=".7"/>` +
    hill(130, 40, "#8fb86f", s + 1, 4) +
    hill(160, 25, "#6f9e4f", s + 2, 6) +
    hill(190, 14, "#5a8a3f", s + 3, 8) +
    ger(250, 195, 1.2) +
    ger(290, 199, 0.9) +
    horse(120, 200, 0.9),
  horses: (s) =>
    sky("g" + s, "#b9dcf5", "#f1f6e8") +
    hill(125, 35, "#a9c58b", s + 1, 4) +
    hill(160, 20, "#7fa863", s + 2, 6) +
    hill(195, 10, "#5f8c48", s + 3, 9) +
    horse(90, 204, 1.2) +
    horse(150, 208, 1) +
    horse(200, 203, 1.1, "#5a4234") +
    horse(260, 207, 0.9) +
    horse(320, 204, 1.05, "#2d2320"),
  lake: (s) =>
    sky("g" + s, "#7fb6e3", "#cfe6f7") +
    hill(110, 40, "#5f7f9b", s + 1, 5) +
    hill(135, 22, "#4f7b63", s + 2, 7) +
    `<rect x="0" y="150" width="${W}" height="70" fill="#2f7fb8"/>` +
    `<path d="M0 150 Q100 146 200 150 T400 150 L400 220 L0 220Z" fill="#3b93cf"/>` +
    `<g stroke="#fff" stroke-width="1" opacity=".5"><path d="M40 170 h30"/><path d="M200 185 h40"/><path d="M300 165 h25"/></g>` +
    ger(60, 150, 0.9) +
    ger(90, 152, 0.75) +
    `<path d="M330 150 l-10 10 h40 l-10 -10 z" fill="#f2c94c"/>`,
  stars: (s) =>
    sky("g" + s, "#0b1026", "#1d2a55") +
    stars(s, 120, 150) +
    `<path d="M0 60 Q120 20 220 80 T400 40" stroke="#fff" stroke-width="30" opacity=".12" fill="none"/>` +
    hill(170, 20, "#101627", s + 1, 5) +
    hill(195, 10, "#070a14", s + 2, 8) +
    ger(120, 205, 1.1, "#e6dcc8") +
    `<circle cx="140" cy="198" r="3" fill="#ffd27a"/>` +
    ger(260, 208, 0.9, "#e6dcc8"),
  city: (s) =>
    sky("g" + s, "#c7dcee", "#f3e7d6") +
    hill(120, 30, "#9fb3a6", s + 1, 5) +
    `<g fill="#546378"><rect x="30" y="120" width="30" height="80"/><rect x="70" y="100" width="22" height="100"/><rect x="100" y="130" width="40" height="70"/><rect x="150" y="90" width="26" height="110"/><rect x="186" y="115" width="34" height="85"/><rect x="230" y="105" width="20" height="95"/><rect x="260" y="125" width="44" height="75"/><rect x="314" y="95" width="24" height="105"/><rect x="348" y="130" width="30" height="70"/></g>` +
    `<path d="M150 90 L163 70 L176 90 Z" fill="#c8a24a"/>` +
    `<rect x="0" y="200" width="${W}" height="20" fill="#3c4453"/>`,
  hotspring: (s) =>
    sky("g" + s, "#ffd6b0", "#f9b48c") +
    hill(110, 40, "#6f8f6a", s + 1, 5) +
    hill(140, 25, "#4f7a52", s + 2, 6) +
    `<ellipse cx="200" cy="190" rx="130" ry="26" fill="#8ed0d6"/><ellipse cx="200" cy="186" rx="118" ry="20" fill="#b7e6ea"/>` +
    `<g stroke="#fff" stroke-width="3" fill="none" opacity=".7"><path d="M150 170 q6 -12 0 -24 q-6 -12 0 -24"/><path d="M200 172 q6 -12 0 -24 q-6 -12 0 -24"/><path d="M250 170 q6 -12 0 -24 q-6 -12 0 -24"/></g>` +
    ger(60, 160, 0.9) +
    ger(340, 162, 0.9),
  monastery: (s) =>
    sky("g" + s, "#bcd7ee", "#f6e3c8") +
    hill(130, 30, "#b8a57a", s + 1, 5) +
    `<rect x="40" y="150" width="320" height="50" fill="#d9c7a2"/>` +
    `<g><rect x="150" y="110" width="100" height="40" fill="#b0402a"/><path d="M140 110 L200 85 L260 110 Z" fill="#2f4a3e"/><path d="M160 85 L200 68 L240 85 Z" fill="#2f4a3e"/><rect x="192" y="125" width="16" height="25" fill="#5a2a1a"/></g>` +
    `<g fill="#e8dcc0"><path d="M60 150 L60 120 Q75 100 90 120 L90 150 Z"/><path d="M310 150 L310 120 Q325 100 340 120 L340 150 Z"/></g>` +
    `<rect x="0" y="200" width="${W}" height="20" fill="#9b8a63"/>`,
  rocks: (s) =>
    sky("g" + s, "#a9cdee", "#e9f0d8") +
    hill(120, 40, "#7a9a72", s + 1, 4) +
    `<g fill="#8d7f6a"><path d="M60 190 L75 130 L100 120 L130 140 L140 190 Z"/><path d="M220 190 L230 110 L270 100 L300 135 L310 190 Z"/><path d="M330 190 L340 150 L370 145 L385 190 Z"/></g>` +
    `<g fill="#6f6250"><path d="M75 130 L100 120 L100 160 L80 165 Z"/><path d="M230 110 L270 100 L265 150 L235 155 Z"/></g>` +
    hill(195, 10, "#4f7b45", s + 3, 9) +
    horse(170, 206, 1),
};

export function sceneSvg(scene: Scene, seed = 1, title = ""): string {
  const body = (SCENES[scene] ?? SCENES.steppe)(seed);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${title}" preserveAspectRatio="xMidYMid slice">${body}</svg>`;
}

// ---- route map ------------------------------------------------------------

/** Simplified outline of Mongolia (lon, lat), clockwise from the west tip. */
const OUTLINE: [number, number][] = [
  [87.8, 49.2],
  [90.0, 50.5],
  [92.5, 50.8],
  [95.0, 52.0],
  [98.0, 51.8],
  [98.9, 52.1],
  [102.2, 51.4],
  [105.0, 50.4],
  [107.5, 50.3],
  [108.5, 49.4],
  [110.0, 49.3],
  [111.5, 49.4],
  [113.5, 49.9],
  [115.5, 49.9],
  [116.7, 49.8],
  [117.8, 49.5],
  [119.9, 47.0],
  [119.9, 46.7],
  [118.5, 46.7],
  [117.4, 46.3],
  [116.0, 45.7],
  [115.7, 45.4],
  [114.5, 45.0],
  [113.5, 44.8],
  [111.9, 43.7],
  [111.4, 43.5],
  [110.4, 42.7],
  [108.5, 42.4],
  [106.0, 42.2],
  [104.5, 41.9],
  [103.0, 41.9],
  [101.0, 42.5],
  [99.5, 42.6],
  [97.2, 42.8],
  [96.3, 42.7],
  [95.0, 44.3],
  [93.5, 44.9],
  [91.5, 45.1],
  [90.9, 46.3],
  [91.0, 47.7],
  [90.0, 47.9],
  [88.3, 48.4],
];

const MW = 400;
const MH = 230;
const K = 12;
export function project(lat: number, lon: number): [number, number] {
  return [(lon - 87) * K, (52.5 - lat) * K * 1.3 + 10];
}

export type RouteStop = { lat: number; lon: number; label: string; day: number };

export function routeMapSvg(
  stops: RouteStop[],
  opts: { fg: string; muted: string; accent: string; land: string },
): string {
  const outline = OUTLINE.map(([lon, lat]) =>
    project(lat, lon)
      .map((v) => v.toFixed(1))
      .join(","),
  ).join(" ");
  const pts = stops.map((s) => ({ ...s, xy: project(s.lat, s.lon) }));
  const path = pts
    .map((p, i) => `${i ? "L" : "M"}${p.xy[0].toFixed(1)} ${p.xy[1].toFixed(1)}`)
    .join(" ");
  // Label each unique place once, at its first visit.
  const seen = new Set<string>();
  const labels = pts
    .filter((p) => (seen.has(p.label) ? false : (seen.add(p.label), true)))
    .map((p, i) => {
      const [x, y] = p.xy;
      const anchor = x > MW * 0.7 ? "end" : "start";
      const dx = anchor === "end" ? -8 : 8;
      // Alternate above/below the dot so clustered stops stay readable.
      const dy = i % 2 === 0 ? -6 : 13;
      return `<text x="${(x + dx).toFixed(1)}" y="${(y + dy).toFixed(1)}" font-size="10" text-anchor="${anchor}" fill="${opts.fg}" paint-order="stroke" stroke="${opts.land}" stroke-width="3">${escape(p.label)}</text>`;
    })
    .join("");
  const dots = pts
    .map((p, i) => {
      const [x, y] = p.xy;
      const first = i === 0 || i === pts.length - 1;
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${first ? 5 : 4}" fill="${first ? opts.fg : opts.accent}" stroke="${opts.land}" stroke-width="1.5"/>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MW} ${MH}" width="100%" role="img" aria-label="route map">
<polygon points="${outline}" fill="${opts.land}" stroke="${opts.muted}" stroke-width="1"/>
<path d="${path}" fill="none" stroke="${opts.accent}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="6 4"/>
${dots}${labels}</svg>`;
}

function escape(s: string): string {
  return s.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string,
  );
}
