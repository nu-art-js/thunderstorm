import * as React from 'react';
import {TS_CircularLoader} from '@nu-art/thunder-widgets/v3';
import {PreviewSample, PreviewSampleColumn} from '../PreviewSamples.js';

export const Preview_Loader: React.FC = () => (
	<PreviewSampleColumn>
		<PreviewSample label={'default'}>
			<TS_CircularLoader/>
		</PreviewSample>
	</PreviewSampleColumn>
);
