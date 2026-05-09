import {expect} from 'chai';
import {applyZoomFraction, computeRange, viewportToZoom, zoomToViewport} from '../main/chart-range.js';
import type {AxisConfig} from '../main/types.js';
import type {ResolvedRange, ZoomFraction} from '../main/chart-range.js';

const timeAxis: AxisConfig = {key: 'time', range: [undefined, undefined]};
const vAxis: AxisConfig = {key: 'views', range: [0, undefined]};

function makeStableFullVRange(allValues: number[]): ResolvedRange {
	return computeRange(vAxis, allValues);
}

function makeAutoScaledVRange(allValues: number[], hRange: ResolvedRange, timestamps: number[]): ResolvedRange {
	const filtered = allValues.filter((_v, i) => timestamps[i] >= hRange.min && timestamps[i] <= hRange.max);
	return computeRange(vAxis, filtered);
}

describe('Zoom composition', () => {

	describe('viewportToZoom ↔ zoomToViewport roundtrip', () => {
		it('roundtrips through any full range', () => {
			const full: ResolvedRange = {min: 100, max: 500};
			const viewport = {min: 200, max: 400};
			const zoom = viewportToZoom(full, viewport);
			const back = zoomToViewport(full, zoom);
			expect(back.min).to.be.closeTo(viewport.min, 0.001);
			expect(back.max).to.be.closeTo(viewport.max, 0.001);
		});

		it('roundtrips with out-of-range viewport', () => {
			const full: ResolvedRange = {min: 0, max: 100};
			const viewport = {min: 50, max: 150};
			const zoom = viewportToZoom(full, viewport);
			const back = zoomToViewport(full, zoom);
			expect(back.min).to.be.closeTo(viewport.min, 0.001);
			expect(back.max).to.be.closeTo(viewport.max, 0.001);
		});
	});

	describe('V zoom stability across H zoom changes', () => {
		const timestamps = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
		const values = [0, 10_000, 30_000, 50_000, 70_000, 80_000, 85_000, 88_000, 90_000, 95_000, 100_000];

		it('V zoom fraction against stable range gives same result regardless of H zoom', () => {
			const stableFull = makeStableFullVRange(values);
			const vZoom: ZoomFraction = {min: 0.3, max: 0.7};

			const resultNoH = applyZoomFraction(stableFull, vZoom);

			const hFull = computeRange(timeAxis, timestamps);
			const hZoom: ZoomFraction = {min: 0.2, max: 0.6};
			const hRange = applyZoomFraction(hFull, hZoom);
			const autoScaled = makeAutoScaledVRange(values, hRange, timestamps);

			const resultWithHStable = applyZoomFraction(stableFull, vZoom);
			expect(resultWithHStable.min).to.equal(resultNoH.min);
			expect(resultWithHStable.max).to.equal(resultNoH.max);

			const resultWithHAutoScaled = applyZoomFraction(autoScaled, vZoom);
			expect(resultWithHAutoScaled.min).to.not.equal(resultNoH.min);
		});

		it('auto-scaled V range differs from stable when H is zoomed', () => {
			const stableFull = makeStableFullVRange(values);
			const hFull = computeRange(timeAxis, timestamps);
			const hZoom: ZoomFraction = {min: 0.0, max: 0.5};
			const hRange = applyZoomFraction(hFull, hZoom);
			const autoScaled = makeAutoScaledVRange(values, hRange, timestamps);

			expect(autoScaled.max).to.be.lessThan(stableFull.max);
		});
	});

	describe('Area zoom batching', () => {
		it('collecting H and V updates preserves both', () => {
			const hFull: ResolvedRange = {min: 0, max: 1000};
			const vFull: ResolvedRange = {min: 0, max: 50_000};

			const hZoom: ZoomFraction = {min: 0.2, max: 0.8};
			const vZoom: ZoomFraction = {min: 0.3, max: 0.7};

			const viewport: Record<string, {min: number; max: number}> = {};
			viewport['time'] = zoomToViewport(hFull, hZoom);
			viewport['views'] = zoomToViewport(vFull, vZoom);

			expect(Object.keys(viewport)).to.have.length(2);
			expect(viewport['time'].min).to.be.closeTo(200, 0.1);
			expect(viewport['time'].max).to.be.closeTo(800, 0.1);
			expect(viewport['views'].min).to.be.closeTo(15_000, 0.1);
			expect(viewport['views'].max).to.be.closeTo(35_000, 0.1);
		});

		it('sequential single-axis updates overwrite each other in controlled mode', () => {
			const hFull: ResolvedRange = {min: 0, max: 1000};
			const vFull: ResolvedRange = {min: 0, max: 50_000};
			const existingViewport: Record<string, {min: number; max: number}> = {};

			const firstUpdate = {...existingViewport};
			firstUpdate['time'] = zoomToViewport(hFull, {min: 0.2, max: 0.8});

			const secondUpdate = {...existingViewport};
			secondUpdate['views'] = zoomToViewport(vFull, {min: 0.3, max: 0.7});

			expect(secondUpdate['time']).to.be.undefined;

			const batchedUpdate = {...existingViewport};
			batchedUpdate['time'] = zoomToViewport(hFull, {min: 0.2, max: 0.8});
			batchedUpdate['views'] = zoomToViewport(vFull, {min: 0.3, max: 0.7});

			expect(batchedUpdate['time']).to.not.be.undefined;
			expect(batchedUpdate['views']).to.not.be.undefined;
		});
	});

	describe('Zoom composition sequences', () => {
		it('V then H: V zoom maps to intended range using stable base', () => {
			const timestamps = [0, 25, 50, 75, 100];
			const values = [0, 25_000, 50_000, 75_000, 100_000];

			const stableVFull = makeStableFullVRange(values);

			const vZoom: ZoomFraction = {min: 0.25, max: 0.75};
			const vResult = applyZoomFraction(stableVFull, vZoom);

			const hFull = computeRange(timeAxis, timestamps);
			const hZoom: ZoomFraction = {min: 0.0, max: 0.5};
			applyZoomFraction(hFull, hZoom);

			const vResultAfterH = applyZoomFraction(stableVFull, vZoom);
			expect(vResultAfterH.min).to.equal(vResult.min);
			expect(vResultAfterH.max).to.equal(vResult.max);
		});

		it('H then V then deeper H: V stays stable', () => {
			const values = [0, 20_000, 40_000, 60_000, 80_000, 100_000];
			const stableVFull = makeStableFullVRange(values);

			const vZoom: ZoomFraction = {min: 0.2, max: 0.8};
			const expected = applyZoomFraction(stableVFull, vZoom);

			const result = applyZoomFraction(stableVFull, vZoom);
			expect(result.min).to.be.closeTo(expected.min, 0.001);
			expect(result.max).to.be.closeTo(expected.max, 0.001);
		});

		it('nested V zoom composes correctly', () => {
			const stableVFull: ResolvedRange = {min: 0, max: 100};

			const firstVZoom: ZoomFraction = {min: 0.2, max: 0.8};
			const firstRange = applyZoomFraction(stableVFull, firstVZoom);
			expect(firstRange.min).to.be.closeTo(20, 0.1);
			expect(firstRange.max).to.be.closeTo(80, 0.1);

			const innerTopFrac = 0.25;
			const innerBottomFrac = 0.75;
			const innerSpan = firstVZoom.max - firstVZoom.min;
			const composedVZoom: ZoomFraction = {
				min: firstVZoom.min + (1 - innerBottomFrac) * innerSpan,
				max: firstVZoom.min + (1 - innerTopFrac) * innerSpan,
			};

			const secondRange = applyZoomFraction(stableVFull, composedVZoom);
			expect(secondRange.min).to.be.closeTo(35, 0.1);
			expect(secondRange.max).to.be.closeTo(65, 0.1);
		});
	});
});
