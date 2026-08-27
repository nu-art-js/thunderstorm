import * as React from 'react';
import {TS_Input} from '@nu-art/thunder-widgets/v3';
import {PreviewSample, PreviewSampleColumn, PreviewSampleRow} from '../PreviewSamples.js';
import {PreviewInputFixedSelection} from './PreviewInputFixedSelection.js';

const Placeholder = 'Type something…';

export const Preview_Input: React.FC = () => (
	<PreviewSampleColumn className={'dl-preview-column--rows'}>
		<PreviewSampleRow>
			<PreviewSample label={'empty'} className={'dl-preview-sample--field'}>
				<TS_Input type={'text'} placeholder={Placeholder}/>
			</PreviewSample>
			<PreviewSample label={'filled'} className={'dl-preview-sample--field'}>
				<TS_Input type={'text'} value={'Sample value'}/>
			</PreviewSample>
			<PreviewSample label={'fixed selection'} className={'dl-preview-sample--field'}>
				<PreviewInputFixedSelection/>
			</PreviewSample>
			<PreviewSample label={'error'} className={'dl-preview-sample--field'}>
				<TS_Input type={'text'} value={'Invalid'} error={{level: 'error', message: 'Required'}}/>
			</PreviewSample>
		</PreviewSampleRow>

		<PreviewSampleRow>
			<PreviewSample label={'disabled empty'} className={'dl-preview-sample--field'}>
				<TS_Input type={'text'} disabled placeholder={Placeholder}/>
			</PreviewSample>
			<PreviewSample label={'disabled filled'} className={'dl-preview-sample--field'}>
				<TS_Input type={'text'} disabled value={'Sample value'}/>
			</PreviewSample>
		</PreviewSampleRow>

		<PreviewSampleRow>
			<PreviewSample label={'filled'} className={'dl-preview-sample--field'}>
				<TS_Input type={'password'} value={'secret'}/>
			</PreviewSample>
			<PreviewSample label={'disabled filled'} className={'dl-preview-sample--field'}>
				<TS_Input type={'password'} disabled value={'secret'}/>
			</PreviewSample>
		</PreviewSampleRow>
	</PreviewSampleColumn>
);
