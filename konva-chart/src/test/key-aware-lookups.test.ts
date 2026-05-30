import {expect} from 'chai';
import {collectAxes, layersForAxis, sameAxis} from '../main/chart-coordinate.js';
import type {AxisConfig, ChartLayer, ChartMarker, DataPoint} from '../main/types.js';

const makeLayer = (id: string, hAxis: AxisConfig, vAxis: AxisConfig, data: DataPoint[] = []): ChartLayer => ({
	id,
	data,
	hAxis,
	vAxis,
	color: '#000',
	label: id,
	style: 'line',
});

describe('key-aware axis lookups (#527)', () => {
	describe('sameAxis', () => {
		it('treats two distinct instances that share a key as the same axis', () => {
			expect(sameAxis({key: 'time'}, {key: 'time'})).to.equal(true);
		});

		it('treats different keys as different axes', () => {
			expect(sameAxis({key: 'time'}, {key: 'views'})).to.equal(false);
		});

		it('never matches a keyed axis against a keyless one', () => {
			expect(sameAxis({key: 'time'}, {})).to.equal(false);
		});

		it('falls back to reference identity for keyless axes', () => {
			const shared: AxisConfig = {};
			expect(sameAxis(shared, shared)).to.equal(true);
			expect(sameAxis({}, {})).to.equal(false);
		});
	});

	describe('layersForAxis', () => {
		it('aggregates layers spread across duplicate same-key axis instances', () => {
			// The time axis is rebuilt per render pass — two layers reference two
			// fresh instances that share the key. Range aggregation must see both.
			const hAxisA: AxisConfig = {key: 'time'};
			const hAxisB: AxisConfig = {key: 'time'};
			const vAxis: AxisConfig = {key: 'views'};

			const layers = [
				makeLayer('a', hAxisA, vAxis, [{h: 0, v: 10}]),
				makeLayer('b', hAxisB, vAxis, [{h: 100, v: 20}]),
			];

			const matched = layersForAxis(layers, hAxisA, 'h');
			expect(matched.map(l => l.id)).to.have.members(['a', 'b']);
		});

		it('aggregates vertical layers across duplicate same-key instances', () => {
			const hAxis: AxisConfig = {key: 'time'};
			const vAxisA: AxisConfig = {key: 'views'};
			const vAxisB: AxisConfig = {key: 'views'};

			const layers = [
				makeLayer('a', hAxis, vAxisA, [{h: 0, v: 10}]),
				makeLayer('b', hAxis, vAxisB, [{h: 1, v: 99}]),
			];

			const matched = layersForAxis(layers, vAxisB, 'v');
			expect(matched.map(l => l.id)).to.have.members(['a', 'b']);
		});

		it('keeps keyless axes matched by reference only', () => {
			const hAxis1: AxisConfig = {};
			const hAxis2: AxisConfig = {};
			const vAxis: AxisConfig = {};

			const layers = [
				makeLayer('a', hAxis1, vAxis),
				makeLayer('b', hAxis2, vAxis),
			];

			expect(layersForAxis(layers, hAxis1, 'h').map(l => l.id)).to.eql(['a']);
		});
	});

	describe('marker axis resolution', () => {
		it('resolves a marker carrying a non-canonical same-key instance to the canonical axis', () => {
			const canonicalTime: AxisConfig = {key: 'time'};
			const vAxis: AxisConfig = {key: 'views'};
			const {hAxes} = collectAxes([makeLayer('a', canonicalTime, vAxis)]);

			// Marker built with a *fresh* same-key instance, as happens when the
			// axis is rebuilt each render. Identity (`includes`) would miss it.
			const markerAxis: AxisConfig = {key: 'time'};
			const markers: ChartMarker[] = [{id: 'm1', value: 5, axis: markerAxis, label: 'event', color: '#f00'}];

			const resolved = hAxes.find(a => sameAxis(a, markers[0].axis));
			expect(resolved).to.equal(canonicalTime);
		});

		it('drops a marker whose axis matches no horizontal axis', () => {
			const {hAxes} = collectAxes([makeLayer('a', {key: 'time'}, {key: 'views'})]);
			const orphanMarker: ChartMarker = {id: 'm1', value: 5, axis: {key: 'price'}, label: 'x', color: '#f00'};
			expect(hAxes.find(a => sameAxis(a, orphanMarker.axis))).to.equal(undefined);
		});
	});
});
