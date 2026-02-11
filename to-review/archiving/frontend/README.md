# @nu-art/archiving-frontend

Frontend module for archiving APIs: hard-delete (unique/all) and get document history. Uses `@nu-art/http-client`.

## Deps

- `@nu-art/archiving-shared`, `@nu-art/http-client`, `@nu-art/ts-common`

## Usage

Set `HttpClient.default` or pass `httpClient` to the constructor, then use `ModuleFE_Archiving.vv1.hardDeleteUnique(body)`, `.hardDeleteAll(params)`, `.getDocumentHistory(params)`; call `.executeSync()` to run the request.

## Exports

- `ModuleFE_Archiving`

No `@nu-art/thunderstorm-*` dependency.
