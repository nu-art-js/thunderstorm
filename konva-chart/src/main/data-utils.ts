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
