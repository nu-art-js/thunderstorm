# @nu-art/http-e2e-tests

Private package for **end-to-end tests** of the HTTP stack: real `HttpServer` bound to a port and `HttpClient` / `ApiCaller` calling it over the network. Not published; used only within the monorepo.

- **Run:** `bai -t -tt=pure -up=http-e2e-tests`
- **Scope:** Contract (GET/DELETE/POST/PUT/PATCH, 204), errors (4xx/5xx, HttpException), client config (timeout, headers, base URL, ApiCaller vs HttpRequest), server behaviour (redirect, stream, large body), edge cases (query params, Unicode, connection refused).
