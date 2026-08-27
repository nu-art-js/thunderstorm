import * as React from 'react';

/**
 * One entry in the design-language gallery: a single Thunderstorm widget and the
 * preview that renders it across its permutation matrix.
 *
 * `id` mirrors the styles-components scss 1:1 (e.g. id 'button' <-> components/_button.scss),
 * so a tokenized class and its visual reference stay in lockstep. Adding a widget is
 * one preview file + one registry line; the gallery page never changes.
 */
export type ComponentPreview = {
	id: string;
	title: string;
	renderer: React.ComponentType;
	/**
	 * Preview layout tier — drives gallery grouping and panel sizing.
	 * - `matrix` — variant × state grid (button, input)
	 * - `row`    — labelled samples in a wrapping row (checkbox, textarea, …)
	 */
	layout?: 'matrix' | 'row';
};

/**
 * A named permutation of a widget — one cell axis in a preview's matrix.
 * `props` are spread onto the rendered widget; `label` annotates the row/column.
 */
export type PreviewPermutation<P> = {
	label: string;
	props: Partial<P>;
};
