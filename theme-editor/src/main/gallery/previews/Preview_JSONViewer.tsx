import * as React from 'react';
import {TS_JSONViewer} from '@nu-art/thunder-widgets/v3';
import {PreviewSample, PreviewSampleColumn} from '../PreviewSamples.js';

const Sample = {
	name: 'Beamz',
	active: true,
	count: 42,
	ratio: 0.5,
	nested: {label: 'child', enabled: false}
};

export const Preview_JSONViewer: React.FC = () => (
	<PreviewSampleColumn className={'dl-preview-column--rows'}>
		<PreviewSample label={'object'} className={'dl-preview-sample--field'}>
			<TS_JSONViewer item={Sample}/>
		</PreviewSample>
	</PreviewSampleColumn>
);
