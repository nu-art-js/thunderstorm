import * as React from 'react';
import {TS_Toast} from '@nu-art/thunder-widgets/v3';
import {PreviewSample, PreviewSampleColumn} from '../PreviewSamples.js';

const variants = ['info', 'success', 'warning', 'error'] as const;

export const Preview_Toast: React.FC = () => (
	<PreviewSampleColumn>
		{variants.map(variant => (
			<PreviewSample key={variant} label={variant}>
				{TS_Toast(`${variant} message`, variant)}
			</PreviewSample>
		))}
	</PreviewSampleColumn>
);
