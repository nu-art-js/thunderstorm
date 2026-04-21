import type {AxisConfig, ChartLayer, DataPoint} from './types.js';

export type ResolvedRange = { min: number; max: number };
export type ZoomFraction = { min: number; max: number };

export function computeRange(axis: AxisConfig, values: number[]): ResolvedRange {
	let min = Infinity;
	let max = -Infinity;
	for (const v of values) {
		if (v < min) min = v;
		if (v > max) max = v;
	}

	if (!isFinite(min)) {
		min = 0;
		max = 1;
	}

	const pinMin = axis.range?.[0];
	const pinMax = axis.range?.[1];

	if (pinMin != null) min = pinMin;
	if (pinMax != null) max = pinMax;

	if (min === max)
		max = min + 1;

	const range = max - min;
	const margin = range * 0.05;
	if (pinMin == null) min -= margin;
	if (pinMax == null) max += margin;

	return {min, max};
}

export function resolveAxisRange(axis: AxisConfig, layers: ChartLayer[], extractor: (pt: DataPoint) => number): ResolvedRange {
	const values: number[] = [];
	for (const layer of layers) {
		for (const pt of layer.data)
			values.push(extractor(pt));
	}

	return computeRange(axis, values);
}

export function applyZoomFraction(full: ResolvedRange, zoom: ZoomFraction | undefined): ResolvedRange {
	if (!zoom)
		return full;

	const span = full.max - full.min;
	return {min: full.min + zoom.min * span, max: full.min + zoom.max * span};
}

export type ChartViewport = { min: number; max: number };
export type ChartViewportMap = Record<string, ChartViewport>;

export function viewportToZoom(full: ResolvedRange, viewport: ChartViewport): ZoomFraction {
	const span = full.max - full.min;
	if (span === 0)
		return {min: 0, max: 1};

	return {min: (viewport.min - full.min) / span, max: (viewport.max - full.min) / span};
}

export function zoomToViewport(full: ResolvedRange, zoom: ZoomFraction): ChartViewport {
	const span = full.max - full.min;
	return {min: full.min + zoom.min * span, max: full.min + zoom.max * span};
}

export function findClosestPoint(points: DataPoint[], hValue: number): DataPoint | undefined {
	if (points.length === 0)
		return undefined;

	let lo = 0;
	let hi = points.length - 1;
	while (lo < hi) {
		const mid = (lo + hi) >> 1;
		if (points[mid].h < hValue)
			lo = mid + 1;
		else
			hi = mid;
	}

	if (lo === 0)
		return points[0];

	const prev = points[lo - 1];
	const curr = points[lo];
	return Math.abs(prev.h - hValue) <= Math.abs(curr.h - hValue) ? prev : curr;
}
