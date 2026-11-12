import { timingSafeEqual } from "node:crypto";
import type { IncomingMessage } from "node:http";
export const LOCAL_PORT = 5179;
export const LOCAL_ORIGIN = `http://127.0.0.1:${LOCAL_PORT}`;
export function authorizeLocalRequest(
  req: Pick<IncomingMessage, "headers" | "socket">,
  token: string,
  expires: number,
  now = Date.now(),
) {
  if (now > expires) throw new Error("Sessão expirada. Reinicie o importador.");
  if (req.socket.remoteAddress !== "127.0.0.1" && req.socket.remoteAddress !== "::ffff:127.0.0.1")
    throw new Error("Somente loopback");
  if (
    req.headers.host !== `127.0.0.1:${LOCAL_PORT}` ||
    req.headers.origin !== LOCAL_ORIGIN ||
    req.headers["sec-fetch-site"] === "cross-site"
  )
    throw new Error("Origem não autorizada");
  const received = Buffer.from(String(req.headers.authorization ?? ""));
  const expected = Buffer.from("Bearer " + token);
  if (received.length !== expected.length || !timingSafeEqual(received, expected))
    throw new Error("Código de sessão inválido");
}
