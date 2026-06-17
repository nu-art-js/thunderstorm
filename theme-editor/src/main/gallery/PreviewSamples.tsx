import * as React from 'react';
import {TS_PropRenderer} from '@nu-art/thunder-widgets/v3';
import './PreviewSamples.scss';

/** One labelled widget sample — always TS_PropRenderer.Vertical. */
export const PreviewSample: React.FC<{
	label: string;
	children: React.ReactNode;
	className?: string;
}> = props => (
	<TS_PropRenderer.Vertical
		className={['dl-preview-sample', props.className].filter(Boolean).join(' ')}
		label={props.label}
	>
		{props.children}
	</TS_PropRenderer.Vertical>
);

/** Vertical stack of labelled samples (checkbox, toggle, dropdown, …). */
export const PreviewSampleColumn: React.FC<{
	children: React.ReactNode;
	className?: string;
}> = props => (
	<div className={['dl-preview-column', props.className].filter(Boolean).join(' ')}>
		{props.children}
	</div>
);

/** Horizontal band of labelled samples (input rows, radio enabled/disabled rows). */
export const PreviewSampleRow: React.FC<{children: React.ReactNode}> = props => (
	<div className={'dl-preview-row'}>{props.children}</div>
);
