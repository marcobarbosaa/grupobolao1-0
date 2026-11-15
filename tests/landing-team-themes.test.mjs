import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { newRoster } from "../src/lib/new-roster.ts";
import {
  getLandingTheme,
  getTeamTheme,
  normalizeTeamId,
  resolveTeamName,
  teamPalettes,
  LANDING_THEME_DURATION_MS,
} from "../src/lib/landing-team-themes.ts";
const luminance = (hex) => {
  const rgb = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
};
test("the sixteen official palettes keep their exact colors and readable semantic tokens", () => {
  const expected = [
    ["Denver Nuggets", "#080F21 #142443 #FEC524 #1D428A #6FBEFF"],
    ["New York Knicks", "#08172B #142B4B #F58426 #006BB6 #EAF3FF"],
    ["Houston Rockets", "#13080D #29131B #CE1141 #8C233A #F0BFC9"],
    ["Miami Heat", "#10090B #261319 #98002E #F9A01B #FF6D44"],
    ["Phoenix Suns", "#140C22 #28183C #E56020 #5B2B82 #FFC16B"],
    ["Sacramento Kings", "#100D1C #241A3A #7B45C6 #63727A #C6A7FF"],
    ["New Orleans Hornets", "#071B22 #12343D #1D9EAA #4B276C #E5C36A"],
    ["Indiana Pacers", "#071324 #152D49 #FDBB30 #002D62 #81B9EA"],
    ["Detroit Pistons", "#090F21 #192943 #C8102E #1D42BA #B8C8E3"],
    ["Dallas Mavericks", "#071525 #152C45 #2385D8 #00538C #C5D7E5"],
    ["Atlanta Hawks", "#1A0B10 #351821 #E03A3E #8F1D31 #F1C66D"],
    ["Philadelphia 76ers", "#081427 #152C4E #006BB6 #ED174C #E7F0FF"],
    ["Chicago Bulls", "#100B0F #26171E #CE1141 #7D172D #E9BAC4"],
    ["Toronto Raptors", "#0D0D12 #24242D #CE1141 #75304D #C7C9D1"],
    ["Minnesota Timberwolves", "#071520 #142E3D #78BE20 #236192 #A5D5E8"],
    ["San Antonio Spurs", "#0B0C10 #22252C #C4CED4 #6F7881 #F0F4F7"],
  ];
  assert.deepEqual(
    Object.entries(teamPalettes).map(([team, palette]) => [team, Object.values(palette).join(" ")]),
    expected,
  );
  for (const player of newRoster) assert.ok(resolveTeamName(player.team), player.team);
  assert.equal(normalizeTeamId(" New York Knicks "), "new-york-knicks");
  assert.equal(resolveTeamName("SAS"), "San Antonio Spurs");
  assert.deepEqual(getTeamTheme("den"), teamPalettes["Denver Nuggets"]);
  for (const team of Object.keys(teamPalettes)) {
    const theme = getLandingTheme(team);
    const textLuminance = luminance(theme["--team-text-on-primary"]);
    const primaryLuminance = luminance(teamPalettes[team].primary);
    const primaryRatio =
      (Math.max(textLuminance, primaryLuminance) + 0.05) /
      (Math.min(textLuminance, primaryLuminance) + 0.05);
    assert.ok(primaryRatio >= 4.5, team + " text on primary: " + primaryRatio);
    for (const fg of ["--team-text", "--team-text-muted", "--team-focus"])
      for (const bg of [
        "--team-background",
        "--team-background-deep",
        "--team-surface",
        "--team-surface-hover",
      ]) {
        const ratio = (luminance(theme[fg]) + 0.05) / (luminance(theme[bg]) + 0.05);
        assert.ok(ratio >= 4.5, team + " " + fg + " on " + bg + ": " + ratio);
      }
  }
  assert.notEqual(
    getLandingTheme("unknown")["--team-primary"],
    teamPalettes["Houston Rockets"].primary,
  );
  assert.equal(getLandingTheme("San Antonio Spurs")["--team-text-on-primary"], "#101418");
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
