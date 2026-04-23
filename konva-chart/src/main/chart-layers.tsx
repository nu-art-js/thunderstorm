import * as React from 'react';
import {Circle, Group, Line, Rect, Text} from 'react-konva';
import {toCanvasX, toCanvasY} from './chart-coordinate.js';
import type {ChartRenderContext} from './chart-render-context.js';
import type {ChartMarker} from './types.js';

export function renderLayers(ctx: ChartRenderContext): React.ReactNode[] {
	return ctx.layers.map(layer => {
		if (layer.data.length === 0)
			return null;

		const hRange = ctx.getHRange(layer.hAxis);
		const vRange = ctx.getVRange(layer.vAxis);

		const flatPoints: number[] = [];
		for (const pt of layer.data) {
			flatPoints.push(toCanvasX(pt.h, hRange, ctx.pad, ctx.plotWidth), toCanvasY(pt.v, vRange, ctx.pad, ctx.plotHeight));
		}

		const lineOpacity = layer.opacity ?? 1;
		const strokeWidth = layer.lineWidth ?? ctx.theme.lineWidth;

		if (layer.style === 'area') {
			const baselineY = layer.vAxis.baseline != null
				? toCanvasY(layer.vAxis.baseline, vRange, ctx.pad, ctx.plotHeight)
				: ctx.pad.top + ctx.plotHeight;

			const areaPoints = [...flatPoints];
			areaPoints.push(flatPoints[flatPoints.length - 2], baselineY);
			areaPoints.push(flatPoints[0], baselineY);

			return <Group key={layer.id} listening={false}>
				<Line points={areaPoints} fill={layer.color} opacity={lineOpacity * 0.15} closed={true} listening={false}/>
				<Line points={flatPoints} stroke={layer.color} strokeWidth={strokeWidth} opacity={lineOpacity} lineCap={'round'} lineJoin={'round'} listening={false}/>
			</Group>;
		}

		return <Line
			key={layer.id}
			points={flatPoints}
			stroke={layer.color}
			strokeWidth={strokeWidth}
			lineCap={'round'}
			lineJoin={'round'}
			opacity={lineOpacity}
			dash={layer.style === 'dashed' ? [6, 4] : undefined}
			listening={false}
		/>;
	});
}

const DefaultFillOpacity = 0.12;

function formatIndicatorLabel(fmt: ((v: number) => string) | undefined, from: number, to: number): string {
	const fmtVal = (v: number) => fmt ? fmt(v) : String(v);
	if (from === to)
		return fmtVal(from);

	return `${fmtVal(from)} – ${fmtVal(to)}`;
}

