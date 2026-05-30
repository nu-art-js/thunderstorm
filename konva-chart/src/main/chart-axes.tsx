import * as React from 'react';
import {Line, Text} from 'react-konva';
import {toCanvasX, toCanvasY} from './chart-coordinate.js';
import type {ChartRenderContext} from './chart-render-context.js';
import {defaultAxisFormatter, VAxisLabelSteps, vAxisTickValues} from './chart-axis-metrics.js';

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
	const {pad, plotWidth, plotHeight, theme, vAxes, getVRange, getAxisColor, axisColumnWidth} = ctx;
	const nodes: React.ReactNode[] = [];

	let leftIdx = 0;
	let rightIdx = 0;

	vAxes.forEach((axis, axisIdx) => {
		const position = axis.position ?? 'left';
		if (position === 'none' || position === 'top' || position === 'bottom')
			return;

		const sideIdx = position === 'left' ? leftIdx++ : rightIdx++;
		const range = getVRange(axis);
		const fmts = axis.formatters ?? [defaultAxisFormatter];
		const color = getAxisColor(axis);

		if (axis.label) {
			const labelY = pad.top - theme.fontSize * 2 - 4;
			if (position === 'left') {
				const labelX = sideIdx * axisColumnWidth;
				nodes.push(<Text key={`vl-label-${axisIdx}`} x={labelX} y={labelY} text={axis.label} fontSize={theme.fontSize} fontStyle={'bold'} fill={color} listening={false}/>);
			} else {
				const labelX = pad.left + plotWidth + 5 + sideIdx * axisColumnWidth;
				nodes.push(<Text key={`vr-label-${axisIdx}`} x={labelX} y={labelY} text={axis.label} fontSize={theme.fontSize} fontStyle={'bold'} fill={color} listening={false}/>);
			}
		}

		vAxisTickValues(range).forEach((v, i) => {
			const y = pad.top + (i / VAxisLabelSteps) * plotHeight;

			fmts.forEach((fmt, fmtIdx) => {
				if (position === 'left') {
					const colX = sideIdx * axisColumnWidth;
					nodes.push(<Text key={`vl-${axisIdx}-${i}-${fmtIdx}`} x={colX} y={y - 6} width={axisColumnWidth - 5} text={fmt(v)} fontSize={theme.fontSize} fill={color} align={'right'} listening={false}/>);
				} else {
					const colX = pad.left + plotWidth + 5 + sideIdx * axisColumnWidth;
					nodes.push(<Text key={`vr-${axisIdx}-${i}-${fmtIdx}`} x={colX} y={y - 6} width={axisColumnWidth - 5} text={fmt(v)} fontSize={theme.fontSize} fill={color} align={'left'} listening={false}/>);
				}
			});
		});
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
		const fmts = axis.formatters ?? [defaultAxisFormatter];

		const ticks = axis.tickValues
			? axis.tickValues.filter(v => v >= range.min && v <= range.max)
			: Array.from({length: steps + 1}, (_, i) => range.min + (i / steps) * (range.max - range.min));

		ticks.forEach((v, i) => {
			const x = toCanvasX(v, range, pad, plotWidth);

			fmts.forEach((fmt, fmtIdx) => {
				const baseY = position === 'bottom'
					? pad.top + plotHeight + 6 + fmtIdx * 14
					: pad.top - 20 - (fmts.length - 1 - fmtIdx) * 14;

				nodes.push(<Text key={`h-${axisIdx}-${i}-${fmtIdx}`} x={x - 25} y={baseY} text={fmt(v)} fontSize={theme.fontSize - 1} fill={theme.axisText} width={50} align={'center'} listening={false}/>);
			});
		});
	});

	return nodes;
}
