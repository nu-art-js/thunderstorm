import * as React from 'react';
import {Stage, Layer, Line, Text, Rect, Circle, Group} from 'react-konva';
import type {AxisConfig, ChartLayer, ChartMarker, ChartPadding, ChartTheme, DataPoint} from './types.js';
import {DefaultChartPadding, DefaultChartTheme} from './types.js';

type Props = {
	layers: ChartLayer[];
	markers?: ChartMarker[];
	width: number;
	height: number;
	onClick?: (h: number) => void;
	onMarkerClick?: (marker: ChartMarker) => void;
	onMarkerHover?: (marker: ChartMarker | undefined) => void;
	theme?: Partial<ChartTheme>;
	padding?: Partial<ChartPadding>;
};

type State = {
	hoverX?: number;
};

type ResolvedRange = { min: number; max: number };

function defaultFormatter(value: number): string {
	return value.toLocaleString();
}

function computeRange(axis: AxisConfig, values: number[]): ResolvedRange {
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

export class Chart extends React.Component<Props, State> {

	state: State = {};

	private get theme(): ChartTheme {
		return {...DefaultChartTheme, ...this.props.theme};
	}

	private computePadding(): ChartPadding {
		const base = {...DefaultChartPadding, ...this.props.padding};
		const axes = this.collectAxes();

		const hasRight = axes.vAxes.some(a => (a.position ?? 'left') === 'right');
		const hasTop = axes.hAxes.some(a => a.position === 'top');

		const maxHFormatters = Math.max(1, ...axes.hAxes.map(a => a.formatters?.length ?? 1));

		return {
			...base,
			right: hasRight ? Math.max(base.right, 60) : base.right,
			top: hasTop ? Math.max(base.top, 40) : base.top,
			bottom: Math.max(base.bottom, 20 + maxHFormatters * 14),
		};
	}

	private collectAxes(): { hAxes: AxisConfig[]; vAxes: AxisConfig[] } {
		const hSet = new Set<AxisConfig>();
		const vSet = new Set<AxisConfig>();

		for (const layer of this.props.layers) {
			hSet.add(layer.hAxis);
			vSet.add(layer.vAxis);
		}

		if (this.props.markers) {
			for (const marker of this.props.markers) {
				if (hSet.has(marker.axis) || vSet.has(marker.axis))
					continue;

				hSet.add(marker.axis);
			}
		}

		return {hAxes: [...hSet], vAxes: [...vSet]};
	}

	private resolveAxisRange(axis: AxisConfig, layers: ChartLayer[], extractor: (pt: DataPoint) => number): ResolvedRange {
		const values: number[] = [];
		for (const layer of layers) {
			for (const pt of layer.data)
				values.push(extractor(pt));
		}

		return computeRange(axis, values);
	}

	private hRangeCache = new Map<AxisConfig, ResolvedRange>();
	private vRangeCache = new Map<AxisConfig, ResolvedRange>();

	private getHRange(axis: AxisConfig): ResolvedRange {
		let cached = this.hRangeCache.get(axis);
		if (cached)
			return cached;

		const layers = this.props.layers.filter(l => l.hAxis === axis);
		cached = this.resolveAxisRange(axis, layers, pt => pt.h);
		this.hRangeCache.set(axis, cached);
		return cached;
	}

	private getVRange(axis: AxisConfig): ResolvedRange {
		let cached = this.vRangeCache.get(axis);
		if (cached)
			return cached;

		const layers = this.props.layers.filter(l => l.vAxis === axis);
		cached = this.resolveAxisRange(axis, layers, pt => pt.v);
		this.vRangeCache.set(axis, cached);
		return cached;
	}

	private toCanvasX(value: number, range: ResolvedRange, pad: ChartPadding): number {
		const plotWidth = this.props.width - pad.left - pad.right;
		return pad.left + ((value - range.min) / (range.max - range.min)) * plotWidth;
	}

	private toCanvasY(value: number, range: ResolvedRange, pad: ChartPadding): number {
		const plotHeight = this.props.height - pad.top - pad.bottom;
		return pad.top + (1 - (value - range.min) / (range.max - range.min)) * plotHeight;
	}

	private readonly onMouseMove = (e: any) => {
		const stage = e.target.getStage();
		if (!stage)
			return;

		const pos = stage.getPointerPosition();
		if (!pos)
			return;

		this.setState({hoverX: pos.x});
	};

	private readonly onMouseLeave = () => {
		this.setState({hoverX: undefined});
	};

	private readonly onStageClick = (e: any) => {
		if (!this.props.onClick)
			return;

		const stage = e.target.getStage();
		if (!stage)
			return;

		const pos = stage.getPointerPosition();
		if (!pos)
			return;

		const pad = this.computePadding();
		const plotWidth = this.props.width - pad.left - pad.right;
		if (pos.x < pad.left || pos.x > pad.left + plotWidth)
			return;

		const {hAxes} = this.collectAxes();
		if (hAxes.length === 0)
			return;

		const hRange = this.getHRange(hAxes[0]);
		const value = hRange.min + ((pos.x - pad.left) / plotWidth) * (hRange.max - hRange.min);
		this.props.onClick(value);
	};

	render() {
		const {width, height, layers} = this.props;
		if (layers.length === 0 || layers.every(l => l.data.length === 0))
			return null;

		this.hRangeCache.clear();
		this.vRangeCache.clear();

		const pad = this.computePadding();
		const plotWidth = width - pad.left - pad.right;
		const plotHeight = height - pad.top - pad.bottom;

		return <Stage width={width} height={height} onMouseMove={this.onMouseMove} onMouseLeave={this.onMouseLeave} onClick={this.onStageClick}>
			<Layer>
				<Rect x={0} y={0} width={width} height={height} fill={this.theme.background}/>
				{this.renderGrid(pad, plotWidth, plotHeight)}
				{this.renderVAxes(pad, plotHeight)}
				{this.renderHAxes(pad, plotWidth, plotHeight)}
				{this.renderLayers(pad)}
				{this.renderMarkers(pad, plotHeight)}
				{this.state.hoverX !== undefined && this.renderCrosshair(pad, plotWidth, plotHeight)}
			</Layer>
		</Stage>;
	}

	private renderGrid(pad: ChartPadding, plotWidth: number, plotHeight: number) {
		const theme = this.theme;
		const lines: React.ReactNode[] = [];
		const steps = 4;

		for (let i = 0; i <= steps; i++) {
			const y = pad.top + (i / steps) * plotHeight;
			lines.push(<Line key={`gy-${i}`} points={[pad.left, y, pad.left + plotWidth, y]} stroke={theme.gridLine} strokeWidth={1}/>);
		}

		return lines;
	}

	private renderVAxes(pad: ChartPadding, plotHeight: number) {
		const theme = this.theme;
		const {vAxes} = this.collectAxes();
		const nodes: React.ReactNode[] = [];
		const steps = 4;

		vAxes.forEach((axis, axisIdx) => {
			const position = axis.position ?? 'left';
			if (position === 'none' || position === 'top' || position === 'bottom')
				return;

			const range = this.getVRange(axis);
			const fmts = axis.formatters ?? [defaultFormatter];

			for (let i = 0; i <= steps; i++) {
				const v = range.max - (i / steps) * (range.max - range.min);
				const y = pad.top + (i / steps) * plotHeight;

				fmts.forEach((fmt, fmtIdx) => {
					if (position === 'left')
						nodes.push(<Text key={`vl-${axisIdx}-${i}-${fmtIdx}`} x={0} y={y - 6} width={pad.left - 5} text={fmt(v)} fontSize={theme.fontSize} fill={theme.axisText} align={'right'}/>);
					else
						nodes.push(<Text key={`vr-${axisIdx}-${i}-${fmtIdx}`} x={pad.left + (this.props.width - pad.left - pad.right) + 5} y={y - 6} width={pad.right - 5} text={fmt(v)} fontSize={theme.fontSize} fill={theme.axisText} align={'left'}/>);
				});
			}
		});

		return nodes;
	}

	private renderHAxes(pad: ChartPadding, plotWidth: number, plotHeight: number) {
		const theme = this.theme;
		const {hAxes} = this.collectAxes();
		const nodes: React.ReactNode[] = [];
		const steps = 5;

		hAxes.forEach((axis, axisIdx) => {
			const position = axis.position ?? 'bottom';
			if (position === 'none' || position === 'left' || position === 'right')
				return;

			const range = this.getHRange(axis);
			const fmts = axis.formatters ?? [defaultFormatter];

			for (let i = 0; i <= steps; i++) {
				const v = range.min + (i / steps) * (range.max - range.min);
				const x = this.toCanvasX(v, range, pad);

				fmts.forEach((fmt, fmtIdx) => {
					const baseY = position === 'bottom'
						? pad.top + plotHeight + 6 + fmtIdx * 14
						: pad.top - 20 - (fmts.length - 1 - fmtIdx) * 14;

					nodes.push(<Text key={`h-${axisIdx}-${i}-${fmtIdx}`} x={x - 25} y={baseY} text={fmt(v)} fontSize={theme.fontSize - 1} fill={theme.axisText} width={50} align={'center'}/>);
				});
			}
		});

		return nodes;
	}

	private renderLayers(pad: ChartPadding) {
		return this.props.layers.map(layer => {
			if (layer.data.length === 0)
				return null;

			const hRange = this.getHRange(layer.hAxis);
			const vRange = this.getVRange(layer.vAxis);

			const flatPoints: number[] = [];
			for (const pt of layer.data) {
				flatPoints.push(this.toCanvasX(pt.h, hRange, pad), this.toCanvasY(pt.v, vRange, pad));
			}

			const lineOpacity = layer.opacity ?? 1;

			if (layer.style === 'area') {
				const plotHeight = this.props.height - pad.top - pad.bottom;
				const areaPoints = [...flatPoints];
				areaPoints.push(flatPoints[flatPoints.length - 2], pad.top + plotHeight);
				areaPoints.push(flatPoints[0], pad.top + plotHeight);

				return <Group key={layer.id}>
					<Line points={areaPoints} fill={layer.color} opacity={lineOpacity * 0.15} closed={true}/>
					<Line points={flatPoints} stroke={layer.color} strokeWidth={this.theme.lineWidth} opacity={lineOpacity} lineCap={'round'} lineJoin={'round'}/>
				</Group>;
			}

			return <Line
				key={layer.id}
				points={flatPoints}
				stroke={layer.color}
				strokeWidth={this.theme.lineWidth}
				lineCap={'round'}
				lineJoin={'round'}
				opacity={lineOpacity}
				dash={layer.style === 'dashed' ? [6, 4] : undefined}
			/>;
		});
	}

	private renderMarkers(pad: ChartPadding, plotHeight: number) {
		const {markers, onMarkerClick, onMarkerHover} = this.props;
		if (!markers || markers.length === 0)
			return null;

		const theme = this.theme;
		const {hAxes} = this.collectAxes();

		return markers.map(marker => {
			const isHorizontal = hAxes.includes(marker.axis);
			if (!isHorizontal)
				return null;

			const hRange = this.getHRange(marker.axis);
			const x = this.toCanvasX(marker.value, hRange, pad);
			if (x < pad.left || x > pad.left + (this.props.width - pad.left - pad.right))
				return null;

			const y = pad.top - 2;

			return <Group key={marker.id}>
				<Line points={[x, pad.top, x, pad.top + plotHeight]} stroke={marker.color} strokeWidth={1} dash={[2, 4]} opacity={0.4}/>
				<Circle
					x={x}
					y={y}
					radius={theme.markerRadius}
					fill={marker.color}
					stroke={'#fff'}
					strokeWidth={1.5}
					shadowColor={'rgba(0,0,0,0.15)'}
					shadowBlur={3}
					shadowOffsetY={1}
					onMouseEnter={() => onMarkerHover?.(marker)}
					onMouseLeave={() => onMarkerHover?.(undefined)}
					onClick={() => onMarkerClick?.(marker)}
					onTap={() => onMarkerClick?.(marker)}
				/>
				<Text x={x - 20} y={y - theme.markerRadius - 14} text={marker.label} fontSize={theme.fontSize - 1} fill={marker.color} width={40} align={'center'} fontStyle={'bold'}/>
			</Group>;
		});
	}

	private renderCrosshair(pad: ChartPadding, plotWidth: number, plotHeight: number) {
		const {hoverX} = this.state;
		if (hoverX === undefined || hoverX < pad.left || hoverX > pad.left + plotWidth)
			return null;

		const theme = this.theme;
		const {hAxes} = this.collectAxes();
		if (hAxes.length === 0)
			return null;

		const primaryHAxis = hAxes[0];
		const hRange = this.getHRange(primaryHAxis);
		const hValue = hRange.min + ((hoverX - pad.left) / plotWidth) * (hRange.max - hRange.min);

		const nodes: React.ReactNode[] = [];
		let crosshairX: number | undefined;

		this.props.layers.forEach((layer, i) => {
			if (layer.data.length === 0)
				return;

			const layerHRange = this.getHRange(layer.hAxis);
			const vRange = this.getVRange(layer.vAxis);
			const closest = this.findClosestPoint(layer.data, hValue);
			if (!closest)
				return;

			const cx = this.toCanvasX(closest.h, layerHRange, pad);
			const cy = this.toCanvasY(closest.v, vRange, pad);

			if (crosshairX === undefined)
				crosshairX = cx;

			const tooltipFmt = layer.vAxis.tooltipFormatter ?? defaultFormatter;

			nodes.push(<Circle key={`dot-${layer.id}`} x={cx} y={cy} radius={4} fill={layer.color}/>);
			nodes.push(<Text key={`tip-${layer.id}`} x={cx + 8} y={cy - 6 + i * 14} text={tooltipFmt(closest.v)} fontSize={theme.fontSize} fill={layer.color} fontStyle={'bold'}/>);
		});

		if (crosshairX === undefined)
			return null;

		nodes.unshift(<Line key={'crosshair'} points={[crosshairX, pad.top, crosshairX, pad.top + plotHeight]} stroke={theme.crosshair} strokeWidth={1} dash={[4, 4]} opacity={0.6}/>);

		const hFmts = primaryHAxis.formatters ?? [defaultFormatter];
		const hTooltipFmt = primaryHAxis.tooltipFormatter;
		if (hTooltipFmt) {
			nodes.push(<Text key={'h-tip'} x={crosshairX - 30} y={pad.top + plotHeight + 6} text={hTooltipFmt(hValue)} fontSize={theme.fontSize - 1} fill={theme.axisText} width={60} align={'center'} fontStyle={'bold'}/>);
		} else {
			hFmts.forEach((fmt, fmtIdx) => {
				nodes.push(<Text key={`h-tip-${fmtIdx}`} x={crosshairX! - 30} y={pad.top + plotHeight + 6 + fmtIdx * 14} text={fmt(hValue)} fontSize={theme.fontSize - 1} fill={theme.axisText} width={60} align={'center'} fontStyle={'bold'}/>);
			});
		}

		return nodes;
	}

	private findClosestPoint(points: DataPoint[], hValue: number): DataPoint | undefined {
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
}
