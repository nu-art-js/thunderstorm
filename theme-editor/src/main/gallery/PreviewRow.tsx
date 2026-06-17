import * as React from 'react';

export type PreviewSample = {
	/** Annotates the sample (e.g. 'checked', 'disabled'). */
	label: string;
	/** The real widget instance for this state. */
	node: React.ReactNode;
};

/**
 * State-axis layout: a wrapping row of labelled widget instances. Used by widgets whose
 * permutations are states (checkbox, radio, toggle, dropdown, textarea) rather than the
 * variant × state matrix that {@link PreviewGrid} renders. Each sample owns its own state,
 * so the gallery stays declarative.
 */
export const PreviewRow = (props: {
	samples: PreviewSample[];
	/** Extra class on the row root (e.g. dl-row--fields for fixed-width field demos). */
	className?: string;
}) => (
	<div className={['dl-row', props.className].filter(Boolean).join(' ')}>
		{props.samples.map(sample => (
			<div key={sample.label} className={'dl-row__item'}>
				<span className={'dl-row__label'}>{sample.label}</span>
				<div className={'dl-row__node'}>{sample.node}</div>
			</div>
		))}
	</div>
);
