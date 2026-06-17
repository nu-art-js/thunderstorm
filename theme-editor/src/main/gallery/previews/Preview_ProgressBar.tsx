import * as React from 'react';
import {TS_ProgressBar} from '@nu-art/thunder-widgets/v3';
import {PreviewSample, PreviewSampleColumn} from '../PreviewSamples.js';

export const Preview_ProgressBar: React.FC = () => (
	<PreviewSampleColumn>
		<PreviewSample label={'linear'}>
			<TS_ProgressBar type={'linear-bar'} ratios={[0.65]}/>
		</PreviewSample>
		<PreviewSample label={'radial'}>
			<TS_ProgressBar type={'radial'} ratios={[0.65]} radius={30}/>
		</PreviewSample>
	</PreviewSampleColumn>
);
