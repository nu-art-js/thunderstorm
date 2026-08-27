import * as React from 'react';
import {TS_Link} from '@nu-art/thunder-widgets/v3';
import {PreviewSample, PreviewSampleColumn} from '../PreviewSamples.js';

export const Preview_Link: React.FC = () => (
	<PreviewSampleColumn>
		<PreviewSample label={'default'}>
			<TS_Link url={'/'}>Open link</TS_Link>
		</PreviewSample>
		<PreviewSample label={'hover'}>
			<TS_Link url={'/'} className={'pseudo-hover'}>Hovered link</TS_Link>
		</PreviewSample>
	</PreviewSampleColumn>
);
