# 2026-06-27 11:57 — extractSubdomain requires explicit base host
- **Author:** tacb0ss
- **Packages touched:** @nu-art/ts-common
- **Concepts / docs:** url-tools, multi-tenant subdomain parsing

## Why

`extractSubdomain(origin)` treated only the last DNS label as the registrable domain. That works for single-label roots like `localhost` (`acme.localhost` → `acme`) but breaks multi-label public suffixes such as `beamz.dev`: `beta.beamz.dev` was parsed as subdomain `beta.beamz` instead of tenant id `beta`. Any consuming project routing tenants on `*.beamz.dev` (or similar two-label roots) needs to strip a **known** base host, not infer TLD from the last label. A full Public Suffix List dependency is unnecessary for our deployments; callers already know their portal root (`localhost`, `beamz.dev`, etc.).

The signature change is intentional: generic infra cannot guess registrable domain depth. Callers pass `baseHost`; the function returns everything to the left of `.${baseHost}` or `undefined` when the hostname is the base, an IPv4 literal, or does not match the suffix.

## What changed

- `ts-common/src/main/utils/url-tools.ts` — `extractSubdomain(origin, baseHost)`; IPv4 hostnames return `undefined`.
- `ts-common/src/test/url-tools/extract-subdomain.test.ts` — unit tests for single/multi-label roots, nested subdomains, bare root, localhost, IPv4, mismatch, invalid URL.

## For consumers

Update call sites to pass the deployment base host. Beamz adds `deriveTenantBaseHost` / `extractTenantSubdomain` in `@app/organization-shared` as the product SSOT.
