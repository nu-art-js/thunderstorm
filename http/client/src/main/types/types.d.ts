export type { QueryParams, UrlQueryParams } from '@nu-art/api-types';
/**
 * Type for route/query parameters with dynamic value support.
 */
export type RouteParams = {
    [key: string]: string | number | boolean | undefined | (() => string | number);
};
