import type {AxisConfig, ChartLayer, ChartMarker, ChartPadding, ChartTheme} from './types.js';
import type {ResolvedRange} from './chart-range.js';

export type ChartRenderContext = {
	width: number;
	height: number;
	pad: ChartPadding;
	plotWidth: number;
	plotHeight: number;
	theme: ChartTheme;
	layers: ChartLayer[];
	markers: ChartMarker[];
	hAxes: AxisConfig[];
	vAxes: AxisConfig[];
	axisColumnWidth: number;
	getHRange: (axis: AxisConfig) => ResolvedRange;
	getVRange: (axis: AxisConfig) => ResolvedRange;
	getAxisColor: (axis: AxisConfig) => string;
};
