/*
 * @nu-art/http-client - Type-safe HTTP client for Thunderstorm
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

/**
 * Type for route/query parameters with dynamic value support.
 *
 * Supports static values (string, number, boolean) or functions that return values.
 * Functions are evaluated when composing the query string, allowing dynamic
 * parameter generation (e.g., timestamps, IDs).
 */
export type RouteParams = { [key: string]: string | number | boolean | undefined | (() => string | number) }

/**
 * Static query parameters type (no functions).
 * 
 * Used for API type definitions where parameters are known at compile time.
 */
export type QueryParams = { [key: string]: string | number | boolean | undefined; };

/**
 * URL query parameters with string values only.
 * 
 * Used for URL composition where all values must be strings.
 */
export type UrlQueryParams = { [key: string]: string | undefined; };
