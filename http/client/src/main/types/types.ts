/*
 * @nu-art/http-client - Type-safe HTTP client for Thunderstorm
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

export type {QueryParams, UrlQueryParams} from '@nu-art/api-types';

/**
 * Type for route/query parameters with dynamic value support.
 */
export type RouteParams = { [key: string]: string | number | boolean | undefined | (() => string | number) };
