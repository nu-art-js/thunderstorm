# @nu-art/action-processor-frontend

Frontend module and UI for listing and executing action-processor actions. Uses `@nu-art/http-client` to call the backend. Exports `ModuleFE_ActionProcessor`, `ATS_ActionProcessor` (screen component), and `Dialog_ActionProcessorConfirmation`.

## Deps

- `@nu-art/action-processor-shared` — API defs and types
- `@nu-art/http-client` — HttpClient, createRequest
- `@nu-art/ts-common` — Module
- React

## Usage

Set `HttpClient.default` (or pass an HttpClient to `ModuleFE_ActionProcessor` constructor), then use `ModuleFE_ActionProcessor.vv1.list({}).executeSync()` and `ModuleFE_ActionProcessor.vv1.execute({key}).executeSync()`. Or render `<ATS_ActionProcessor />` for the full list + confirmation dialog UI.

No `@nu-art/thunderstorm-*` dependency.
