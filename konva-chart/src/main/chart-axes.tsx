import * as React from 'react';
import {Line, Text} from 'react-konva';
import {toCanvasX, toCanvasY} from './chart-coordinate.js';
import type {ChartRenderContext} from './chart-render-context.js';

function defaultFormatter(value: number): string {
	return value.toLocaleString();
}

export function renderGrid(ctx: ChartRenderContext): React.ReactNode[] {
	const {pad, plotWidth, plotHeight, theme} = ctx;
	const lines: React.ReactNode[] = [];
	const steps = 4;

	for (let i = 0; i <= steps; i++) {
		const y = pad.top + (i / steps) * plotHeight;
		lines.push(<Line key={`gy-${i}`} points={[pad.left, y, pad.left + plotWidth, y]} stroke={theme.gridLine} strokeWidth={1} listening={false}/>);
	}

	return lines;
}

export function renderBaselines(ctx: ChartRenderContext): React.ReactNode[] {
	const {pad, plotWidth, plotHeight, hAxes, vAxes, getHRange, getVRange, getAxisColor} = ctx;
	const nodes: React.ReactNode[] = [];

	vAxes.forEach((axis, i) => {
		if (axis.baseline == null)
			return;

		const range = getVRange(axis);
		if (axis.baseline < range.min || axis.baseline > range.max)
			return;

		const y = toCanvasY(axis.baseline, range, pad, plotHeight);
		nodes.push(<Line key={`bl-v-${i}`} points={[pad.left, y, pad.left + plotWidth, y]} stroke={getAxisColor(axis)} strokeWidth={1} opacity={0.4} dash={[4, 3]} listening={false}/>);
	});

	hAxes.forEach((axis, i) => {
		if (axis.baseline == null)
			return;

		const range = getHRange(axis);
		if (axis.baseline < range.min || axis.baseline > range.max)
			return;

		const x = toCanvasX(axis.baseline, range, pad, plotWidth);
		nodes.push(<Line key={`bl-h-${i}`} points={[x, pad.top, x, pad.top + plotHeight]} stroke={getAxisColor(axis)} strokeWidth={1} opacity={0.4} dash={[4, 3]} listening={false}/>);
	});

	return nodes;
}

export function renderVAxes(ctx: ChartRenderContext): React.ReactNode[] {
	const {pad, plotWidth, plotHeight, theme, vAxes, getVRange} = ctx;
	const nodes: React.ReactNode[] = [];
	const steps = 4;

	vAxes.forEach((axis, axisIdx) => {
		const position = axis.position ?? 'left';
		if (position === 'none' || position === 'top' || position === 'bottom')
			return;

		const range = getVRange(axis);
		const fmts = axis.formatters ?? [defaultFormatter];

		for (let i = 0; i <= steps; i++) {
			const v = range.max - (i / steps) * (range.max - range.min);
			const y = pad.top + (i / steps) * plotHeight;

			fmts.forEach((fmt, fmtIdx) => {
				if (position === 'left')
					nodes.push(<Text key={`vl-${axisIdx}-${i}-${fmtIdx}`} x={0} y={y - 6} width={pad.left - 5} text={fmt(v)} fontSize={theme.fontSize} fill={theme.axisText} align={'right'} listening={false}/>);
				else
					nodes.push(<Text key={`vr-${axisIdx}-${i}-${fmtIdx}`} x={pad.left + plotWidth + 5} y={y - 6} width={pad.right - 5} text={fmt(v)} fontSize={theme.fontSize} fill={theme.axisText} align={'left'} listening={false}/>);
			});
		}
	});

	return nodes;
}

export function renderHAxes(ctx: ChartRenderContext): React.ReactNode[] {
	const {pad, plotWidth, plotHeight, theme, hAxes, getHRange} = ctx;
	const nodes: React.ReactNode[] = [];
	const steps = 5;

	hAxes.forEach((axis, axisIdx) => {
		const position = axis.position ?? 'bottom';
		if (position === 'none' || position === 'left' || position === 'right')
			return;

		const range = getHRange(axis);
		const fmts = axis.formatters ?? [defaultFormatter];

		for (let i = 0; i <= steps; i++) {
			const v = range.min + (i / steps) * (range.max - range.min);
			const x = toCanvasX(v, range, pad, plotWidth);

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
