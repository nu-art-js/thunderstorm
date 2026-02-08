# @nu-art/action-processor-backend

Backend module for registering and executing refactoring/setup actions over HTTP. Registers routes with `@nu-art/http-server` (ApiHandler). Includes PerformProjectSetup contract and setup-project action.

## Deps

- `@nu-art/action-processor-shared` — API defs and types
- `@nu-art/http-server` — ApiHandler, HttpServer
- `@nu-art/ts-common` — Module, Logger, ApiException, Dispatcher

## Usage

Wire the module into your backend so the singleton is created (e.g. import `ModuleBE_ActionProcessor`). Ensure `HttpServer.getDefault()` is used so routes are registered. Register additional actions via `ModuleBE_ActionProcessor.registerAction(declaration, logger)`.

No `@nu-art/thunderstorm-*` dependency.
