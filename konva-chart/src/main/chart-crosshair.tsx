import * as React from 'react';
import {Line, Text, Rect, Circle} from 'react-konva';
import {toCanvasX, toCanvasY} from './chart-coordinate.js';
import type {HoverZone} from './chart-coordinate.js';
import {findClosestPoint} from './chart-range.js';
import {interpolateAt} from './data-utils.js';
import type {ChartRenderContext} from './chart-render-context.js';

function defaultFormatter(value: number): string {
	return value.toLocaleString();
}

const SnapThresholdPx = 10;

function snapToHIndicators(ctx: ChartRenderContext, rawX: number): number {
	let bestX = rawX;
	let bestDist = SnapThresholdPx;

	for (const axis of ctx.hAxes) {
		const indicators = axis.indicators;
		if (!indicators || indicators.length === 0)
			continue;

		const hRange = ctx.getHRange(axis);
		for (const ind of indicators) {
			for (const val of [ind.from, ind.to]) {
				const ix = toCanvasX(val, hRange, ctx.pad, ctx.plotWidth);
				const dist = Math.abs(rawX - ix);
				if (dist < bestDist) {
					bestDist = dist;
					bestX = ix;
				}
			}
		}
	}

	return bestX;
}

function snapToVIndicators(ctx: ChartRenderContext, rawY: number): number {
	let bestY = rawY;
	let bestDist = SnapThresholdPx;

	for (const axis of ctx.vAxes) {
		const indicators = axis.indicators;
		if (!indicators || indicators.length === 0)
			continue;

		const vRange = ctx.getVRange(axis);
		for (const ind of indicators) {
			for (const val of [ind.from, ind.to]) {
				const iy = toCanvasY(val, vRange, ctx.pad, ctx.plotHeight);
				const dist = Math.abs(rawY - iy);
				if (dist < bestDist) {
					bestDist = dist;
					bestY = iy;
				}
			}
		}
	}

	return bestY;
}

function renderHTimestampLabels(
	nodes: React.ReactNode[],
	ctx: ChartRenderContext,
	hValue: number,
	anchorX: number,
	plotBottom: number,
	keyPrefix: string,
) {
	const {theme} = ctx;
	const primaryHAxis = ctx.hAxes[0];
	const hTooltipFmt = primaryHAxis.tooltipFormatter;
	const hFmts = primaryHAxis.formatters ?? [defaultFormatter];
	const labelW = 72;
	const labelH = 14;
	const labelPadH = 2;
	const labelPadW = 4;

	const lineCount = hTooltipFmt ? 1 : hFmts.length;
	const blockH = lineCount * labelH + labelPadH * 2;

	nodes.push(<Rect
		key={`${keyPrefix}-bg`}
		x={anchorX - labelW / 2 - labelPadW}
		y={plotBottom + 4 - labelPadH}
		width={labelW + labelPadW * 2}
		height={blockH}
		fill={theme.background}
		cornerRadius={2}
		listening={false}
	/>);

	if (hTooltipFmt) {
		nodes.push(<Text key={keyPrefix} x={anchorX - labelW / 2} y={plotBottom + 4} text={hTooltipFmt(hValue)} fontSize={theme.fontSize - 1} fill={theme.crosshair} width={labelW} align={'center'} fontStyle={'bold'} listening={false}/>);
	} else {
		hFmts.forEach((fmt, fmtIdx) => {
			nodes.push(<Text key={`${keyPrefix}-${fmtIdx}`} x={anchorX - labelW / 2} y={plotBottom + 4 + fmtIdx * labelH} text={fmt(hValue)} fontSize={theme.fontSize - 1} fill={theme.crosshair} width={labelW} align={'center'} fontStyle={'bold'} listening={false}/>);
		});
	}
}

