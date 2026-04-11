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

type DragState = {
	startX: number;
	startY: number;
	shift: boolean;
};

const DragThreshold = 3;

type ZoomFraction = { min: number; max: number };

type State = {
	hoverX?: number;
	hoverY?: number;
	zoom?: ZoomFraction;
	drag?: DragState;
	selectionX?: { start: number; end: number };
};

type ResolvedRange = { min: number; max: number };
type HoverZone = 'plot' | 'left-axis' | 'right-axis' | 'bottom-axis' | 'none';

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
	private readonly containerRef = React.createRef<HTMLDivElement>();

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

	private getHoverZone(pad: ChartPadding, plotWidth: number, plotHeight: number): HoverZone {
		const {hoverX, hoverY} = this.state;
		if (hoverX === undefined || hoverY === undefined)
			return 'none';

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

	private getFullHRange(axis: AxisConfig): ResolvedRange {
		const layers = this.props.layers.filter(l => l.hAxis === axis);
		return this.resolveAxisRange(axis, layers, pt => pt.h);
	}

	private applyZoomFraction(full: ResolvedRange): ResolvedRange {
		const {zoom} = this.state;
		if (!zoom)
			return full;

		const span = full.max - full.min;
		return {min: full.min + zoom.min * span, max: full.min + zoom.max * span};
	}

	private getHRange(axis: AxisConfig): ResolvedRange {
		let cached = this.hRangeCache.get(axis);
		if (cached)
			return cached;

		cached = this.applyZoomFraction(this.getFullHRange(axis));
		this.hRangeCache.set(axis, cached);
		return cached;
	}

	private getVRange(axis: AxisConfig): ResolvedRange {
		let cached = this.vRangeCache.get(axis);
		if (cached)
			return cached;

		const layers = this.props.layers.filter(l => l.vAxis === axis);

		if (this.isZoomed) {
			const values: number[] = [];
			for (const layer of layers) {
				const hRange = this.getHRange(layer.hAxis);
				for (const pt of layer.data) {
					if (pt.h >= hRange.min && pt.h <= hRange.max)
						values.push(pt.v);
				}
			}

			cached = computeRange(axis, values);
		} else {
			cached = this.resolveAxisRange(axis, layers, pt => pt.v);
		}

		this.vRangeCache.set(axis, cached);
		return cached;
	}

	private get isZoomed(): boolean {
		return this.state.zoom != null;
	}

	private toCanvasX(value: number, range: ResolvedRange, pad: ChartPadding): number {
		const plotWidth = this.props.width - pad.left - pad.right;
		return pad.left + ((value - range.min) / (range.max - range.min)) * plotWidth;
	}

	private toCanvasY(value: number, range: ResolvedRange, pad: ChartPadding): number {
		const plotHeight = this.props.height - pad.top - pad.bottom;
		return pad.top + (1 - (value - range.min) / (range.max - range.min)) * plotHeight;
	}

	private getRelativePos(e: React.MouseEvent): { x: number; y: number } | undefined {
		const container = this.containerRef.current;
		if (!container)
			return undefined;

		const rect = container.getBoundingClientRect();
		return {x: e.clientX - rect.left, y: e.clientY - rect.top};
	}

	private readonly onMouseDown = (e: React.MouseEvent) => {
		const pos = this.getRelativePos(e);
		if (!pos)
			return;

		this.setState({
			drag: {startX: pos.x, startY: pos.y, shift: e.shiftKey},
			selectionX: undefined,
		});
	};

	private readonly onMouseMove = (e: React.MouseEvent) => {
		const pos = this.getRelativePos(e);
		if (!pos)
			return;

		const {drag} = this.state;

		if (!drag) {
			this.setState({hoverX: pos.x, hoverY: pos.y});
			return;
		}

		const dx = pos.x - drag.startX;

		if (drag.shift) {
			this.setState({
				selectionX: {start: drag.startX, end: pos.x},
				hoverX: undefined,
			});
			return;
		}

		if (Math.abs(dx) < DragThreshold)
			return;

		const {zoom} = this.state;
		if (!zoom)
			return;

		const pad = this.computePadding();
		const plotWidth = this.props.width - pad.left - pad.right;
		const zoomSpan = zoom.max - zoom.min;
		const fractionDelta = (dx / plotWidth) * zoomSpan;

		this.hRangeCache.clear();
		this.vRangeCache.clear();
		this.setState({
			zoom: {min: zoom.min - fractionDelta, max: zoom.max - fractionDelta},
			drag: {startX: pos.x, startY: pos.y, shift: false},
			hoverX: undefined,
		});
	};

	private readonly onMouseUp = (e: React.MouseEvent) => {
		const {drag} = this.state;
		if (!drag) return;

		const pos = this.getRelativePos(e);
		if (!pos) {
			this.setState({drag: undefined, selectionX: undefined});
			return;
		}

		const dx = Math.abs(pos.x - drag.startX);

		if (drag.shift && dx > DragThreshold) {
			this.applyZoomSelection(drag.startX, pos.x);
			this.setState({drag: undefined, selectionX: undefined});
			return;
		}

		this.setState({drag: undefined, selectionX: undefined});

		if (dx <= DragThreshold)
			this.fireClick(pos.x);
	};

	private readonly onMouseLeave = () => {
		if (this.state.drag)
			this.setState({drag: undefined, selectionX: undefined, hoverX: undefined, hoverY: undefined});
		else
			this.setState({hoverX: undefined, hoverY: undefined});
	};

	private readonly onDblClick = () => {
		if (!this.isZoomed)
			return;

		this.setState({zoom: undefined});
	};

	private applyZoomSelection(startPx: number, endPx: number) {
		const pad = this.computePadding();
		const plotWidth = this.props.width - pad.left - pad.right;
		const leftPx = Math.max(Math.min(startPx, endPx), pad.left);
		const rightPx = Math.min(Math.max(startPx, endPx), pad.left + plotWidth);

		if (rightPx - leftPx < DragThreshold)
			return;

		const leftFrac = (leftPx - pad.left) / plotWidth;
		const rightFrac = (rightPx - pad.left) / plotWidth;

		const current = this.state.zoom ?? {min: 0, max: 1};
		const currentSpan = current.max - current.min;

		this.setState({
			zoom: {
				min: current.min + leftFrac * currentSpan,
				max: current.min + rightFrac * currentSpan,
			},
		});
	}

	private fireClick(px: number) {
		if (!this.props.onClick)
			return;

		const pad = this.computePadding();
		const plotWidth = this.props.width - pad.left - pad.right;
		if (px < pad.left || px > pad.left + plotWidth)
			return;

		const {hAxes} = this.collectAxes();
		if (hAxes.length === 0)
			return;

		const hRange = this.getHRange(hAxes[0]);
		const value = hRange.min + ((px - pad.left) / plotWidth) * (hRange.max - hRange.min);
		this.props.onClick(value);
	}

	private readonly resetZoom = () => {
		this.setState({zoom: undefined});
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
		const cursorStyle = this.state.drag?.shift ? 'col-resize' : (this.isZoomed ? 'grab' : 'crosshair');

		const hoverZone = this.getHoverZone(pad, plotWidth, plotHeight);
		const showCrosshair = !this.state.drag && this.state.hoverX !== undefined;

		return <div
			ref={this.containerRef}
			style={{position: 'relative', width, height, cursor: cursorStyle}}
			onMouseDown={this.onMouseDown}
			onMouseMove={this.onMouseMove}
			onMouseUp={this.onMouseUp}
			onMouseLeave={this.onMouseLeave}
			onDoubleClick={this.onDblClick}
		>
			<Stage width={width} height={height}>
				<Layer>
					<Rect x={0} y={0} width={width} height={height} fill={this.theme.background}/>
					{this.renderGrid(pad, plotWidth, plotHeight)}
					{this.renderBaselines(pad, plotWidth, plotHeight)}
					{this.renderVAxes(pad, plotHeight)}
					{this.renderHAxes(pad, plotWidth, plotHeight)}
					{this.renderLayers(pad)}
					{this.renderMarkers(pad, plotHeight)}
					{this.renderSelectionOverlay(pad, plotHeight)}
					{showCrosshair && hoverZone !== 'none' && this.renderCrosshair(pad, plotWidth, plotHeight)}
					{showCrosshair && hoverZone !== 'plot' && hoverZone !== 'none' && this.renderAxisCrosshair(pad, plotWidth, plotHeight, hoverZone)}
				</Layer>
			</Stage>
			{this.isZoomed && <button
				onClick={this.resetZoom}
				style={{
					position: 'absolute',
					top: 4,
					right: pad.right + 4,
					padding: '2px 8px',
					fontSize: 10,
					background: 'rgba(0,0,0,0.6)',
					color: '#fff',
					border: 'none',
					borderRadius: 3,
					cursor: 'pointer',
				}}
			>Reset Zoom</button>}
		</div>;
	}

	private renderSelectionOverlay(pad: ChartPadding, plotHeight: number) {
		const {selectionX} = this.state;
		if (!selectionX)
			return null;

		const left = Math.max(Math.min(selectionX.start, selectionX.end), pad.left);
		const right = Math.min(Math.max(selectionX.start, selectionX.end), pad.left + (this.props.width - pad.left - (this.computePadding().right)));

		return <Rect
			x={left}
			y={pad.top}
			width={right - left}
			height={plotHeight}
			fill={this.theme.crosshair}
			opacity={0.12}
			listening={false}
		/>;
	}

	private renderGrid(pad: ChartPadding, plotWidth: number, plotHeight: number) {
		const theme = this.theme;
		const lines: React.ReactNode[] = [];
		const steps = 4;

		for (let i = 0; i <= steps; i++) {
			const y = pad.top + (i / steps) * plotHeight;
			lines.push(<Line key={`gy-${i}`} points={[pad.left, y, pad.left + plotWidth, y]} stroke={theme.gridLine} strokeWidth={1} listening={false}/>);
		}

		return lines;
	}

	private getAxisColor(axis: AxisConfig): string {
		const layer = this.props.layers.find(l => l.vAxis === axis || l.hAxis === axis);
		return layer?.color ?? this.theme.axisText;
	}

	private renderBaselines(pad: ChartPadding, plotWidth: number, plotHeight: number) {
		const {hAxes, vAxes} = this.collectAxes();
		const nodes: React.ReactNode[] = [];

		vAxes.forEach((axis, i) => {
			if (axis.baseline == null)
				return;

			const range = this.getVRange(axis);
			if (axis.baseline < range.min || axis.baseline > range.max)
				return;

			const y = this.toCanvasY(axis.baseline, range, pad);
			nodes.push(<Line key={`bl-v-${i}`} points={[pad.left, y, pad.left + plotWidth, y]} stroke={this.getAxisColor(axis)} strokeWidth={1} opacity={0.4} dash={[4, 3]} listening={false}/>);
		});

		hAxes.forEach((axis, i) => {
			if (axis.baseline == null)
				return;

			const range = this.getHRange(axis);
			if (axis.baseline < range.min || axis.baseline > range.max)
				return;

			const x = this.toCanvasX(axis.baseline, range, pad);
			nodes.push(<Line key={`bl-h-${i}`} points={[x, pad.top, x, pad.top + plotHeight]} stroke={this.getAxisColor(axis)} strokeWidth={1} opacity={0.4} dash={[4, 3]} listening={false}/>);
		});

		return nodes;
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
						nodes.push(<Text key={`vl-${axisIdx}-${i}-${fmtIdx}`} x={0} y={y - 6} width={pad.left - 5} text={fmt(v)} fontSize={theme.fontSize} fill={theme.axisText} align={'right'} listening={false}/>);
					else
						nodes.push(<Text key={`vr-${axisIdx}-${i}-${fmtIdx}`} x={pad.left + (this.props.width - pad.left - pad.right) + 5} y={y - 6} width={pad.right - 5} text={fmt(v)} fontSize={theme.fontSize} fill={theme.axisText} align={'left'} listening={false}/>);
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

					nodes.push(<Text key={`h-${axisIdx}-${i}-${fmtIdx}`} x={x - 25} y={baseY} text={fmt(v)} fontSize={theme.fontSize - 1} fill={theme.axisText} width={50} align={'center'} listening={false}/>);
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
				const baselineY = layer.vAxis.baseline != null
					? this.toCanvasY(layer.vAxis.baseline, vRange, pad)
					: pad.top + (this.props.height - pad.top - pad.bottom);

				const areaPoints = [...flatPoints];
				areaPoints.push(flatPoints[flatPoints.length - 2], baselineY);
				areaPoints.push(flatPoints[0], baselineY);

				return <Group key={layer.id} listening={false}>
					<Line points={areaPoints} fill={layer.color} opacity={lineOpacity * 0.15} closed={true} listening={false}/>
					<Line points={flatPoints} stroke={layer.color} strokeWidth={this.theme.lineWidth} opacity={lineOpacity} lineCap={'round'} lineJoin={'round'} listening={false}/>
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
				listening={false}
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
				<Line points={[x, pad.top, x, pad.top + plotHeight]} stroke={marker.color} strokeWidth={1} dash={[2, 4]} opacity={0.4} listening={false}/>
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

	private renderAxisCrosshair(pad: ChartPadding, plotWidth: number, plotHeight: number, zone: HoverZone) {
		const {hoverX, hoverY} = this.state;
		const theme = this.theme;
		const nodes: React.ReactNode[] = [];

		if ((zone === 'left-axis' || zone === 'right-axis') && hoverY !== undefined) {
			const {vAxes} = this.collectAxes();
			const targetPosition = zone === 'left-axis' ? 'left' : 'right';
			const matchingAxes = vAxes.filter(a => (a.position ?? 'left') === targetPosition);

			nodes.push(<Line key={'axis-h-line'} points={[pad.left, hoverY, pad.left + plotWidth, hoverY]} stroke={theme.crosshair} strokeWidth={1} dash={[4, 4]} opacity={0.6} listening={false}/>);

			const tipEntries: { text: string; color: string }[] = [];
			for (const axis of matchingAxes) {
				const range = this.getVRange(axis);
				const value = range.max - ((hoverY - pad.top) / plotHeight) * (range.max - range.min);
				const fmt = axis.tooltipFormatter ?? axis.formatters?.[0] ?? defaultFormatter;
				tipEntries.push({text: fmt(value), color: this.getAxisColor(axis)});
			}

			if (tipEntries.length > 0) {
				const lineH = 14;
				const tipPadH = 4;
				const tipPadW = 6;
				const tipBlockW = 120;
				const tipBlockH = tipEntries.length * lineH + tipPadH * 2;
				const tipX = zone === 'left-axis' ? pad.left + 4 : pad.left + plotWidth - tipBlockW - tipPadW;
				const tipY = Math.max(pad.top, Math.min(pad.top + plotHeight - tipBlockH, hoverY - tipBlockH / 2));

				nodes.push(<Rect key={'axis-tip-bg'} x={tipX - tipPadW} y={tipY - tipPadH} width={tipBlockW} height={tipBlockH} fill={'rgba(255,255,255,0.88)'} cornerRadius={3} listening={false}/>);
				tipEntries.forEach((entry, i) => {
					nodes.push(<Text key={`axis-tip-${i}`} x={tipX} y={tipY + i * lineH} text={entry.text} fontSize={theme.fontSize} fill={entry.color} fontStyle={'bold'} listening={false}/>);
				});
			}
		}

		if (zone === 'bottom-axis' && hoverX !== undefined) {
			const clampedX = Math.max(pad.left, Math.min(pad.left + plotWidth, hoverX));
			nodes.push(<Line key={'axis-v-line'} points={[clampedX, pad.top, clampedX, pad.top + plotHeight]} stroke={theme.crosshair} strokeWidth={1} dash={[4, 4]} opacity={0.6} listening={false}/>);

			const {hAxes} = this.collectAxes();
			if (hAxes.length > 0) {
				const primaryHAxis = hAxes[0];
				const hRange = this.getHRange(primaryHAxis);
				const hValue = hRange.min + ((clampedX - pad.left) / plotWidth) * (hRange.max - hRange.min);
				const hTooltipFmt = primaryHAxis.tooltipFormatter;
				const plotBottom = pad.top + plotHeight;

				if (hTooltipFmt) {
					nodes.push(<Text key={'axis-h-tip'} x={clampedX - 30} y={plotBottom + 6} text={hTooltipFmt(hValue)} fontSize={theme.fontSize - 1} fill={theme.axisText} width={60} align={'center'} fontStyle={'bold'} listening={false}/>);
				} else {
					const hFmts = primaryHAxis.formatters ?? [defaultFormatter];
					hFmts.forEach((fmt, fmtIdx) => {
						nodes.push(<Text key={`axis-h-tip-${fmtIdx}`} x={clampedX - 30} y={plotBottom + 6 + fmtIdx * 14} text={fmt(hValue)} fontSize={theme.fontSize - 1} fill={theme.axisText} width={60} align={'center'} fontStyle={'bold'} listening={false}/>);
					});
				}
			}
		}

		return nodes.length > 0 ? nodes : null;
	}

	private renderCrosshair(pad: ChartPadding, plotWidth: number, plotHeight: number) {
		const {hoverX} = this.state;
		if (hoverX === undefined)
			return null;

		const theme = this.theme;
		const {hAxes} = this.collectAxes();
		if (hAxes.length === 0)
			return null;

		const primaryHAxis = hAxes[0];
		const hRange = this.getHRange(primaryHAxis);
		const hValue = hRange.min + ((hoverX - pad.left) / plotWidth) * (hRange.max - hRange.min);

		const nodes: React.ReactNode[] = [];
		const plotBottom = pad.top + plotHeight;
		const plotMidY = pad.top + plotHeight / 2;

		type TipEntry = { text: string; color: string };
		const tipEntries: TipEntry[] = [];

		this.props.layers.forEach((layer) => {
			if (layer.data.length === 0)
				return;

			const layerHRange = this.getHRange(layer.hAxis);
			const vRange = this.getVRange(layer.vAxis);
			const closest = this.findClosestPoint(layer.data, hValue);
			if (!closest)
				return;

			const cx = this.toCanvasX(closest.h, layerHRange, pad);
			const rawCy = this.toCanvasY(closest.v, vRange, pad);
			const cy = Math.max(pad.top, Math.min(plotBottom, rawCy));

			const tooltipFmt = layer.vAxis.tooltipFormatter ?? defaultFormatter;
			nodes.push(<Circle key={`dot-${layer.id}`} x={cx} y={cy} radius={4} fill={layer.color} listening={false}/>);
			tipEntries.push({text: tooltipFmt(closest.v), color: layer.color});
		});

		if (tipEntries.length === 0)
			return null;

		const crosshairX = hoverX;
		nodes.unshift(<Line key={'crosshair'} points={[crosshairX, pad.top, crosshairX, plotBottom]} stroke={theme.crosshair} strokeWidth={1} dash={[4, 4]} opacity={0.6} listening={false}/>);

		const lineH = 14;
		const tipPadH = 4;
		const tipPadW = 6;
		const tipBlockW = 120;
		const tipBlockH = tipEntries.length * lineH + tipPadH * 2;
		const mouseInTopHalf = (this.state.hoverY ?? 0) < plotMidY;
		const tipY = mouseInTopHalf ? plotBottom - tipBlockH - 4 : pad.top + 4;

		const spaceOnRight = pad.left + plotWidth - crosshairX;
		const showOnLeft = spaceOnRight < tipBlockW + 16;
		const tipX = showOnLeft ? crosshairX - tipBlockW - tipPadW - 8 : crosshairX + 8;

		nodes.push(<Rect
			key={'tip-bg'}
			x={tipX - tipPadW}
			y={tipY - tipPadH}
			width={tipBlockW}
			height={tipBlockH}
			fill={'rgba(255,255,255,0.88)'}
			cornerRadius={3}
			listening={false}
		/>);

		tipEntries.forEach((entry, i) => {
			nodes.push(<Text
				key={`tip-${i}`}
				x={tipX}
				y={tipY + i * lineH}
				text={entry.text}
				fontSize={theme.fontSize}
				fill={entry.color}
				fontStyle={'bold'}
				listening={false}
			/>);
		});

		const hFmts = primaryHAxis.formatters ?? [defaultFormatter];
		const hTooltipFmt = primaryHAxis.tooltipFormatter;
		if (hTooltipFmt) {
			nodes.push(<Text key={'h-tip'} x={crosshairX - 30} y={plotBottom + 6} text={hTooltipFmt(hValue)} fontSize={theme.fontSize - 1} fill={theme.axisText} width={60} align={'center'} fontStyle={'bold'} listening={false}/>);
		} else {
			hFmts.forEach((fmt, fmtIdx) => {
				nodes.push(<Text key={`h-tip-${fmtIdx}`} x={crosshairX! - 30} y={plotBottom + 6 + fmtIdx * 14} text={fmt(hValue)} fontSize={theme.fontSize - 1} fill={theme.axisText} width={60} align={'center'} fontStyle={'bold'} listening={false}/>);
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
