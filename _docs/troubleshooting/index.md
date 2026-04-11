# Troubleshooting Index






| Symptom                                                                                        | Cause                                                                    | Remedy                                                                       |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `404` on `/v1/{dbKey}/query` (or other CRUD routes) while `ModuleBE_*DB` is in the module pack | Missing `createApisForDBModule` — DB module doesn't register HTTP routes | [crud-route-404-missing-api-module.md](crud-route-404-missing-api-module.md) |
