/*
 * @nu-art/thunder-widgets — Window math for a fixed or variable virtual list
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

/** Painted height of one knowledge tree row. The list writes this to `--wired-tree-row-height`. */
export const TreeList_RowHeight = 28;

/** Empty pixels after the last row so the final row can clear the pane edge. */
export const TreeList_ScrollTail = 8;

/** Extra rows mounted above and below the viewport. */
export const TreeList_Overscan = 8;

export type VirtualLayout = {
	total: number;
	offsetAt: (index: number) => number;
	heightAt: (index: number) => number;
};

/**
 * Prefix offsets for `count` rows.
 * A numeric `itemHeight` stays O(1). A function is read once per index.
 */
export const virtualLayout = (
	count: number,
	itemHeight: number | ((index: number) => number),
): VirtualLayout => {
	if (typeof itemHeight === 'number') {
		const height = itemHeight;
		return {
			total: count * height,
			offsetAt: index => index * height,
			heightAt: () => height,
		};
	}

	const offsets = new Array<number>(count);
	let total = 0;
	for (let index = 0; index < count; index++) {
		offsets[index] = total;
		total += itemHeight(index);
	}

	return {
		total,
		offsetAt: index => offsets[index] ?? total,
		heightAt: itemHeight,
	};
};

export type VirtualSlice = {
	start: number;
	end: number;
};

/**
 * Half-open range of rows that intersect the viewport, plus `overscan` on each side.
 * `end` is exclusive. An empty viewport mounts nothing.
 */
export const virtualSlice = (
	count: number,
	scrollTop: number,
	viewport: number,
	layout: VirtualLayout,
	overscan: number,
): VirtualSlice => {
	if (count === 0 || viewport <= 0)
		return {start: 0, end: 0};

	let low = 0;
	let high = count - 1;
	while (low < high) {
		const mid = (low + high) >> 1;
		if (layout.offsetAt(mid) + layout.heightAt(mid) <= scrollTop)
			low = mid + 1;
		else
			high = mid;
	}

	const start = Math.max(0, low - overscan);
	const bottom = scrollTop + viewport;
	let end = low;
	while (end < count && layout.offsetAt(end) < bottom)
		end++;

	return {start, end: Math.min(count, end + overscan)};
};
