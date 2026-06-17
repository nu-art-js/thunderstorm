import * as React from 'react';
import {useState} from 'react';
import {Props_TS_TextAreaV2, TS_TextArea} from '@nu-art/thunder-widgets/v3';
import {PreviewSample, PreviewSampleColumn, PreviewSampleRow} from '../PreviewSamples.js';

const DemoTextArea: React.FC<Partial<Props_TS_TextAreaV2>> = props => {
	const [value, setValue] = useState(props.value ?? '');
	return <TS_TextArea className={'no-resize'} {...props} value={value} onChange={setValue}/>;
};

export const Preview_Textarea: React.FC = () => (
	<PreviewSampleColumn>
		<PreviewSampleRow>
			<PreviewSample label={'empty'} className={'dl-preview-sample--field'}>
				<DemoTextArea placeholder={'Type something…'}/>
			</PreviewSample>
			<PreviewSample label={'filled'} className={'dl-preview-sample--field'}>
				<DemoTextArea value={'Sample value'}/>
			</PreviewSample>
		</PreviewSampleRow>
		<PreviewSampleRow>
			<PreviewSample label={'error'} className={'dl-preview-sample--field'}>
				<DemoTextArea value={'Invalid'} error={{level: 'error', message: 'error'}}/>
			</PreviewSample>
			<PreviewSample label={'disabled'} className={'dl-preview-sample--field'}>
				<DemoTextArea value={'Disabled'} disabled={true}/>
			</PreviewSample>
		</PreviewSampleRow>
	</PreviewSampleColumn>
);
