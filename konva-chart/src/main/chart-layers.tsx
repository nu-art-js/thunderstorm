import * as React from 'react';
import {Line, Group, Circle, Text} from 'react-konva';
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

		if (layer.style === 'area') {
			const baselineY = layer.vAxis.baseline != null
				? toCanvasY(layer.vAxis.baseline, vRange, ctx.pad, ctx.plotHeight)
				: ctx.pad.top + ctx.plotHeight;

			const areaPoints = [...flatPoints];
			areaPoints.push(flatPoints[flatPoints.length - 2], baselineY);
			areaPoints.push(flatPoints[0], baselineY);

			return <Group key={layer.id} listening={false}>
				<Line points={areaPoints} fill={layer.color} opacity={lineOpacity * 0.15} closed={true} listening={false}/>
				<Line points={flatPoints} stroke={layer.color} strokeWidth={ctx.theme.lineWidth} opacity={lineOpacity} lineCap={'round'} lineJoin={'round'} listening={false}/>
			</Group>;
		}

		return <Line
			key={layer.id}
			points={flatPoints}
			stroke={layer.color}
			strokeWidth={ctx.theme.lineWidth}
			lineCap={'round'}
			lineJoin={'round'}
			opacity={lineOpacity}
			dash={layer.style === 'dashed' ? [6, 4] : undefined}
			listening={false}
		/>;
	});
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
