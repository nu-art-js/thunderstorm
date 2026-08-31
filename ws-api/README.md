# ws-api

Typed WebSocket spine for Thunderstorm — parallel to `http` / `db-api`.

| Package | Purpose |
|---------|---------|
| `@nu-art/ws-api-shared` | Envelope types + encode/parse helpers |
| `@nu-art/ws-api-backend` | Attach to `HttpServer`, auth hook, typed handlers |

## Product split (locked)

- **HTTP:** auth, signed URLs, bootstrap
- **WS:** all play / realtime after auth
- Rooms / presence: **not** in v0

## When

Use this when an app needs a first-class WS channel on the same Node server as `HttpServer`, with typed `{ type }` messages and injectable connection auth — not a one-off WS server inside an app repo.

## Do

1. Define app message types as `WsEnvelope<'my.type', Payload>` in shared (or app-shared).
2. Register handlers with `ModuleBE_WsApi.registerHandler('my.type', handler)`.
3. Inject auth via `setAuthenticator` (query token, header, JWT, session — app-owned).
4. After `HttpServer.init()` + routes, call `ModuleBE_WsApi.attach(httpServer)` then `httpServer.startServer()` (or attach anytime after `getServer()` exists; before or after listen is fine with `ws`).
5. Keep HTTP routes for bootstrap/auth; put realtime play on WS.

## Don't

- Don't put permanent game/play WS contracts only in an app backend — extend shared types + register handlers.
- Don't use socket.io / Photon / Mirror for this path — Node `ws` on `/ws` is enough.
- Don't break existing HTTP routes; upgrade is path-scoped (`/ws` by default).
- Don't require Vite or a separate WS port for the spine.

## Envelope

```ts
{ type: string; id?: string; payload?: unknown }
```

- `type` — router key (app + builtins: `ping`, `pong`, `echo`, `ack`, `error`)
- `id` — optional correlation id (request → ack/error)
- `payload` — message body

Builtins: `ping` → `pong`; `echo` → echo + `ack`.

## Auth

```ts
ModuleBE_WsApi.setAuthenticator(async ({ req, url }) => {
  const token = url.searchParams.get('token');
  if (!token) return false; // reject upgrade
  return { accountId: '…', data: { /* opaque */ } };
});
```

No authenticator → connections allowed with empty auth (tests / open labs only).

## Register a handler

```ts
import { ModuleBE_WsApi } from '@nu-art/ws-api-backend';
import type { WsEnvelope } from '@nu-art/ws-api-shared';

ModuleBE_WsApi.registerHandler('play.intent', async (msg, ctx) => {
  // ctx.auth.accountId, ctx.send, ctx.close
  ctx.send({ type: 'ack', id: msg.id, payload: { ok: true, forType: msg.type, forId: msg.id } });
});
```

## Attach

```ts
const http = new HttpServer({ tag: 'app', port: 8080, baseUrl: '', cors: { headers: [], responseHeaders: [] } });
http.init();
ModuleBE_WsApi.attach(http); // path default /ws
await http.startServer();
```

Client: `new WebSocket('ws://localhost:8080/ws?token=…')` then send JSON envelopes.

## PTW next

1. Depend on `@nu-art/ws-api-shared` + `@nu-art/ws-api-backend` in PTW backend.
2. Authenticator: validate session/JWT from HTTP auth bootstrap (do not invent a second auth stack).
3. Register play intent handlers in PTW modules; shared play types live in PTW app-shared (or later a play lib), not forked inside Thunderstorm.
4. Unity / hosts open WS after HTTP auth; HTTP keeps signed URLs + bootstrap only.
