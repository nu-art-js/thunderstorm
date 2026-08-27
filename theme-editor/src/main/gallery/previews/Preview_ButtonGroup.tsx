import * as React from 'react';
import {useState} from 'react';
import {TS_ButtonGroup} from '@nu-art/thunder-widgets/v3';
import {PreviewSample, PreviewSampleColumn} from '../PreviewSamples.js';

type GroupKey = 'left' | 'center' | 'right';

const buttons = [
	{key: 'left' as GroupKey, label: 'Left'},
	{key: 'center' as GroupKey, label: 'Center'},
	{key: 'right' as GroupKey, label: 'Right'},
];

const DemoButtonGroup: React.FC<{direction: 'horizontal' | 'vertical'; defaultKey: GroupKey}> = props => {
	const [selectedKey, setSelectedKey] = useState(props.defaultKey);
	return (
		<TS_ButtonGroup<GroupKey>
			direction={props.direction}
			controlled
			selectedKey={selectedKey}
			clickCallback={setSelectedKey}
			buttons={buttons}
		/>
	);
};

export const Preview_ButtonGroup: React.FC = () => (
	<PreviewSampleColumn>
		<PreviewSample label={'horizontal'}>
			<DemoButtonGroup direction={'horizontal'} defaultKey={'center'}/>
		</PreviewSample>
		<PreviewSample label={'vertical'}>
			<DemoButtonGroup direction={'vertical'} defaultKey={'left'}/>
		</PreviewSample>
	</PreviewSampleColumn>
);
