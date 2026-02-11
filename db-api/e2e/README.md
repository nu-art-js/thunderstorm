# @nu-art/db-api-e2e-tests

Private package for **end-to-end tests** of the db-api CRUD stack: real `HttpServer` with `ModuleBE_BaseApi` (and mocked `ModuleBE_BaseDB`) bound to a port, and `HttpClient` calling it over the network. Not published; used only within the monorepo.

- **Run:** `bai -t -tt=pure -up=db-api-e2e-tests`
- **Scope:** CRUD API over HTTP (query, queryUnique, upsert, upsertAll, deleteUnique, deleteQuery, deleteAll), error responses (400, 404), round-trip.
