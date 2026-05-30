import {expect} from 'chai';
import {collectAxes} from '../main/chart-coordinate.js';
import type {AxisConfig, ChartIndicator, ChartLayer, ChartMarker} from '../main/types.js';

const indicator = (id: string, from: number): ChartIndicator => ({id, from, to: from, color: '#000'});

const makeLayer = (id: string, hAxis: AxisConfig, vAxis: AxisConfig): ChartLayer => ({
	id,
	data: [],
	hAxis,
	vAxis,
	color: '#000',
	label: id,
	style: 'line',
});

describe('collectAxes — keyed dedup (#506)', () => {
	it('collapses distinct AxisConfig instances that share a key into one axis', () => {
		// Two layers each build a *fresh* time-axis instance (same logical axis),
		// mirroring a per-render-pass rebuild. They must collapse to a single axis.
		const timeAxisA: AxisConfig = {key: 'time', indicators: [indicator('day-1', 1000)]};
		const timeAxisB: AxisConfig = {key: 'time', indicators: [indicator('day-1', 1000)]};
		const viewsAxis: AxisConfig = {key: 'views', range: [0, undefined]};

		const layers = [
			makeLayer('a', timeAxisA, viewsAxis),
			makeLayer('b', timeAxisB, viewsAxis),
		];

		const {hAxes, vAxes} = collectAxes(layers);

		expect(hAxes).to.have.length(1);
		expect(hAxes[0]).to.equal(timeAxisA);
		expect(vAxes).to.have.length(1);
	});

	it('does not render indicators more than once across duplicate keyed axes', () => {
		const timeAxisA: AxisConfig = {key: 'time', indicators: [indicator('boundary-0d', 0), indicator('boundary-14d', 14)]};
		const timeAxisB: AxisConfig = {key: 'time', indicators: [indicator('boundary-0d', 0), indicator('boundary-14d', 14)]};
		const vAxis: AxisConfig = {key: 'views'};

		const {hAxes} = collectAxes([
			makeLayer('a', timeAxisA, vAxis),
			makeLayer('b', timeAxisB, vAxis),
		]);

		const renderedIds = hAxes.flatMap(axis => (axis.indicators ?? []).map(ind => ind.id));
		const uniqueIds = new Set(renderedIds);
		expect(renderedIds.length).to.equal(uniqueIds.size);
		expect([...uniqueIds]).to.have.members(['boundary-0d', 'boundary-14d']);
	});

	it('keeps keyless axes deduped by reference (legacy behaviour preserved)', () => {
		const sharedH: AxisConfig = {};
		const vAxis1: AxisConfig = {};
		const vAxis2: AxisConfig = {};

		const {hAxes, vAxes} = collectAxes([
			makeLayer('a', sharedH, vAxis1),
			makeLayer('b', sharedH, vAxis2),
		]);

		expect(hAxes).to.have.length(1);
		expect(vAxes).to.have.length(2);
	});

	it('treats distinct keyless axis instances as separate axes', () => {
		const hAxis1: AxisConfig = {};
		const hAxis2: AxisConfig = {};
		const vAxis: AxisConfig = {};

		const {hAxes} = collectAxes([
			makeLayer('a', hAxis1, vAxis),
			makeLayer('b', hAxis2, vAxis),
		]);

		expect(hAxes).to.have.length(2);
	});

	it('does not double-count a marker axis that matches a layer axis by key', () => {
		const timeAxis: AxisConfig = {key: 'time'};
		const vAxis: AxisConfig = {key: 'views'};
		const markerAxisSameKey: AxisConfig = {key: 'time'};

		const markers: ChartMarker[] = [{id: 'm1', value: 5, axis: markerAxisSameKey, label: 'event', color: '#f00'}];

		const {hAxes} = collectAxes([makeLayer('a', timeAxis, vAxis)], markers);

		expect(hAxes).to.have.length(1);
		expect(hAxes[0]).to.equal(timeAxis);
	});

	it('adds a marker axis with a new key as its own horizontal axis', () => {
		const timeAxis: AxisConfig = {key: 'time'};
		const vAxis: AxisConfig = {key: 'views'};
		const markerAxis: AxisConfig = {key: 'marker-axis'};

		const markers: ChartMarker[] = [{id: 'm1', value: 5, axis: markerAxis, label: 'event', color: '#f00'}];

		const {hAxes} = collectAxes([makeLayer('a', timeAxis, vAxis)], markers);

		expect(hAxes.map(a => a.key)).to.have.members(['time', 'marker-axis']);
	});
});
