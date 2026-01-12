/**
 * CSS style properties for console.log() styling.
 *
 * Used with the `%c` format specifier in console.log() to apply CSS styles.
 */
export type LogStyle = {
    'color'?: string;
    'background-color'?: string;
    'padding'?: string;
    'border-radius'?: string;
};
/**
 * Generates a CSS style string for console.log() formatting.
 *
 * Combines multiple style objects into a single CSS string compatible with
 * the `%c` format specifier in console.log().
 *
 * **Usage**:
 * ```typescript
 * const style = getLogStyle({color: 'red', 'background-color': 'yellow'});
 * console.log('%cStyled text', style, 'normal text');
 * ```
 *
 * @param styleObj - One or more style objects (merged together)
 * @returns CSS style string
 */
export declare function getLogStyle(...styleObj: LogStyle[]): string;
