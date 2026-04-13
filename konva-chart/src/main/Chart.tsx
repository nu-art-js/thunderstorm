import * as React from 'react';
import {Stage, Layer, Rect} from 'react-konva';
import type {AxisConfig, ChartLayer, ChartMarker, ChartPadding, ChartTheme} from './types.js';
import {DefaultChartPadding, DefaultChartTheme} from './types.js';
import {computeRange, resolveAxisRange, applyZoomFraction} from './chart-range.js';
import type {ResolvedRange, ZoomFraction} from './chart-range.js';
import {collectAxes, getHoverZone} from './chart-coordinate.js';
import type {ChartRenderContext} from './chart-render-context.js';
import {renderGrid, renderBaselines, renderVAxes, renderHAxes} from './chart-axes.js';
import {renderLayers, renderMarkers} from './chart-layers.js';
import {renderCrosshair, renderAxisCrosshair} from './chart-crosshair.js';

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

type State = {
	hoverX?: number;
	hoverY?: number;
	zoom?: ZoomFraction;
	drag?: DragState;
	selectionX?: { start: number; end: number };
};

export class Chart extends React.Component<Props, State> {

	state: State = {};
	private readonly containerRef = React.createRef<HTMLDivElement>();
	private hRangeCache = new Map<AxisConfig, ResolvedRange>();
	private vRangeCache = new Map<AxisConfig, ResolvedRange>();

	private get theme(): ChartTheme {
		return {...DefaultChartTheme, ...this.props.theme};
	}

	private get isZoomed(): boolean {
		return this.state.zoom != null;
	}

	private computePadding(): ChartPadding {
		const base = {...DefaultChartPadding, ...this.props.padding};
		const axes = collectAxes(this.props.layers, this.props.markers);

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

	private readonly getHRange = (axis: AxisConfig): ResolvedRange => {
		let cached = this.hRangeCache.get(axis);
		if (cached)
			return cached;

		const layers = this.props.layers.filter(l => l.hAxis === axis);
		const full = resolveAxisRange(axis, layers, pt => pt.h);
		cached = applyZoomFraction(full, this.state.zoom);
		this.hRangeCache.set(axis, cached);
		return cached;
	};

	private readonly getVRange = (axis: AxisConfig): ResolvedRange => {
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
			cached = resolveAxisRange(axis, layers, pt => pt.v);
		}

		this.vRangeCache.set(axis, cached);
		return cached;
	};

	private readonly getAxisColor = (axis: AxisConfig): string => {
		const layer = this.props.layers.find(l => l.vAxis === axis || l.hAxis === axis);
		return layer?.color ?? this.theme.axisText;
	};

	private buildRenderContext(pad: ChartPadding, plotWidth: number, plotHeight: number): ChartRenderContext {
		const {hAxes, vAxes} = collectAxes(this.props.layers, this.props.markers);
		return {
			width: this.props.width,
			height: this.props.height,
			pad,
			plotWidth,
			plotHeight,
			theme: this.theme,
			layers: this.props.layers,
			markers: this.props.markers ?? [],
			hAxes,
			vAxes,
			getHRange: this.getHRange,
			getVRange: this.getVRange,
			getAxisColor: this.getAxisColor,
		};
	}

	// --- Interaction handlers ---

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

		const {hAxes} = collectAxes(this.props.layers, this.props.markers);
		if (hAxes.length === 0)
			return;

		const hRange = this.getHRange(hAxes[0]);
		const value = hRange.min + ((px - pad.left) / plotWidth) * (hRange.max - hRange.min);
		this.props.onClick(value);
	}

	private readonly resetZoom = () => {
		this.setState({zoom: undefined});
	};

	// --- Selection overlay (kept inline, trivial) ---

	private renderSelectionOverlay(pad: ChartPadding, plotWidth: number, plotHeight: number) {
		const {selectionX} = this.state;
		if (!selectionX)
			return null;

		const left = Math.max(Math.min(selectionX.start, selectionX.end), pad.left);
		const right = Math.min(Math.max(selectionX.start, selectionX.end), pad.left + plotWidth);

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

	// --- Render ---

	render() {
		const {width, height, layers} = this.props;
		if (layers.length === 0 || layers.every(l => l.data.length === 0))
			return null;

		this.hRangeCache.clear();
		this.vRangeCache.clear();

		const pad = this.computePadding();
		const plotWidth = width - pad.left - pad.right;
		const plotHeight = height - pad.top - pad.bottom;
		const ctx = this.buildRenderContext(pad, plotWidth, plotHeight);

		const cursorStyle = this.state.drag?.shift ? 'col-resize' : (this.isZoomed ? 'grab' : 'crosshair');
		const hoverZone = getHoverZone(this.state.hoverX, this.state.hoverY, {pad, plotWidth, plotHeight});
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
					{renderGrid(ctx)}
					{renderBaselines(ctx)}
					{renderVAxes(ctx)}
					{renderHAxes(ctx)}
					{renderLayers(ctx)}
					{renderMarkers(ctx, this.props.onMarkerClick, this.props.onMarkerHover)}
					{this.renderSelectionOverlay(pad, plotWidth, plotHeight)}
					{showCrosshair && hoverZone !== 'none' && renderCrosshair(ctx, this.state.hoverX!, this.state.hoverY)}
					{showCrosshair && hoverZone !== 'plot' && hoverZone !== 'none' && renderAxisCrosshair(ctx, this.state.hoverX, this.state.hoverY, hoverZone)}
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
}
