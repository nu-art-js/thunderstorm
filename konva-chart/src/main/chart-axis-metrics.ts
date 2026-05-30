import type {AxisConfig} from './types.js';
import type {ResolvedRange} from './chart-range.js';

// Default minimum width (px) of a vertical-axis label column. The column grows
// beyond this only when the widest formatted tick label would not otherwise
// fit — charts whose labels already fit keep their previous layout untouched.
export const DefaultAxisColumnWidth = 55;

// Approximate rendered width (px) of a single character at the axis font size.
// Mirrors the char-count heuristic already used for tooltip sizing in
// chart-crosshair (`text.length * 6.5`), so the codebase keeps one convention
// for estimating Konva text width without a canvas measuring context.
const CharWidthPx = 6.5;

// Horizontal breathing room (px) reserved around the widest label inside a
// column — the gap between the label and the plot / neighbouring column.
const ColumnLabelPaddingPx = 10;

// Vertical-axis tick labels are sampled at this many evenly spaced steps
// (inclusive of both ends). Single source of truth shared by column-width
// measurement (here) and tick rendering (renderVAxes), so the two never drift.
export const VAxisLabelSteps = 4;

export function defaultAxisFormatter(value: number): string {
	return value.toLocaleString();
}

// The numeric values labelled along a vertical axis, from max (top) to min
// (bottom) — mirrors the tick layout used when rendering the axis.
export function vAxisTickValues(range: ResolvedRange, steps: number = VAxisLabelSteps): number[] {
	const values: number[] = [];
	for (let i = 0; i <= steps; i++)
		values.push(range.max - (i / steps) * (range.max - range.min));

	return values;
}

export function estimateLabelWidth(label: string): number {
	return label.length * CharWidthPx;
}

// Width (px) of the vertical-axis label column, sized to fit the widest
// formatted tick label across every rendered vertical axis. Negative values
// widen the formatted string (the minus sign is part of it), so they are
// accounted for automatically — fixing the clipped/misaligned axis labels that
// a fixed-width column produced. Never returns less than `minWidth`, so axes
// whose labels already fit are left exactly as before.
export function computeVAxisColumnWidth(
	vAxes: AxisConfig[],
	getVRange: (axis: AxisConfig) => ResolvedRange,
	minWidth: number = DefaultAxisColumnWidth,
): number {
	let widest = 0;

	for (const axis of vAxes) {
		const position = axis.position ?? 'left';
		if (position === 'none' || position === 'top' || position === 'bottom')
			continue;

		const range = getVRange(axis);
		const formatters = axis.formatters ?? [defaultAxisFormatter];

		for (const value of vAxisTickValues(range))
			for (const formatter of formatters)
				widest = Math.max(widest, estimateLabelWidth(formatter(value)));
	}

	return Math.max(minWidth, Math.ceil(widest) + ColumnLabelPaddingPx);
}
