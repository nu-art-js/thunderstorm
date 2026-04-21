import * as React from 'react';
import {Stage, Layer, Rect} from 'react-konva';
import type {AxisConfig, ChartLayer, ChartMarker, ChartPadding, ChartTheme} from './types.js';
import {DefaultChartPadding, DefaultChartTheme} from './types.js';
import {computeRange, resolveAxisRange, applyZoomFraction, viewportToZoom, zoomToViewport} from './chart-range.js';
import type {ResolvedRange, ZoomFraction, ChartViewportMap} from './chart-range.js';
import {collectAxes, getHoverZone} from './chart-coordinate.js';
import type {ChartRenderContext} from './chart-render-context.js';
import {renderGrid, renderBaselines, renderVAxes, renderHAxes} from './chart-axes.js';
import {renderIndicators, renderLayers, renderMarkers} from './chart-layers.js';
import {renderCrosshair, renderAxisCrosshair} from './chart-crosshair.js';
import {Icon_ResetZoom} from './Icon_ResetZoom.js';

type Props = {
	layers: ChartLayer[];
	markers?: ChartMarker[];
	width: number;
	height: number;
	viewport?: ChartViewportMap;
	onViewportChange?: (viewport: ChartViewportMap | undefined) => void;
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
	ctrl: boolean;
	lockedAxis?: 'x' | 'y';
};

type SelectionState = {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	mode: 'x' | 'y' | 'xy';
};

const DragThreshold = 3;

type State = {
	hoverX?: number;
	hoverY?: number;
	zoom: Record<string, ZoomFraction>;
	drag?: DragState;
	selection?: SelectionState;
};

export class Chart extends React.Component<Props, State> {

	state: State = {zoom: {}};
	private readonly containerRef = React.createRef<HTMLDivElement>();
	private hRangeCache = new Map<AxisConfig, ResolvedRange>();
	private vRangeCache = new Map<AxisConfig, ResolvedRange>();
	private fullHRangeCache = new Map<AxisConfig, ResolvedRange>();
	private fullVRangeCache = new Map<AxisConfig, ResolvedRange>();

	private get theme(): ChartTheme {
		return {...DefaultChartTheme, ...this.props.theme};
	}

	private get isControlled(): boolean {
		return this.props.viewport !== undefined;
	}

	private get isZoomed(): boolean {
		if (this.isControlled) {
			const vp = this.props.viewport!;
			return Object.keys(vp).length > 0;
		}

		return Object.keys(this.state.zoom).length > 0;
	}

	// --- Per-axis zoom resolution ---

	private resolveAxisZoom(axis: AxisConfig): ZoomFraction | undefined {
		if (!axis.key)
			return undefined;

		if (this.isControlled) {
			const vp = this.props.viewport?.[axis.key];
			if (!vp)
				return undefined;

			const full = this.getFullHRange(axis);
			return viewportToZoom(full, vp);
		}

		return this.state.zoom[axis.key];
	}

	private resolveVAxisZoom(axis: AxisConfig): ZoomFraction | undefined {
		if (!axis.key)
			return undefined;

		if (this.isControlled) {
			const vp = this.props.viewport?.[axis.key];
			if (!vp)
				return undefined;

			const full = this.getFullVRange(axis);
			return viewportToZoom(full, vp);
		}

		return this.state.zoom[axis.key];
	}

	private isHAxisZoomed(): boolean {
		const {hAxes} = collectAxes(this.props.layers, this.props.markers);
		return hAxes.some(a => this.resolveAxisZoom(a) != null);
	}

	private updateAxisZoom(key: string, zoom: ZoomFraction | undefined, kind: 'h' | 'v'): void {
		if (this.isControlled) {
			if (!this.props.onViewportChange)
				return;

			const current = {...(this.props.viewport ?? {})};

			if (!zoom) {
				delete current[key];
			} else {
				const {hAxes, vAxes} = collectAxes(this.props.layers, this.props.markers);
				const axis = [...hAxes, ...vAxes].find(a => a.key === key);
				if (!axis)
					return;

				const full = kind === 'h' ? this.getFullHRange(axis) : this.getFullVRange(axis);
				current[key] = zoomToViewport(full, zoom);
			}

			this.props.onViewportChange(Object.keys(current).length > 0 ? current : undefined);
			return;
		}

		this.setState(prev => {
			const next = {...prev.zoom};
			if (!zoom)
				delete next[key];
			else
				next[key] = zoom;

			return {zoom: next};
		});
	}

