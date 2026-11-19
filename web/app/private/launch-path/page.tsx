import { Bricolage_Grotesque, IBM_Plex_Mono, IBM_Plex_Sans, Noto_Serif_SC } from "next/font/google";
import { requireAdmin } from "@/lib/auth";
import { DEFAULT_SETTINGS, logsFromDailyLog, parseSettings } from "@/lib/launchPath";
import { getFullDailyLog, getLaunchPath } from "@/lib/private";
import DataError from "@/app/components/DataError";
import LaunchPath from "./LaunchPath";
import "./launch-path.css";

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

export default async function LaunchPathPage() {
  await requireAdmin();
  const [plan, daily] = await Promise.all([getLaunchPath(), getFullDailyLog()]);
  const fonts = `lp ${display.variable} ${body.variable} ${mono.variable} ${cjk.variable}`;

  if (!plan || !daily) {
    return (
      <div className={fonts}>
        <div className="wrap" style={{ paddingTop: 32 }}>
          <DataError label="the Launch Path" />
        </div>
      </div>
    );
  }

  return (
    <div className={fonts}>
      <LaunchPath
        initialSettings={parseSettings(plan.settings) ?? DEFAULT_SETTINGS}
        initialDone={plan.done}
        initialLogs={logsFromDailyLog(daily)}
      />
    </div>
  );
}