export function renderCrosshair(ctx: ChartRenderContext, rawHoverX: number, hoverY: number | undefined): React.ReactNode[] | null {
	const {pad, plotWidth, plotHeight, theme, layers, hAxes} = ctx;
	if (hAxes.length === 0)
		return null;

	const hoverX = snapToHIndicators(ctx, rawHoverX);
	const snapped = hoverX !== rawHoverX;

	const primaryHAxis = hAxes[0];
	const hRange = ctx.getHRange(primaryHAxis);
	const hValue = hRange.min + ((hoverX - pad.left) / plotWidth) * (hRange.max - hRange.min);

	const nodes: React.ReactNode[] = [];
	const plotBottom = pad.top + plotHeight;
	const plotMidY = pad.top + plotHeight / 2;

	type TipEntry = { text: string; color: string; timestamp: number };
	const tipEntries: TipEntry[] = [];

	layers.forEach((layer) => {
		if (layer.data.length === 0)
			return;

		const layerHRange = ctx.getHRange(layer.hAxis);
		const vRange = ctx.getVRange(layer.vAxis);

		if (snapped) {
			const firstH = layer.data[0].h;
			const lastH = layer.data[layer.data.length - 1].h;
			if (hValue < firstH || hValue > lastH)
				return;
		}

		const closest = findClosestPoint(layer.data, hValue);
		if (!closest)
			return;

		const displayValue = snapped ? interpolateAt(layer.data, hValue) : closest.v;
		const displayH = snapped ? hValue : closest.h;

		const cx = toCanvasX(displayH, layerHRange, pad, plotWidth);
		const rawCy = toCanvasY(displayValue, vRange, pad, plotHeight);
		const cy = Math.max(pad.top, Math.min(plotBottom, rawCy));

		const tooltipFmt = layer.vAxis.tooltipFormatter ?? defaultFormatter;
		nodes.push(<Circle key={`dot-${layer.id}`} x={cx} y={cy} radius={4} fill={layer.color} listening={false}/>);
		tipEntries.push({text: `${layer.label}: ${tooltipFmt(displayValue)}`, color: layer.color, timestamp: closest.h});

		if (layer.tooltipExtras) {
			const extras = layer.tooltipExtras(layer.data, closest);
			for (const extra of extras)
				tipEntries.push({...extra, timestamp: closest.h});
		}
	});

	if (tipEntries.length === 0)
		return null;

	nodes.unshift(<Line key={'crosshair'} points={[hoverX, pad.top, hoverX, plotBottom]} stroke={theme.crosshair} strokeWidth={1} dash={[4, 4]} opacity={0.6} listening={false}/>);

	const hTooltipFmt = primaryHAxis.tooltipFormatter ?? primaryHAxis.formatters?.[0] ?? defaultFormatter;
	const roundToSecond = (ms: number) => Math.round(ms / 1000) * 1000;

	const groups = new Map<number, TipEntry[]>();
	for (const entry of tipEntries) {
		const key = roundToSecond(entry.timestamp);
		const list = groups.get(key);
		if (list)
			list.push(entry);
		else
			groups.set(key, [entry]);
	}

	const sortedKeys = [...groups.keys()].sort((a, b) => a - b);
	const showHeaders = sortedKeys.length > 1;

	const lineH = 14;
	const tipPadH = 4;
	const tipPadW = 6;
	let totalLines = 0;
	const allTexts: string[] = [];
	for (const key of sortedKeys) {
		if (showHeaders) {
			totalLines++;
			allTexts.push(hTooltipFmt(key));
		}

		const entries = groups.get(key)!;
		totalLines += entries.length;
		for (const e of entries)
			allTexts.push(e.text);
	}

	const tipBlockW = Math.max(120, ...allTexts.map(t => t.length * 6.5 + tipPadW * 2));
	const tipBlockH = totalLines * lineH + tipPadH * 2;
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

	let lineIdx = 0;
	for (const key of sortedKeys) {
		if (showHeaders) {
			nodes.push(<Text
				key={`tip-hdr-${key}`}
				x={tipX}
				y={tipY + lineIdx * lineH}
				text={hTooltipFmt(key)}
				fontSize={theme.fontSize}
				fill={theme.axisText}
				fontStyle={'bold'}
				listening={false}
			/>);
			lineIdx++;
		}

		const entries = groups.get(key)!;
		for (const entry of entries) {
			nodes.push(<Text
				key={`tip-${lineIdx}`}
				x={tipX + (showHeaders ? 8 : 0)}
				y={tipY + lineIdx * lineH}
				text={entry.text}
				fontSize={theme.fontSize}
				fill={entry.color}
				fontStyle={'bold'}
				listening={false}
			/>);
			lineIdx++;
		}
	}

	renderHTimestampLabels(nodes, ctx, hValue, hoverX, plotBottom, 'h-tip');

	return nodes;
}

export function renderAxisCrosshair(ctx: ChartRenderContext, hoverX: number | undefined, hoverY: number | undefined, zone: HoverZone): React.ReactNode[] | null {
	const {pad, plotWidth, plotHeight, theme, hAxes, vAxes} = ctx;
	const nodes: React.ReactNode[] = [];

	if ((zone === 'left-axis' || zone === 'right-axis') && hoverY !== undefined) {
		const targetPosition = zone === 'left-axis' ? 'left' : 'right';
		const matchingAxes = vAxes.filter(a => (a.position ?? 'left') === targetPosition);

		const snappedY = snapToVIndicators(ctx, hoverY);
		nodes.push(<Line key={'axis-h-line'} points={[pad.left, snappedY, pad.left + plotWidth, snappedY]} stroke={theme.crosshair} strokeWidth={1} dash={[4, 4]} opacity={0.6} listening={false}/>);

		const tipEntries: { text: string; color: string }[] = [];
		for (const axis of matchingAxes) {
			const range = ctx.getVRange(axis);
			const value = range.max - ((snappedY - pad.top) / plotHeight) * (range.max - range.min);
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
		const rawClampedX = Math.max(pad.left, Math.min(pad.left + plotWidth, hoverX));
		const clampedX = snapToHIndicators(ctx, rawClampedX);
		nodes.push(<Line key={'axis-v-line'} points={[clampedX, pad.top, clampedX, pad.top + plotHeight]} stroke={theme.crosshair} strokeWidth={1} dash={[4, 4]} opacity={0.6} listening={false}/>);

		if (hAxes.length > 0) {
			const primaryHAxis = hAxes[0];
			const hRange = ctx.getHRange(primaryHAxis);
			const hValue = hRange.min + ((clampedX - pad.left) / plotWidth) * (hRange.max - hRange.min);
			const plotBottom = pad.top + plotHeight;
			renderHTimestampLabels(nodes, ctx, hValue, clampedX, plotBottom, 'axis-h-tip');
		}
	}

	return nodes.length > 0 ? nodes : null;
}
