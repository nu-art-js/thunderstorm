# 2026-06-06 00:54 — BAI CLI rule: Docker required for local emulation only
- **Author:** tacb0ss
- **Packages touched:** .rules/operational (bai-cli)
- **Concepts / docs:** bai-cli — added a "Docker requirement (local emulation only)" section. Docker is required only for local backend launch (`-l`), which starts a local MongoDB replica-set container (`mongo:7 --replSet rs0`) plus Firebase emulators. Build/deploy run in the cloud (Cloud Build → Artifact Registry → Cloud Run) and never need a local Docker daemon.
