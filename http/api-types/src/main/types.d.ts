/**
 * Type for route/query parameters with dynamic value support.
 */
export type RouteParams = {
    [key: string]: string | number | boolean | undefined | (() => string | number);
};
/**
 * Static query parameters type (no functions).
 */
export type QueryParams = {
    [key: string]: string | number | boolean | undefined;
};
/**
 * URL query parameters with string values only.
 */
export type UrlQueryParams = {
    [key: string]: string | undefined;
};
