import * as React from 'react';
import {TS_Icons} from '@nu-art/ts-styles';
import {PreviewSample, PreviewSampleColumn} from '../PreviewSamples.js';

const XIcon = TS_Icons.x.component;

export const Preview_IconButton: React.FC = () => (
	<PreviewSampleColumn>
		<PreviewSample label={'default'}>
			<div className={'ts-icon-button'} role={'presentation'}>
				<XIcon/>
			</div>
		</PreviewSample>
		<PreviewSample label={'hover'}>
			<div className={'ts-icon-button pseudo-hover'} role={'presentation'}>
				<XIcon/>
			</div>
		</PreviewSample>
		<PreviewSample label={'disabled'}>
			<div className={'ts-icon-button disabled'} role={'presentation'}>
				<XIcon/>
			</div>
		</PreviewSample>
	</PreviewSampleColumn>
);
