import * as React from 'react';
import {useState} from 'react';
import {TS_Slider} from '@nu-art/thunder-widgets/v3';
import {PreviewSample, PreviewSampleColumn} from '../PreviewSamples.js';

const DemoSlider: React.FC<{startValue?: number}> = props => {
	const [value, setValue] = useState(props.startValue ?? 50);
	return <TS_Slider min={0} max={100} value={value} startValue={props.startValue}
										 onValueChanged={setValue} onValueSet={setValue}/>;
};

export const Preview_Slider: React.FC = () => (
	<PreviewSampleColumn>
		<PreviewSample label={'default'} className={'dl-preview-sample--field'}>
			<DemoSlider startValue={50}/>
		</PreviewSample>
	</PreviewSampleColumn>
);