	private resetAllZoom(): void {
		if (this.isControlled) {
			this.props.onViewportChange?.(undefined);
			return;
		}

		this.setState({zoom: {}});
	}

	// --- Range computation ---

	private getFullHRange(axis: AxisConfig): ResolvedRange {
		let cached = this.fullHRangeCache.get(axis);
		if (cached)
			return cached;

		const layers = this.props.layers.filter(l => l.hAxis === axis);
		const values: number[] = [];
		for (const layer of layers)
			for (const pt of layer.data)
				values.push(pt.h);

		if (axis.indicators)
			for (const ind of axis.indicators)
				values.push(ind.value);

		cached = computeRange(axis, values);
		this.fullHRangeCache.set(axis, cached);
		return cached;
	}

	private getFullVRange(axis: AxisConfig): ResolvedRange {
		let cached = this.fullVRangeCache.get(axis);
		if (cached)
			return cached;

		const layers = this.props.layers.filter(l => l.vAxis === axis);
		const values: number[] = [];
		const hZoomed = this.isHAxisZoomed();

		for (const layer of layers) {
			if (hZoomed) {
				const hRange = this.getHRange(layer.hAxis);
				for (const pt of layer.data) {
					if (pt.h >= hRange.min && pt.h <= hRange.max)
						values.push(pt.v);
				}
			} else {
				for (const pt of layer.data)
					values.push(pt.v);
			}
		}

		if (axis.indicators)
			for (const ind of axis.indicators)
				values.push(ind.value);

		cached = computeRange(axis, values);
		this.fullVRangeCache.set(axis, cached);
		return cached;
	}

	private readonly getHRange = (axis: AxisConfig): ResolvedRange => {
		let cached = this.hRangeCache.get(axis);
		if (cached)
			return cached;

		const full = this.getFullHRange(axis);
		const zoom = this.resolveAxisZoom(axis);
		cached = zoom ? applyZoomFraction(full, zoom) : full;
		this.hRangeCache.set(axis, cached);
		return cached;
	};

	private readonly getVRange = (axis: AxisConfig): ResolvedRange => {
		let cached = this.vRangeCache.get(axis);
		if (cached)
			return cached;

		const full = this.getFullVRange(axis);
		const zoom = this.resolveVAxisZoom(axis);
		cached = zoom ? applyZoomFraction(full, zoom) : full;
		this.vRangeCache.set(axis, cached);
		return cached;
	};

	private readonly getAxisColor = (axis: AxisConfig): string => {
		const layer = this.props.layers.find(l => l.vAxis === axis || l.hAxis === axis);
		return layer?.color ?? this.theme.axisText;
	};

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
			drag: {startX: pos.x, startY: pos.y, shift: e.shiftKey, ctrl: e.ctrlKey || e.metaKey},
			selection: undefined,
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
		const dy = pos.y - drag.startY;

		if (drag.shift && drag.ctrl) {
			if (Math.abs(dx) >= DragThreshold || Math.abs(dy) >= DragThreshold) {
				this.setState({
					selection: {x1: drag.startX, y1: drag.startY, x2: pos.x, y2: pos.y, mode: 'xy'},
					hoverX: undefined, hoverY: undefined,
				});
			}
			return;
		}

		if (drag.shift) {
			let axis = drag.lockedAxis;
			if (!axis && (Math.abs(dx) >= DragThreshold || Math.abs(dy) >= DragThreshold))
				axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';

			if (axis) {
				if (axis !== drag.lockedAxis)
					drag.lockedAxis = axis;

				this.setState({
					selection: {x1: drag.startX, y1: drag.startY, x2: pos.x, y2: pos.y, mode: axis},
					hoverX: undefined, hoverY: undefined,
				});
			}
			return;
		}

		if (Math.abs(dx) < DragThreshold)
			return;

