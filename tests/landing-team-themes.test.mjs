import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { newRoster } from "../src/lib/new-roster.ts";
import {
  getLandingTheme,
  teamPalettes,
  LANDING_THEME_DURATION_MS,
} from "../src/lib/landing-team-themes.ts";
const luminance = (hex) => {
  const rgb = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
};
test("every roster team has an explicit palette and readable text on its surfaces", () => {
  assert.deepEqual(new Set(newRoster.map((p) => p.team)), new Set(Object.keys(teamPalettes)));
  for (const player of newRoster) {
    const theme = getLandingTheme(player.team);
    for (const fg of ["--team-text", "--team-text-muted", "--team-focus"])
      for (const bg of [
        "--team-background",
        "--team-background-deep",
        "--team-surface",
        "--team-surface-hover",
      ]) {
        const ratio = (luminance(theme[fg]) + 0.05) / (luminance(theme[bg]) + 0.05);
        assert.ok(ratio >= 4.5, player.team + " " + fg + " on " + bg + ": " + ratio);
      }
  }
  assert.notEqual(
    getLandingTheme("unknown")["--team-primary"],
    teamPalettes["Houston Rockets"].primary,
  );
});
test("landing colors use semantic tokens and synchronize transition duration", () => {
  const css = readFileSync("src/components/home/CinematicHome.css", "utf8");
  const colors = css.match(/#[\da-f]{3,8}\b/gi) || [];
  assert.ok(
    colors.every((c) => /^#f+([\da-f]{2})?$/i.test(c)),
    colors.join(","),
  );
  const themeCss = readFileSync("src/components/home/LandingTheme.css", "utf8");
  assert.ok(themeCss.includes("--arena-scene-duration: " + LANDING_THEME_DURATION_MS + "ms"));
  assert.ok(css.includes("opacity var(--arena-scene-duration)"));
});
