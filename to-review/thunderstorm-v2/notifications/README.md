# @nu-art/thunder-notifications

Thunder notifications module and UI component. Provides `ModuleFE_Notifications`, `TS_Notifications`, and `genericNotificationAction` for showing and managing in-app notifications.

## Usage

```ts
import { ModuleFE_Notifications, TS_Notifications, genericNotificationAction } from '@nu-art/thunder-notifications';
```

- **ModuleFE_Notifications** — Singleton module: create/show/hide notifications, persist in storage.
- **TS_Notifications** — React component implementing `NotificationListener`; mount once in the app to render the notification stack.
- **genericNotificationAction** — Helper to run an async action with a notification (in-progress / success / failed).

## Dependencies

- `@nu-art/thunder-core` — StorageKey, ThunderDispatcher, Module, _className, stopPropagation
- `@nu-art/ts-common` — formatTimestamp, Second, StaticLogger, etc.
- `react` / `react-dom`

This package does **not** depend on `@nu-art/thunder-widgets`; the UI uses plain React and SCSS.

## Build

From repo root: `bai -up=thunder-notifications` (BAI install/prepare populates dependencies).