		const {hAxes} = collectAxes(this.props.layers, this.props.markers);
		if (hAxes.length === 0)
			return;

		const primaryH = hAxes[0];
		const hZoom = this.resolveAxisZoom(primaryH);
		if (!hZoom)
			return;

		const pad = this.computePadding();
		const plotWidth = this.props.width - pad.left - pad.right;
		const zoomSpan = hZoom.max - hZoom.min;
		const fractionDelta = (dx / plotWidth) * zoomSpan;

		this.clearRangeCaches();
		if (primaryH.key)
			this.updateAxisZoom(primaryH.key, {min: hZoom.min - fractionDelta, max: hZoom.max - fractionDelta}, 'h');

		this.setState({
			drag: {startX: pos.x, startY: pos.y, shift: false, ctrl: false},
			hoverX: undefined, hoverY: undefined,
		});
	};

	private readonly onMouseUp = (e: React.MouseEvent) => {
		const {drag} = this.state;
		if (!drag)
			return;

		const pos = this.getRelativePos(e);
		if (!pos) {
			this.setState({drag: undefined, selection: undefined});
			return;
		}

		const dx = Math.abs(pos.x - drag.startX);
		const dy = Math.abs(pos.y - drag.startY);

		if (drag.shift && drag.ctrl && (dx > DragThreshold || dy > DragThreshold)) {
			this.applyZoomSelection(drag.startX, pos.x, drag.startY, pos.y, 'xy');
			this.setState({drag: undefined, selection: undefined});
			return;
		}

		if (drag.shift && drag.lockedAxis) {
			const dist = drag.lockedAxis === 'x' ? dx : dy;
			if (dist > DragThreshold) {
				this.applyZoomSelection(drag.startX, pos.x, drag.startY, pos.y, drag.lockedAxis);
				this.setState({drag: undefined, selection: undefined});
				return;
			}
		}

		this.setState({drag: undefined, selection: undefined});

		if (dx <= DragThreshold && dy <= DragThreshold)
			this.fireClick(pos.x);
	};

	private readonly onMouseLeave = () => {
		if (this.state.drag)
			this.setState({drag: undefined, selection: undefined, hoverX: undefined, hoverY: undefined});
		else
			this.setState({hoverX: undefined, hoverY: undefined});
	};

	private readonly onDblClick = () => {
		if (!this.isZoomed)
			return;

		this.resetAllZoom();
	};

	private applyZoomSelection(startPx: number, endPx: number, startPy: number, endPy: number, mode: 'x' | 'y' | 'xy') {
		const pad = this.computePadding();
		const plotWidth = this.props.width - pad.left - pad.right;
		const plotHeight = this.props.height - pad.top - pad.bottom;
		const {hAxes, vAxes} = collectAxes(this.props.layers, this.props.markers);

		if (mode === 'x' || mode === 'xy') {
			const leftPx = Math.max(Math.min(startPx, endPx), pad.left);
			const rightPx = Math.min(Math.max(startPx, endPx), pad.left + plotWidth);

			if (rightPx - leftPx >= DragThreshold) {
				const leftFrac = (leftPx - pad.left) / plotWidth;
				const rightFrac = (rightPx - pad.left) / plotWidth;

				for (const axis of hAxes) {
					if (!axis.key)
						continue;

					const current = this.resolveAxisZoom(axis) ?? {min: 0, max: 1};
					const span = current.max - current.min;
					this.updateAxisZoom(axis.key, {
						min: current.min + leftFrac * span,
						max: current.min + rightFrac * span,
					}, 'h');
				}
			}
		}

		if (mode === 'y' || mode === 'xy') {
			const topPx = Math.max(Math.min(startPy, endPy), pad.top);
			const bottomPx = Math.min(Math.max(startPy, endPy), pad.top + plotHeight);

			if (bottomPx - topPx >= DragThreshold) {
				const topFrac = (topPx - pad.top) / plotHeight;
				const bottomFrac = (bottomPx - pad.top) / plotHeight;

				for (const axis of vAxes) {
					if (!axis.key)
						continue;

					const current = this.resolveVAxisZoom(axis) ?? {min: 0, max: 1};
					const span = current.max - current.min;
					this.updateAxisZoom(axis.key, {
						min: current.min + (1 - bottomFrac) * span,
						max: current.min + (1 - topFrac) * span,
					}, 'v');
				}
			}
		}
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
		this.resetAllZoom();
	};

	private clearRangeCaches() {
		this.hRangeCache.clear();
		this.vRangeCache.clear();
		this.fullHRangeCache.clear();
		this.fullVRangeCache.clear();
	}

	// --- Selection overlay ---

	private renderSelectionOverlay(pad: ChartPadding, plotWidth: number, plotHeight: number) {
		const {selection} = this.state;
		if (!selection)
			return null;

		let x: number, y: number, w: number, h: number;

		if (selection.mode === 'x') {
			const left = Math.max(Math.min(selection.x1, selection.x2), pad.left);
			const right = Math.min(Math.max(selection.x1, selection.x2), pad.left + plotWidth);
			x = left;
			y = pad.top;
			w = right - left;
			h = plotHeight;
		} else if (selection.mode === 'y') {
			const top = Math.max(Math.min(selection.y1, selection.y2), pad.top);
			const bottom = Math.min(Math.max(selection.y1, selection.y2), pad.top + plotHeight);
			x = pad.left;
			y = top;
			w = plotWidth;
			h = bottom - top;
		} else {
			const left = Math.max(Math.min(selection.x1, selection.x2), pad.left);
			const right = Math.min(Math.max(selection.x1, selection.x2), pad.left + plotWidth);
			const top = Math.max(Math.min(selection.y1, selection.y2), pad.top);
			const bottom = Math.min(Math.max(selection.y1, selection.y2), pad.top + plotHeight);
			x = left;
			y = top;
			w = right - left;
			h = bottom - top;
		}

		return <Rect
			x={x}
			y={y}
			width={w}
			height={h}
			fill={this.theme.crosshair}
			opacity={0.12}
			listening={false}
		/>;
	}

	// --- Cursor ---

	private resolveCursor(): string {
		const {drag} = this.state;
		if (!drag)
			return this.isZoomed ? 'grab' : 'crosshair';

		if (drag.shift && drag.ctrl)
			return 'crosshair';

		if (drag.shift) {
			if (drag.lockedAxis === 'x')
				return 'col-resize';
			if (drag.lockedAxis === 'y')
				return 'row-resize';
			return 'crosshair';
		}

		return 'grabbing';
	}

	// --- Render ---

	render() {
		const {width, height, layers} = this.props;
		if (layers.length === 0 || layers.every(l => l.data.length === 0))
			return null;

		this.clearRangeCaches();

		const pad = this.computePadding();
		const plotWidth = width - pad.left - pad.right;
		const plotHeight = height - pad.top - pad.bottom;
		const ctx = this.buildRenderContext(pad, plotWidth, plotHeight);

		const hoverZone = getHoverZone(this.state.hoverX, this.state.hoverY, {pad, plotWidth, plotHeight});
		const showCrosshair = !this.state.drag && this.state.hoverX !== undefined;

		return <div
			ref={this.containerRef}
			style={{position: 'relative', width, height, cursor: this.resolveCursor()}}
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
				{renderIndicators(ctx)}
				{renderMarkers(ctx, this.props.onMarkerClick, this.props.onMarkerHover)}
					{this.renderSelectionOverlay(pad, plotWidth, plotHeight)}
					{showCrosshair && hoverZone !== 'none' && renderCrosshair(ctx, this.state.hoverX!, this.state.hoverY)}
					{showCrosshair && hoverZone !== 'plot' && hoverZone !== 'none' && renderAxisCrosshair(ctx, this.state.hoverX, this.state.hoverY, hoverZone)}
				</Layer>
			</Stage>
			{this.isZoomed && <button
				onClick={this.resetZoom}
				title={'Reset zoom'}
				style={{
					position: 'absolute',
					bottom: 0,
					left: 0,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					width: pad.left,
					height: pad.bottom,
					padding: 0,
					background: 'transparent',
					color: this.theme.axisText,
					border: 'none',
					cursor: 'pointer',
				}}
			><Icon_ResetZoom size={14}/></button>}
		</div>;
	}
}
