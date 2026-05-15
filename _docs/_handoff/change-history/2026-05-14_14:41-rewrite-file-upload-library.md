# 2026-05-14 14:41 — Rewrite file-upload library with pluggable storage and synchronous flow
- **Author:** tacb0ss
- **Packages touched:** file-upload/shared, file-upload/backend, file-upload/frontend, app-backend, app-frontend
- **Concepts / docs:** StorageAdapter interface, synchronous confirm-upload flow, single-collection lifecycle

## What changed

Full rewrite of `_thunderstorm/file-upload` library. The old implementation was tightly coupled to Firebase (bucket listeners, PushPubSub notifications, Firestore temp documents). The new design is:

- **Pluggable storage:** `StorageAdapter` interface in shared, `StorageAdapter_GCS` implementation in backend wrapping Firebase Storage. Other adapters (S3, local) can be added without changing the module.
- **Synchronous flow:** Client calls `requestUpload` (gets signed URL + pending asset), PUTs file to storage, then calls `confirmUpload`. Backend validates synchronously during confirm — no bucket triggers, no push notifications, no polling.
- **Single collection:** Replaced 3 collections (assets, assets-temp, assets-deleted) with one `assets` collection using `status: pending | validated | failed`.
- **Preserved validation:** Per-key validator registration (`registerValidator`) with size, MIME type, and custom validator support. File type detection via `file-type` library with extension correction.

## Deleted modules
- `ModuleBE_BucketListener`, `ModuleBE_AssetsTemp`, `ModuleBE_AssetsDeleted`, `ModuleBE_AssetsStorage`, `ModuleBE_AssetsDB`, `ModuleBE_AssetsAPI`, `ModuleBE_AssetUploader`
- `ModuleFE_AssetUploader`, `ModuleBase_AssetUploader`
- `ATS_FileUploader` UI component

## New modules
- `ModuleBE_FileUpload` (backend — extends ModuleBE_BaseDB, API handlers, validation pipeline)
- `StorageAdapter_GCS` (backend — wraps Firebase Storage)
- `ModuleFE_FileUpload` (frontend — orchestrates upload flow with progress tracking)
- `ModuleFE_Assets` (frontend — CRUD sync, simplified)

## Dependency reduction
- Shared: removed firebase-shared, push-pub-sub-shared, user-account-shared, google-cloud/*, react, jszip, firebase, express, file-type
- Backend: removed push-pub-sub-backend, user-account-backend, firebase-functions, jszip, react
- Frontend: removed push-pub-sub-frontend, firebase-frontend, user-account-frontend, thunder-widgets, thunder-ui-modules, ts-styles, google-cloud/*, jszip, firebase, express
