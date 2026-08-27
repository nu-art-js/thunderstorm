import * as React from 'react';
import {useState} from 'react';
import {TS_ColorSwatch} from '@nu-art/thunder-widgets/v3';
import {PreviewSample, PreviewSampleColumn} from '../PreviewSamples.js';

const DemoSwatch: React.FC<{initial: string; showHex?: boolean; disabled?: boolean}> = props => {
	const [color, setColor] = useState(props.initial);
	return <TS_ColorSwatch value={color} showHex={props.showHex} disabled={props.disabled} onChange={setColor}/>;
};

export const Preview_ColorSwatch: React.FC = () => (
	<PreviewSampleColumn>
		<PreviewSample label={'swatch'}>
			<DemoSwatch initial={'#5b6472'}/>
		</PreviewSample>
		<PreviewSample label={'with hex'}>
			<DemoSwatch initial={'#7a72a8'} showHex/>
		</PreviewSample>
		<PreviewSample label={'disabled'}>
			<DemoSwatch initial={'#7c9a7c'} showHex disabled/>
		</PreviewSample>
	</PreviewSampleColumn>
);
