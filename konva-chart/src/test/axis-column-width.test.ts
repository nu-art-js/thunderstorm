import {expect} from 'chai';
import type {AxisConfig} from '../main/types.js';
import type {ResolvedRange} from '../main/chart-range.js';
import {
	computeVAxisColumnWidth,
	DefaultAxisColumnWidth,
	estimateLabelWidth,
	vAxisTickValues,
	VAxisLabelSteps,
} from '../main/chart-axis-metrics.js';

const intFormatter = (v: number): string => v.toFixed(0);

// Resolve each axis to its own range via a Map so a single getVRange can serve
// multiple axes in one assertion.
const rangeResolver = (entries: [AxisConfig, ResolvedRange][]) => {
	const map = new Map(entries);
	return (axis: AxisConfig): ResolvedRange => {
		const range = map.get(axis);
		if (!range)
			throw new Error('no range registered for axis');

		return range;
	};
};

describe('vertical-axis column width (#482)', () => {
	it('vAxisTickValues samples max→min inclusive of both ends', () => {
		const ticks = vAxisTickValues({min: 0, max: 100});
		expect(ticks).to.have.length(VAxisLabelSteps + 1);
		expect(ticks[0]).to.equal(100);
		expect(ticks[ticks.length - 1]).to.equal(0);
	});

	it('estimateLabelWidth scales with character count (minus sign included)', () => {
		expect(estimateLabelWidth('1000')).to.be.lessThan(estimateLabelWidth('-1000'));
	});

	it('keeps the default minimum width when labels already fit', () => {
		const axis: AxisConfig = {position: 'left', formatters: [intFormatter]};
		const width = computeVAxisColumnWidth([axis], rangeResolver([[axis, {min: 0, max: 9}]]));
		expect(width).to.equal(DefaultAxisColumnWidth);
	});

	it('grows the column to fit wide labels that would otherwise overflow', () => {
		const axis: AxisConfig = {position: 'left', formatters: [intFormatter]};
		const width = computeVAxisColumnWidth([axis], rangeResolver([[axis, {min: 0, max: 1000000}]]));
		expect(width).to.be.greaterThan(DefaultAxisColumnWidth);
	});

	it('accounts for the negative sign — a negative range needs a wider column than the same-magnitude positive range', () => {
		const positiveAxis: AxisConfig = {position: 'left', formatters: [intFormatter]};
		const negativeAxis: AxisConfig = {position: 'left', formatters: [intFormatter]};

		const positiveWidth = computeVAxisColumnWidth([positiveAxis], rangeResolver([[positiveAxis, {min: 0, max: 1000000}]]));
		const negativeWidth = computeVAxisColumnWidth([negativeAxis], rangeResolver([[negativeAxis, {min: -1000000, max: 0}]]));

		expect(negativeWidth).to.be.greaterThan(positiveWidth);
	});

	it('ignores axes that are not rendered as a label column (none/top/bottom)', () => {
		const hidden: AxisConfig = {position: 'none', formatters: [intFormatter]};
		const width = computeVAxisColumnWidth([hidden], rangeResolver([[hidden, {min: -1000000, max: 1000000}]]));
		expect(width).to.equal(DefaultAxisColumnWidth);
	});

	it('sizes to the widest of multiple axes', () => {
		const narrow: AxisConfig = {position: 'left', formatters: [intFormatter]};
		const wide: AxisConfig = {position: 'right', formatters: [intFormatter]};

		const width = computeVAxisColumnWidth(
			[narrow, wide],
			rangeResolver([[narrow, {min: 0, max: 9}], [wide, {min: -1000000, max: 0}]]),
		);

		const wideOnly = computeVAxisColumnWidth([wide], rangeResolver([[wide, {min: -1000000, max: 0}]]));
		expect(width).to.equal(wideOnly);
	});

	it('honours a custom minimum width', () => {
		const axis: AxisConfig = {position: 'left', formatters: [intFormatter]};
		const width = computeVAxisColumnWidth([axis], rangeResolver([[axis, {min: 0, max: 9}]]), 120);
		expect(width).to.equal(120);
	});
});
