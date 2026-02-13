/**
 * Builds a single className string from multiple class tokens.
 * Falsy values are omitted; truthy strings are joined with spaces.
 */
export declare function _className(...classes: (string | boolean | undefined)[]): string;
