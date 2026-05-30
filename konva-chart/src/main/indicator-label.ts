/**
 * Vertical position of a horizontal-axis indicator label.
 * `'bottom'` places it at the bottom of the data area (so it does not obscure chart content);
 * anything else (default) places it at the top of the plot.
 *
 * Kept in a runtime-free module (no react-konva imports) so it is unit-testable under node.
 */
export function indicatorLabelY(labelPosition: 'top' | 'bottom' | undefined, padTop: number, plotBottom: number, fontSize: number): number {
	return labelPosition === 'bottom' ? plotBottom - fontSize - 3 : padTop + 2;
}
