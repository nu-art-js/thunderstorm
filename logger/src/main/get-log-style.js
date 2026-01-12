/*
 * @nu-art/logger - Flexible logging infrastructure with multiple output targets
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */
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
export function getLogStyle(...styleObj) {
    let style = '';
    styleObj.forEach(obj => {
        const _arr = Object.keys(obj).map((key) => `${key}: ${obj[key]}`);
        style += _arr.join(';');
        style += ';';
    });
    return style;
}
//# sourceMappingURL=get-log-style.js.map