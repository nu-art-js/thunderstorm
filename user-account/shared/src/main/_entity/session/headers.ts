/*
 * @nu-art/user-account-shared - HTTP header names for auth and session
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

/** Header name for Authorization (Bearer token / session id). */
export const HeaderKey_Authorization = 'Authorization';
/** Response header name for JWT token returned on login/refresh. */
export const ResponseHeaderKey_JWTToken = 'X-Auth-Token';
export const HeaderKey_DeviceId = 'device-id';
export const HeaderKey_TabId = 'tab-id';
export const HeaderKey_Origin = 'Origin';
