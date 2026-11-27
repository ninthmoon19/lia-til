import { Archivo_Black, Bricolage_Grotesque, IBM_Plex_Mono, IBM_Plex_Sans, Noto_Serif_SC, Nunito, Press_Start_2P, VT323 } from "next/font/google";
import { requireAdmin } from "@/lib/auth";
import { DEFAULT_SETTINGS, fitDays, logsFromDailyLog, parsePlan, parseSettings } from "@/lib/launchPath";
import { getFullDailyLog, getLaunchPath } from "@/lib/private";
import DataError from "@/app/components/DataError";
import { DEFAULT_PLAN } from "./data";
import LaunchPath from "./LaunchPath";
import "./launch-path.css";
import "./skins.css";

export const metadata = {
  title: "Private · Launch Path",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";
// Allow the request to wait out a cold backend start (Render free tier ~40s).
export const maxDuration = 60;

// The page's own type: self-hosted by next/font, so nothing loads from Google at runtime.
const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["500", "700"], variable: "--lp-font-display" });
const body = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--lp-font-body" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--lp-font-mono" });
// CJK glyphs only appear on the chart-reading view; don't preload the big font.
const cjk = Noto_Serif_SC({ weight: ["400", "600"], variable: "--lp-font-cjk", preload: false });
// Faces for the optional visual styles (skins.css). Not preloaded: only the chosen style uses them.
const pixel = Press_Start_2P({ subsets: ["latin"], weight: "400", variable: "--lp-font-pixel", preload: false });
const pixelText = VT323({ subsets: ["latin"], weight: "400", variable: "--lp-font-pixel-text", preload: false });
const round = Nunito({ subsets: ["latin"], weight: ["600", "800", "900"], variable: "--lp-font-round", preload: false });
const poster = Archivo_Black({ subsets: ["latin"], weight: "400", variable: "--lp-font-poster", preload: false });

export default async function LaunchPathPage() {
  await requireAdmin();
  const [plan, daily] = await Promise.all([getLaunchPath(), getFullDailyLog()]);
  const fonts = [
    "lp", display.variable, body.variable, mono.variable, cjk.variable,
    pixel.variable, pixelText.variable, round.variable, poster.variable,
  ].join(" ");

  if (!plan || !daily) {
    return (
      <div className={fonts}>
        <div className="wrap" style={{ paddingTop: 32 }}>
          <DataError label="the Launch Path" />
        </div>
      </div>
    );
  }

  // A stored plan replaces the default one; the day counts follow its length.
  const phases = parsePlan(plan.plan) ?? DEFAULT_PLAN;
  const settings = parseSettings(plan.settings) ?? DEFAULT_SETTINGS;
  return (
    <div className={fonts}>
      <LaunchPath
        initialPlan={phases}
        initialSettings={{ ...settings, days: fitDays(settings.days, phases.length) }}
        initialDone={plan.done}
        initialLogs={logsFromDailyLog(daily)}
      />
    </div>
  );
}
