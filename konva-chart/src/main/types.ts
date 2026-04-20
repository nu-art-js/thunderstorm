export type DataPoint = {
	h: number;
	v: number;
};

export type AxisPosition = 'left' | 'right' | 'top' | 'bottom' | 'none';

export type AxisConfig = {
	range?: [number | undefined, number | undefined];
	formatters?: ((value: number) => string)[];
	tooltipFormatter?: (value: number) => string;
	position?: AxisPosition;
	baseline?: number;
};

export type ChartLayerStyle = 'line' | 'dashed' | 'area';

export type ChartLayer = {
	id: string;
	data: DataPoint[];
	hAxis: AxisConfig;
	vAxis: AxisConfig;
	color: string;
	label: string;
	style: ChartLayerStyle;
	opacity?: number;
	lineWidth?: number;
};

export type ChartMarker = {
	id: string;
	value: number;
	axis: AxisConfig;
	label: string;
	color: string;
};

export type ChartPadding = {
	top: number;
	right: number;
	bottom: number;
	left: number;
};

export type ChartTheme = {
	background: string;
	gridLine: string;
	axisText: string;
	crosshair: string;
	lineWidth: number;
	markerRadius: number;
	fontSize: number;
};

export const DefaultChartTheme: ChartTheme = {
	background: '#fafafa',
	gridLine: '#E5E5E3',
	axisText: '#6B6B6B',
	crosshair: '#5B5BD6',
	lineWidth: 2,
	markerRadius: 5,
	fontSize: 10,
};

export const DefaultChartPadding: ChartPadding = {
	top: 20,
	right: 20,
	bottom: 50,
	left: 60,
};
