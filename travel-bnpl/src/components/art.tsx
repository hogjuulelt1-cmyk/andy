import { routeMapSvg, sceneSvg, type RouteStop, type Scene } from "@/lib/art";

/** Stylised scene illustration (not a photo). */
export function SceneArt({
  scene,
  seed = 1,
  title,
  className = "",
}: {
  scene: Scene;
  seed?: number;
  title: string;
  className?: string;
}) {
  return (
    <div
      className={"overflow-hidden rounded-2xl " + className}
      // Static, generated server-side from our own code; no user input.
      dangerouslySetInnerHTML={{ __html: sceneSvg(scene, seed, title) }}
    />
  );
}

export function RouteMap({ stops, className = "" }: { stops: RouteStop[]; className?: string }) {
  const svg = routeMapSvg(stops, {
    fg: "currentColor",
    muted: "rgba(128,128,128,.6)",
    accent: "#c2452a",
    land: "rgba(128,128,128,.15)",
  });
  return (
    <div
      className={
        "overflow-hidden rounded-2xl border border-zinc-200 p-2 dark:border-zinc-800 " + className
      }
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
