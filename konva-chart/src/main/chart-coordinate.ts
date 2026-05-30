import type {AxisConfig, ChartLayer, ChartMarker, ChartPadding} from './types.js';
import type {ResolvedRange} from './chart-range.js';

export type HoverZone = 'plot' | 'left-axis' | 'right-axis' | 'bottom-axis' | 'none';

export type PlotGeometry = {
	pad: ChartPadding;
	plotWidth: number;
	plotHeight: number;
};

export function toCanvasX(value: number, range: ResolvedRange, pad: ChartPadding, plotWidth: number): number {
	return pad.left + ((value - range.min) / (range.max - range.min)) * plotWidth;
}

export function toCanvasY(value: number, range: ResolvedRange, pad: ChartPadding, plotHeight: number): number {
	return pad.top + (1 - (value - range.min) / (range.max - range.min)) * plotHeight;
}

export function getHoverZone(hoverX: number | undefined, hoverY: number | undefined, geo: PlotGeometry): HoverZone {
	if (hoverX === undefined || hoverY === undefined)
		return 'none';

	const {pad, plotWidth, plotHeight} = geo;
	const inPlotX = hoverX >= pad.left && hoverX <= pad.left + plotWidth;
	const inPlotY = hoverY >= pad.top && hoverY <= pad.top + plotHeight;

	if (inPlotX && inPlotY)
		return 'plot';

	if (inPlotY) {
		if (hoverX < pad.left)
			return 'left-axis';

		return 'right-axis';
	}

	if (inPlotX && hoverY > pad.top + plotHeight)
		return 'bottom-axis';

	return 'none';
}

export function collectAxes(layers: ChartLayer[], markers?: ChartMarker[]): { hAxes: AxisConfig[]; vAxes: AxisConfig[] } {
	const hAxes: AxisConfig[] = [];
	const vAxes: AxisConfig[] = [];
	const hKeys = new Map<string, AxisConfig>();
	const vKeys = new Map<string, AxisConfig>();
	const hRefs = new Set<AxisConfig>();
	const vRefs = new Set<AxisConfig>();

	// Dedup keyed axes by their `key`, not by object identity. Multiple layers
	// often reference a fresh AxisConfig instance that is rebuilt every render
	// pass (e.g. the time axis). Deduping by reference treats each instance as a
	// distinct axis, so indicators attached to it render once per instance —
	// leaving stale/duplicated indicator lines after zoom re-renders (#506).
	// Keyless axes keep the original reference-based dedup.
	const addAxis = (axis: AxisConfig, axes: AxisConfig[], keyed: Map<string, AxisConfig>, refs: Set<AxisConfig>): void => {
		if (axis.key !== undefined) {
			if (keyed.has(axis.key))
				return;

			keyed.set(axis.key, axis);
			axes.push(axis);
			return;
		}

		if (refs.has(axis))
			return;

		refs.add(axis);
		axes.push(axis);
	};

	const isKnown = (axis: AxisConfig, keyed: Map<string, AxisConfig>, refs: Set<AxisConfig>): boolean =>
		axis.key !== undefined ? keyed.has(axis.key) : refs.has(axis);

	for (const layer of layers) {
		addAxis(layer.hAxis, hAxes, hKeys, hRefs);
		addAxis(layer.vAxis, vAxes, vKeys, vRefs);
	}

	if (markers) {
		for (const marker of markers) {
			if (isKnown(marker.axis, hKeys, hRefs) || isKnown(marker.axis, vKeys, vRefs))
				continue;

			addAxis(marker.axis, hAxes, hKeys, hRefs);
		}
	}

	return {hAxes, vAxes};
}

// Axis identity used across the render path. Mirrors collectAxes' dedup rule:
// keyed axes are equal when their `key` matches (the same logical axis is often
// rebuilt as a fresh AxisConfig instance every render pass), while keyless axes
// fall back to reference identity. Resolving by reference alone would treat a
// non-canonical same-key instance as a different axis — markers attached to it
// would not render and range aggregation would miss its sibling layers (#527).
export function sameAxis(a: AxisConfig, b: AxisConfig): boolean {
	if (a.key !== undefined || b.key !== undefined)
		return a.key === b.key;

	return a === b;
}

// Select the layers bound to `axis` on the given orientation, matching by key
// when present so layers spread across duplicate same-key instances aggregate
// into one range (mirrors collectAxes). Single source of truth for the layer ↔
// axis association used by every range computation in the chart.
export function layersForAxis(layers: ChartLayer[], axis: AxisConfig, orientation: 'h' | 'v'): ChartLayer[] {
	return layers.filter(layer => sameAxis(orientation === 'h' ? layer.hAxis : layer.vAxis, axis));
}
