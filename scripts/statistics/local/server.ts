import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import { appendFile } from "node:fs/promises";
import { LocalImportService } from "./service.ts";
import { authorizeLocalRequest, LOCAL_ORIGIN, LOCAL_PORT } from "./security.ts";
import { privatePath } from "./storage.ts";
import type { IncomingMessage, ServerResponse } from "node:http";

async function jsonBody(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  let bytes = 0;
  if (!String(req.headers["content-type"]).startsWith("application/json"))
    throw new Error("Envie application/json");
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > 35 * 1024 * 1024) throw new Error("Requisição excede limite");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
export function createLocalHandler(service: LocalImportService, token: string) {
  const expires = Date.now() + 8 * 60 * 60 * 1000;
  let busy = false;
  return async (req: IncomingMessage, res: ServerResponse) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    let acquired = false;
    try {
      authorizeLocalRequest(req, token, expires);
      if (req.method !== "POST") {
        res.statusCode = 405;
        res.end();
        return;
      }
      const readOnly = ["image", "load", "list"].includes(req.url?.split("/").at(-1) ?? "");
      if (busy && !readOnly) {
        res.statusCode = 409;
        res.end(JSON.stringify({ error: "Operação em andamento. Aguarde e tente novamente." }));
        return;
      }
      if (!readOnly) {
        busy = true;
        acquired = true;
      }
      const body = await jsonBody(req),
        action = req.url?.split("/").at(-1);
      let result: unknown;
      switch (action) {
        case "list":
          result = await service.list();
          break;
        case "create":
          result = await service.create(body.folder);
          break;
        case "load":
          result = await service.draft(body.id);
          break;
        case "upload":
          result = await service.upload(body.id, body.revision, body.path, body.base64);
          break;
        case "configure":
          result = await service.configure(
            body.id,
            body.revision,
            body.season,
            body.confirmed === true,
          );
          break;
        case "edit":
          result = await service.edit(
            body.id,
            body.revision,
            body.rowId,
            body.item,
            body.reviewed === true,
            body.excludedReason,
          );
          break;
        case "alias":
          result = await service.addAlias(
            body.name,
            body.playerId,
            body.approvedBy,
            body.confirmed === true,
          );
          break;
        case "ocr": {
          const controller = new AbortController();
          res.on("close", () => {
            if (!res.writableEnded) controller.abort();
          });
          result = await service.ocr(
            body.id,
            body.revision,
            body.rowId,
            controller.signal,
            body.processed,
          );
          break;
        }
        case "image": {
          const image = await service.image(body.id, body.rowId);
          res.setHeader(
            "Content-Type",
            "image/" + (image.extension === "jpg" ? "jpeg" : image.extension),
          );
          res.end(image.bytes);
          return;
        }
        case "review":
          result = await service.review(body.id);
          break;
        case "approve":
          result = await service.approve(
            body.id,
            body.reviewHash,
            body.approvedBy,
            body.correctionIds,
            body.confirmed === true,
          );
          break;
        case "dry-run":
          result = await service.publish(body.id, false, false);
          break;
        case "publish":
          result = await service.publish(body.id, true, body.confirmed === true);
          break;
        default:
          res.statusCode = 404;
          res.end();
          return;
      }
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify(result));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: message }));
      // No request bodies, tokens or original image bytes are logged.
      try {
        await appendFile(
          await privatePath(
            service.workspace,
            "artifacts/statistics-imports/local/errors.log",
            true,
          ),
          JSON.stringify({ at: new Date().toISOString(), message }) + "\n",
        );
      } catch {
        /* preserve original response */
      }
    } finally {
      if (acquired) busy = false;
    }
  };
}

export async function startLocalImporter(
  options: { service?: LocalImportService; token?: string } = {},
) {
  if (process.env.NODE_ENV === "production") throw new Error("Importador indisponível em produção");
  const workspace = fileURLToPath(new URL("../../../", import.meta.url));
  const service = options.service ?? new LocalImportService(workspace);
  const token = options.token ?? randomBytes(32).toString("hex");
  const handler = createLocalHandler(service, token);
  const server = await createServer({
    configFile: false,
    root: workspace,
    appType: "custom",
    plugins: [
      react(),
      {
        name: "bolao-local-importer",
        apply: "serve",
        configureServer(vite) {
          vite.middlewares.use((req, res, next) => {
            if (
              req.headers.host !== `127.0.0.1:${LOCAL_PORT}` ||
              req.headers["sec-fetch-site"] === "cross-site"
            ) {
              res.statusCode = 403;
              res.end();
              return;
            }
            if (req.url?.startsWith("/__bolao/api/")) {
              void handler(req, res);
              return;
            }
            if (req.url?.split("?")[0] === "/__bolao/importador") {
              res.setHeader("Cache-Control", "no-store");
              res.setHeader("Referrer-Policy", "no-referrer");
              res.setHeader("X-Frame-Options", "DENY");
              res.setHeader("Content-Type", "text/html; charset=utf-8");
              void vite
                .transformIndexHtml(
                  "/__bolao/importador",
                  '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Importador · Central do Bolão</title></head><body><div id="root"></div><script type="module" src="/src/admin/main.tsx"></script></body></html>',
                )
                .then((html) => res.end(html));
              return;
            }
            next();
          });
        },
      },
    ],
    server: {
      host: "127.0.0.1",
      port: LOCAL_PORT,
      strictPort: true,
      cors: false,
      fs: {
        strict: true,
        allow: [resolve(workspace, "src"), resolve(workspace, "node_modules")],
        deny: ["**/artifacts/**", "**/.git/**", "**/.env*", "**/.aws/**", "**/scripts/**"],
      },
    },
  });
  await server.listen();
  console.log(
    `\nImportador local: ${LOCAL_ORIGIN}/__bolao/importador\nCódigo de sessão (válido por 8 horas): ${token}\nCole o código na interface. Ctrl+C encerra o serviço.\n`,
  );
  return server;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await startLocalImporter();