export function renderIndicators(ctx: ChartRenderContext): React.ReactNode[] {
	const nodes: React.ReactNode[] = [];
	const plotBottom = ctx.pad.top + ctx.plotHeight;
	const plotRight = ctx.pad.left + ctx.plotWidth;
	const fontSize = ctx.theme.fontSize - 1;

	for (const axis of ctx.hAxes) {
		const indicators = axis.indicators;
		if (!indicators || indicators.length === 0)
			continue;

		const hRange = ctx.getHRange(axis);
		const fmt = axis.tooltipFormatter ?? axis.formatters?.[0];
		for (const ind of indicators) {
			const xFrom = toCanvasX(ind.from, hRange, ctx.pad, ctx.plotWidth);
			const xTo = toCanvasX(ind.to, hRange, ctx.pad, ctx.plotWidth);
			const isRange = ind.from !== ind.to;

			if (isRange) {
				const left = Math.max(ctx.pad.left, Math.min(xFrom, xTo));
				const right = Math.min(plotRight, Math.max(xFrom, xTo));
				if (right <= ctx.pad.left || left >= plotRight)
					continue;

				nodes.push(<Rect
					key={`ind-h-fill-${ind.id}`}
					x={left}
					y={ctx.pad.top}
					width={right - left}
					height={ctx.plotHeight}
					fill={ind.color}
					opacity={ind.fillOpacity ?? DefaultFillOpacity}
					listening={false}
				/>);

				if (xFrom >= ctx.pad.left && xFrom <= plotRight)
					nodes.push(<Line key={`ind-h-from-${ind.id}`} points={[xFrom, ctx.pad.top, xFrom, plotBottom]} stroke={ind.color} strokeWidth={ind.width ?? 1} dash={ind.dash ?? [6, 4]} opacity={0.7} listening={false}/>);

				if (xTo >= ctx.pad.left && xTo <= plotRight)
					nodes.push(<Line key={`ind-h-to-${ind.id}`} points={[xTo, ctx.pad.top, xTo, plotBottom]} stroke={ind.color} strokeWidth={ind.width ?? 1} dash={ind.dash ?? [6, 4]} opacity={0.7} listening={false}/>);
			} else {
				if (xFrom < ctx.pad.left || xFrom > plotRight)
					continue;

				nodes.push(<Line key={`ind-h-${ind.id}`} points={[xFrom, ctx.pad.top, xFrom, plotBottom]} stroke={ind.color} strokeWidth={ind.width ?? 1} dash={ind.dash ?? [6, 4]} opacity={0.7} listening={false}/>);
			}

			const labelX = isRange ? Math.max(ctx.pad.left, Math.min(xFrom, xTo)) + 3 : xFrom + 3;
			const text = ind.label || formatIndicatorLabel(fmt, ind.from, ind.to);
			nodes.push(<Text
				key={`ind-h-lbl-${ind.id}`}
				x={labelX}
				y={ctx.pad.top + 2}
				text={text}
				fontSize={fontSize}
				fill={ind.color}
				fontStyle={'bold'}
				listening={false}
			/>);
		}
	}

	for (const axis of ctx.vAxes) {
		const indicators = axis.indicators;
		if (!indicators || indicators.length === 0)
			continue;

		const vRange = ctx.getVRange(axis);
		const fmt = axis.tooltipFormatter ?? axis.formatters?.[0];
		const isRight = (axis.position ?? 'left') === 'right';
		for (const ind of indicators) {
			const yFrom = Math.max(ctx.pad.top, Math.min(plotBottom, toCanvasY(ind.from, vRange, ctx.pad, ctx.plotHeight)));
			const yTo = Math.max(ctx.pad.top, Math.min(plotBottom, toCanvasY(ind.to, vRange, ctx.pad, ctx.plotHeight)));
			const isRange = ind.from !== ind.to;

			if (isRange) {
				const top = Math.min(yFrom, yTo);
				const bottom = Math.max(yFrom, yTo);

				nodes.push(<Rect
					key={`ind-v-fill-${ind.id}`}
					x={ctx.pad.left}
					y={top}
					width={ctx.plotWidth}
					height={bottom - top}
					fill={ind.color}
					opacity={ind.fillOpacity ?? DefaultFillOpacity}
					listening={false}
				/>);

				nodes.push(<Line key={`ind-v-from-${ind.id}`} points={[ctx.pad.left, yFrom, plotRight, yFrom]} stroke={ind.color} strokeWidth={ind.width ?? 1} dash={ind.dash ?? [6, 4]} opacity={0.7} listening={false}/>);
				nodes.push(<Line key={`ind-v-to-${ind.id}`} points={[ctx.pad.left, yTo, plotRight, yTo]} stroke={ind.color} strokeWidth={ind.width ?? 1} dash={ind.dash ?? [6, 4]} opacity={0.7} listening={false}/>);
			} else {
				nodes.push(<Line key={`ind-v-${ind.id}`} points={[ctx.pad.left, yFrom, plotRight, yFrom]} stroke={ind.color} strokeWidth={ind.width ?? 1} dash={ind.dash ?? [6, 4]} opacity={0.7} listening={false}/>);
			}

			const text = ind.label || formatIndicatorLabel(fmt, ind.from, ind.to);
			const bandHeight = isRange ? Math.abs(yFrom - yTo) : Infinity;
			if (text && bandHeight > fontSize + 4) {
				const labelX = isRight ? plotRight + 4 : ctx.pad.left + 4;
				const labelY = isRange ? Math.min(yFrom, yTo) - fontSize - 2 : yFrom - fontSize - 2;
				nodes.push(<Text
					key={`ind-v-lbl-${ind.id}`}
					x={labelX}
					y={labelY}
					text={text}
					fontSize={fontSize}
					fill={ind.color}
					fontStyle={'bold'}
					listening={false}
				/>);
			}
		}
	}

	return nodes;
}

export function renderMarkers(
	ctx: ChartRenderContext,
	onMarkerClick?: (marker: ChartMarker) => void,
	onMarkerHover?: (marker: ChartMarker | undefined) => void,
): React.ReactNode[] {
	if (ctx.markers.length === 0)
		return [];

	return ctx.markers.map(marker => {
		const isHorizontal = ctx.hAxes.includes(marker.axis);
		if (!isHorizontal)
			return null;

		const hRange = ctx.getHRange(marker.axis);
		const x = toCanvasX(marker.value, hRange, ctx.pad, ctx.plotWidth);
		if (x < ctx.pad.left || x > ctx.pad.left + ctx.plotWidth)
			return null;

		const y = ctx.pad.top - 2;

		return <Group key={marker.id}>
			<Line points={[x, ctx.pad.top, x, ctx.pad.top + ctx.plotHeight]} stroke={marker.color} strokeWidth={1} dash={[2, 4]} opacity={0.4} listening={false}/>
			<Circle
				x={x}
				y={y}
				radius={ctx.theme.markerRadius}
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
			<Text x={x - 20} y={y - ctx.theme.markerRadius - 14} text={marker.label} fontSize={ctx.theme.fontSize - 1} fill={marker.color} width={40} align={'center'} fontStyle={'bold'}/>
		</Group>;
	});
}
