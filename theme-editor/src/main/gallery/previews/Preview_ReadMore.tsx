import * as React from 'react';
import {TS_ReadMore} from '@nu-art/thunder-widgets/v3';
import {PreviewSample, PreviewSampleColumn} from '../PreviewSamples.js';

const LongText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod '
	+ 'tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, '
	+ 'quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';

export const Preview_ReadMore: React.FC = () => (
	<PreviewSampleColumn className={'dl-preview-column--rows'}>
		<PreviewSample label={'collapsed'} className={'dl-preview-sample--field'}>
			<TS_ReadMore text={LongText} collapsedHeight={40}/>
		</PreviewSample>
	</PreviewSampleColumn>
);
