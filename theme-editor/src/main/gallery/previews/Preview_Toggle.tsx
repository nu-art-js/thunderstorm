import * as React from 'react';
import {useState} from 'react';
import {TS_Toggle} from '@nu-art/thunder-widgets/v3';
import {PreviewSample, PreviewSampleColumn} from '../PreviewSamples.js';

const DemoToggle: React.FC<{initial: boolean; disabled?: boolean}> = props => {
	const [checked, setChecked] = useState(props.initial);
	return <TS_Toggle checked={checked} disabled={props.disabled} onCheck={setChecked}/>;
};

export const Preview_Toggle: React.FC = () => (
	<PreviewSampleColumn>
		<PreviewSample label={'off'}>
			<DemoToggle initial={false}/>
		</PreviewSample>
		<PreviewSample label={'on'}>
			<DemoToggle initial={true}/>
		</PreviewSample>
		<PreviewSample label={'disabled'}>
			<DemoToggle initial={true} disabled={true}/>
		</PreviewSample>
	</PreviewSampleColumn>
);
