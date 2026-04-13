import * as React from 'react';
import {Line, Text, Rect, Circle} from 'react-konva';
import {toCanvasX, toCanvasY} from './chart-coordinate.js';
import type {HoverZone} from './chart-coordinate.js';
import {findClosestPoint} from './chart-range.js';
import type {ChartRenderContext} from './chart-render-context.js';

function defaultFormatter(value: number): string {
	return value.toLocaleString();
}

export function renderCrosshair(ctx: ChartRenderContext, hoverX: number, hoverY: number | undefined): React.ReactNode[] | null {
	const {pad, plotWidth, plotHeight, theme, layers, hAxes} = ctx;
	if (hAxes.length === 0)
		return null;

	const primaryHAxis = hAxes[0];
	const hRange = ctx.getHRange(primaryHAxis);
	const hValue = hRange.min + ((hoverX - pad.left) / plotWidth) * (hRange.max - hRange.min);

	const nodes: React.ReactNode[] = [];
	const plotBottom = pad.top + plotHeight;
	const plotMidY = pad.top + plotHeight / 2;

	type TipEntry = { text: string; color: string };
	const tipEntries: TipEntry[] = [];

	layers.forEach((layer) => {
		if (layer.data.length === 0)
			return;

		const layerHRange = ctx.getHRange(layer.hAxis);
		const vRange = ctx.getVRange(layer.vAxis);
		const closest = findClosestPoint(layer.data, hValue);
		if (!closest)
			return;

		const cx = toCanvasX(closest.h, layerHRange, pad, plotWidth);
		const rawCy = toCanvasY(closest.v, vRange, pad, plotHeight);
		const cy = Math.max(pad.top, Math.min(plotBottom, rawCy));

		const tooltipFmt = layer.vAxis.tooltipFormatter ?? defaultFormatter;
		nodes.push(<Circle key={`dot-${layer.id}`} x={cx} y={cy} radius={4} fill={layer.color} listening={false}/>);
		tipEntries.push({text: tooltipFmt(closest.v), color: layer.color});
	});

	if (tipEntries.length === 0)
		return null;

	nodes.unshift(<Line key={'crosshair'} points={[hoverX, pad.top, hoverX, plotBottom]} stroke={theme.crosshair} strokeWidth={1} dash={[4, 4]} opacity={0.6} listening={false}/>);

	const lineH = 14;
	const tipPadH = 4;
	const tipPadW = 6;
	const tipBlockW = 120;
	const tipBlockH = tipEntries.length * lineH + tipPadH * 2;
	const mouseInTopHalf = (hoverY ?? 0) < plotMidY;
	const tipY = mouseInTopHalf ? plotBottom - tipBlockH - 4 : pad.top + 4;

	const spaceOnRight = pad.left + plotWidth - hoverX;
	const showOnLeft = spaceOnRight < tipBlockW + 16;
	const tipX = showOnLeft ? hoverX - tipBlockW - tipPadW - 8 : hoverX + 8;

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
		nodes.push(<Text key={'h-tip'} x={hoverX - 30} y={plotBottom + 6} text={hTooltipFmt(hValue)} fontSize={theme.fontSize - 1} fill={theme.axisText} width={60} align={'center'} fontStyle={'bold'} listening={false}/>);
	} else {
		hFmts.forEach((fmt, fmtIdx) => {
			nodes.push(<Text key={`h-tip-${fmtIdx}`} x={hoverX - 30} y={plotBottom + 6 + fmtIdx * 14} text={fmt(hValue)} fontSize={theme.fontSize - 1} fill={theme.axisText} width={60} align={'center'} fontStyle={'bold'} listening={false}/>);
		});
	}

	return nodes;
}

export function renderAxisCrosshair(ctx: ChartRenderContext, hoverX: number | undefined, hoverY: number | undefined, zone: HoverZone): React.ReactNode[] | null {
	const {pad, plotWidth, plotHeight, theme, hAxes, vAxes} = ctx;
	const nodes: React.ReactNode[] = [];

	if ((zone === 'left-axis' || zone === 'right-axis') && hoverY !== undefined) {
		const targetPosition = zone === 'left-axis' ? 'left' : 'right';
		const matchingAxes = vAxes.filter(a => (a.position ?? 'left') === targetPosition);

		nodes.push(<Line key={'axis-h-line'} points={[pad.left, hoverY, pad.left + plotWidth, hoverY]} stroke={theme.crosshair} strokeWidth={1} dash={[4, 4]} opacity={0.6} listening={false}/>);

		const tipEntries: { text: string; color: string }[] = [];
		for (const axis of matchingAxes) {
			const range = ctx.getVRange(axis);
			const value = range.max - ((hoverY - pad.top) / plotHeight) * (range.max - range.min);
			const fmt = axis.tooltipFormatter ?? axis.formatters?.[0] ?? defaultFormatter;
			tipEntries.push({text: fmt(value), color: ctx.getAxisColor(axis)});
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

		if (hAxes.length > 0) {
			const primaryHAxis = hAxes[0];
			const hRange = ctx.getHRange(primaryHAxis);
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
