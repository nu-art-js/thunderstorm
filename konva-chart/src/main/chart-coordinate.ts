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
	const hSet = new Set<AxisConfig>();
	const vSet = new Set<AxisConfig>();

	for (const layer of layers) {
		hSet.add(layer.hAxis);
		vSet.add(layer.vAxis);
	}

	if (markers) {
		for (const marker of markers) {
			if (hSet.has(marker.axis) || vSet.has(marker.axis))
				continue;

			hSet.add(marker.axis);
		}
	}

	return {hAxes: [...hSet], vAxes: [...vSet]};
}
