import { registerHooks } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  createRootRoute,
  createRouter,
  RouterContextProvider,
  createMemoryHistory,
} from "@tanstack/react-router";

registerHooks({
  resolve(specifier, context, next) {
    if (
      specifier.startsWith(".") &&
      /\.tsx?$/.test(context.parentURL || "") &&
      !/\.[a-z]+$/.test(specifier)
    ) {
      for (const suffix of [".ts", ".tsx"]) {
        const url = new URL(specifier + suffix, context.parentURL);
        if (existsSync(url)) return next(url.href, context);
      }
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith("file:") && /\.tsx?$/.test(url))
      return {
        format: "module",
        shortCircuit: true,
        source: ts.transpileModule(readFileSync(new URL(url), "utf8"), {
          compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2022,
            jsx: ts.JsxEmit.ReactJSX,
          },
        }).outputText,
      };
    return next(url, context);
  },
});
const { SeasonSpotlight } = await import("../src/components/home/SeasonSpotlight.tsx");
const { LeagueJourney } = await import("../src/components/home/LeagueJourney.tsx");
const { seasonSpotlight, portalStatusLabels } = await import("../src/lib/home-portal.ts");
const { isNavigationActive, siteNavigation } = await import("../src/lib/site-navigation.ts");
const router = createRouter({
  routeTree: createRootRoute(),
  history: createMemoryHistory({ initialEntries: ["/"] }),
});
const render = (component, props) =>
  renderToStaticMarkup(
    React.createElement(RouterContextProvider, { router }, React.createElement(component, props)),
  );

test("missing records stay distinct from not played and not qualified", () => {
  for (const status of ["not-imported", "not-played", "not-qualified", "no-games"]) {
    const html = render(SeasonSpotlight, {
      data: { ...seasonSpotlight, season: { status }, nextMatch: { status } },
    });
    assert.ok(html.includes(portalStatusLabels[status]));
    assert.doesNotMatch(html, /Resultados recentes|Destaques oficiais|0–0/);
  }
});
test("available season renders only the supplied official content", () => {
  const html = render(SeasonSpotlight, {
    data: {
      season: { status: "available", data: { name: "Temporada de teste" } },
      nextMatch: { status: "available", data: { label: "Partida de teste" } },
      recentResults: { status: "available", data: [{ id: "test", label: "Resultado de teste" }] },
      highlights: { status: "available", data: [] },
    },
  });
  for (const text of ["Temporada de teste", "Partida de teste", "Resultado de teste"])
    assert.ok(html.includes(text));
  assert.ok(!html.includes("Destaques oficiais"));
});
test("journey renders imported milestones and explicit pending states", () => {
  const html = render(LeagueJourney, {
    milestones: [
      {
        id: "a",
        title: "Marco de teste",
        content: { status: "available", data: { description: "Registro de teste" } },
      },
      { id: "b", title: "Fase de teste", content: { status: "not-qualified" } },
    ],
  });
  assert.ok(html.includes("Registro de teste"));
  assert.ok(html.includes(portalStatusLabels["not-qualified"]));
});
test("exactly one navigation destination matches each route and gallery alias", () => {
  for (const path of [
    "/",
    "/jogadores",
    "/jogadores/",
    "/jogadores/abel",
    "/biografias",
    "/hall-da-fama",
    "/temporadas",
    "/recordes",
    "/deep-analytics",
  ]) {
    assert.equal(
      siteNavigation.filter((item) => isNavigationActive(path, item.to)).length,
      1,
      path,
    );
  }
  assert.equal(isNavigationActive("/hall-da-fama", "/"), false);
  assert.equal(isNavigationActive("/biografias", "/jogadores"), true);
});
