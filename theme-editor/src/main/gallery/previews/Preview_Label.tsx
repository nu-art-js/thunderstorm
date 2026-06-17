import * as React from 'react';
import {Label} from '@nu-art/thunder-widgets/v3';
import {PreviewSample, PreviewSampleColumn} from '../PreviewSamples.js';

const longText = 'This is a long label that truncates when the container is narrow';

export const Preview_Label: React.FC = () => (
	<PreviewSampleColumn>
		<PreviewSample label={'default'}>
			<Label>Field label</Label>
		</PreviewSample>
		<PreviewSample label={'truncated'} className={'dl-preview-sample--field'}>
			<Label tooltip={longText}>{longText}</Label>
		</PreviewSample>
	</PreviewSampleColumn>
);
