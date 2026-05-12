import {expect} from 'chai';
import {findClosestPoint} from '../main/chart-range.js';
import {interpolateAt} from '../main/data-utils.js';
import type {DataPoint} from '../main/types.js';

const sampleData: DataPoint[] = [
	{h: 1000, v: 100},
	{h: 2000, v: 200},
	{h: 3000, v: 400},
	{h: 4000, v: 500},
	{h: 5000, v: 700},
];

describe('findClosestPoint', () => {
	it('returns the exact point when hValue matches', () => {
		const result = findClosestPoint(sampleData, 3000);
		expect(result).to.deep.equal({h: 3000, v: 400});
	});

	it('returns first point when hValue is before all data', () => {
		const result = findClosestPoint(sampleData, 500);
		expect(result).to.deep.equal({h: 1000, v: 100});
	});

	it('returns last point when hValue is beyond all data', () => {
		const result = findClosestPoint(sampleData, 9000);
		expect(result).to.deep.equal({h: 5000, v: 700});
	});

	it('returns nearest point by h distance', () => {
		const result = findClosestPoint(sampleData, 2800);
		expect(result).to.deep.equal({h: 3000, v: 400});
	});

	it('returns undefined for empty array', () => {
		const result = findClosestPoint([], 1000);
		expect(result).to.be.undefined;
	});
});

describe('interpolateAt', () => {
	it('clamps to first value when hValue is before data range', () => {
		const result = interpolateAt(sampleData, 500);
		expect(result).to.equal(100);
	});

	it('clamps to last value when hValue is after data range', () => {
		const result = interpolateAt(sampleData, 6000);
		expect(result).to.equal(700);
	});

	it('interpolates linearly between two points', () => {
		const result = interpolateAt(sampleData, 2500);
		expect(result).to.equal(300);
	});

	it('returns exact value at a data point', () => {
		const result = interpolateAt(sampleData, 3000);
		expect(result).to.equal(400);
	});

	it('interpolates at 25% between two points', () => {
		const result = interpolateAt(sampleData, 1250);
		expect(result).to.equal(125);
	});
});

describe('vertical indicator hover — bounds filtering', () => {
	const rawMetricData: DataPoint[] = [
		{h: 0, v: 0},
		{h: 3600000, v: 10000},
		{h: 7200000, v: 25000},
	];

	const predictionData: DataPoint[] = [
		{h: 0, v: 0},
		{h: 3600000, v: 10000},
		{h: 7200000, v: 25000},
		{h: 10800000, v: 45000},
		{h: 14400000, v: 60000},
	];

	const indicatorTimestamp = 10800000;

	it('raw metric data does not cover indicator timestamp', () => {
		const firstH = rawMetricData[0].h;
		const lastH = rawMetricData[rawMetricData.length - 1].h;
		const outsideBounds = indicatorTimestamp < firstH || indicatorTimestamp > lastH;
		expect(outsideBounds).to.equal(true);
	});

	it('prediction data covers indicator timestamp', () => {
		const firstH = predictionData[0].h;
		const lastH = predictionData[predictionData.length - 1].h;
		const insideBounds = indicatorTimestamp >= firstH && indicatorTimestamp <= lastH;
		expect(insideBounds).to.equal(true);
	});

	it('findClosestPoint on raw metric returns last sample (the bug)', () => {
		const closest = findClosestPoint(rawMetricData, indicatorTimestamp);
		expect(closest).to.deep.equal({h: 7200000, v: 25000});
	});

	it('interpolateAt on prediction returns projected value at indicator', () => {
		const value = interpolateAt(predictionData, indicatorTimestamp);
		expect(value).to.equal(45000);
	});

	it('bounds check + interpolateAt gives correct behaviour', () => {
		const layers = [
			{id: 'views', data: rawMetricData},
			{id: 'prediction', data: predictionData},
		];

		const results: {id: string; value: number}[] = [];

		for (const layer of layers) {
			const firstH = layer.data[0].h;
			const lastH = layer.data[layer.data.length - 1].h;
			if (indicatorTimestamp < firstH || indicatorTimestamp > lastH)
				continue;

			results.push({id: layer.id, value: interpolateAt(layer.data, indicatorTimestamp)});
		}

		expect(results).to.have.length(1);
		expect(results[0].id).to.equal('prediction');
		expect(results[0].value).to.equal(45000);
	});
});
