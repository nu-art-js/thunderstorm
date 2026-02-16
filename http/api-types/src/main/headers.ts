/*
 * @nu-art/api-types - Shared API and error types for HTTP client and server
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

// --- Request headers (standard HTTP) ---
export const HeaderKey_Origin = 'Origin';
export const HeaderKey_Authorization = 'Authorization';
export const HeaderKey_ContentType = 'Content-Type';
export const HeaderKey_Accept = 'Accept';
export const HeaderKey_AcceptEncoding = 'Accept-Encoding';
export const HeaderKey_AcceptLanguage = 'Accept-Language';
export const HeaderKey_ContentEncoding = 'Content-Encoding';
export const HeaderKey_ContentLength = 'Content-Length';
export const HeaderKey_UserAgent = 'User-Agent';
export const HeaderKey_CacheControl = 'Cache-Control';
export const HeaderKey_IfNoneMatch = 'If-None-Match';
export const HeaderKey_IfModifiedSince = 'If-Modified-Since';
export const HeaderKey_Referer = 'Referer';
export const HeaderKey_XRequestedWith = 'X-Requested-With';
export const HeaderKey_Cookie = 'Cookie';

// --- Response-only headers (use HeaderKey_* for headers used in both request and response) ---
export const ResponseHeaderKey_ETag = 'ETag';
export const ResponseHeaderKey_Location = 'Location';
export const ResponseHeaderKey_SetCookie = 'Set-Cookie';
/** Custom header for JWT / session token in responses. */
export const ResponseHeaderKey_JWTToken = 'X-Auth-Token';
