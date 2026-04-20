import type {DataPoint} from './types.js';

export function interpolateAt(data: DataPoint[], t: number): number {
	if (t <= data[0].h)
		return data[0].v;

	if (t >= data[data.length - 1].h)
		return data[data.length - 1].v;

	let lo = 0;
	let hi = data.length - 1;
	while (lo < hi - 1) {
		const mid = (lo + hi) >> 1;
		if (data[mid].h <= t)
			lo = mid;
		else
			hi = mid;
	}

	const dt = data[hi].h - data[lo].h;
	if (dt === 0)
		return data[lo].v;

	return data[lo].v + (data[hi].v - data[lo].v) * (t - data[lo].h) / dt;
}

export function resampledDelta(accumulated: DataPoint[], bucketMs: number): DataPoint[] {
	if (accumulated.length < 2)
		return [];

	const tMin = accumulated[0].h;
	const tMax = accumulated[accumulated.length - 1].h;
	if (tMax - tMin < bucketMs)
		return [];

	const result: DataPoint[] = [];
	let prevValue = interpolateAt(accumulated, tMin);

	for (let t = tMin + bucketMs; t <= tMax; t += bucketMs) {
		const value = interpolateAt(accumulated, t);
		result.push({h: t, v: value - prevValue});
		prevValue = value;
	}

	return result;
}

// --- PCHIP (Piecewise Cubic Hermite Interpolating Polynomial) ---
// Fritsch & Carlson 1980 — monotonicity-preserving cubic interpolation.
// Used to derive a smooth rate curve from staircase-like cumulative data
// (e.g. YouTube view counts that update in bursts).

function pchipTangents(data: DataPoint[]): number[] {
	const n = data.length;
	if (n < 2)
		throw new Error('pchipTangents requires at least 2 points');

	const h: number[] = new Array(n - 1);
	const d: number[] = new Array(n - 1);
	for (let k = 0; k < n - 1; k++) {
		h[k] = data[k + 1].h - data[k].h;
		d[k] = h[k] === 0 ? 0 : (data[k + 1].v - data[k].v) / h[k];
	}

	if (n === 2)
		return [d[0], d[0]];

	const m: number[] = new Array(n);

	for (let k = 1; k < n - 1; k++) {
		if (d[k - 1] * d[k] <= 0) {
			m[k] = 0;
		} else {
			const w1 = 2 * h[k] + h[k - 1];
			const w2 = h[k] + 2 * h[k - 1];
			m[k] = (w1 + w2) / (w1 / d[k - 1] + w2 / d[k]);
		}
	}

	m[0] = endpointTangent(h[0], h[1], d[0], d[1]);
	m[n - 1] = endpointTangent(h[n - 2], h[n - 3], d[n - 2], d[n - 3]);

	return m;
}

function endpointTangent(h0: number, h1: number, d0: number, d1: number): number {
	let t = ((2 * h0 + h1) * d0 - h0 * d1) / (h0 + h1);

	if (Math.sign(t) !== Math.sign(d0))
		t = 0;
	else if (Math.sign(d0) !== Math.sign(d1) && Math.abs(t) > 3 * Math.abs(d0))
		t = 3 * d0;

	return t;
}

function findInterval(data: DataPoint[], t: number): number {
	let lo = 0;
	let hi = data.length - 2;
	while (lo < hi) {
		const mid = (lo + hi) >> 1;
		if (data[mid + 1].h <= t)
			lo = mid + 1;
		else
			hi = mid;
	}
	return lo;
}

function pchipDerivativeAt(data: DataPoint[], tangents: number[], t: number): number {
	const k = findInterval(data, t);
	const hk = data[k + 1].h - data[k].h;
	if (hk === 0)
		return 0;

	const s = (t - data[k].h) / hk;
	const dk = (data[k + 1].v - data[k].v) / hk;

	return (6 * s - 6 * s * s) * dk
		+ (3 * s * s - 4 * s + 1) * tangents[k]
		+ (3 * s * s - 2 * s) * tangents[k + 1];
}

/**
 * Smooth rate curve via PCHIP differentiation of cumulative data.
 *
 * Fits a monotonicity-preserving cubic spline through the cumulative points,
 * then evaluates the derivative at regular intervals. The output value at each
 * point represents the instantaneous rate scaled to "change per evaluationIntervalMs",
 * making it directly comparable to resampledDelta at the same interval.
 */
export function smoothRate(accumulated: DataPoint[], evaluationIntervalMs: number): DataPoint[] {
	if (accumulated.length < 2)
		return [];

	const tMin = accumulated[0].h;
	const tMax = accumulated[accumulated.length - 1].h;
	if (tMax - tMin < evaluationIntervalMs)
		return [];

	const tangents = pchipTangents(accumulated);
	const result: DataPoint[] = [];

	for (let t = tMin; t <= tMax; t += evaluationIntervalMs) {
		const rate = pchipDerivativeAt(accumulated, tangents, t);
		result.push({h: t, v: rate * evaluationIntervalMs});
	}

	return result;
}
