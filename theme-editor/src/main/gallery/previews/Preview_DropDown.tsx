import * as React from 'react';
import {useState} from 'react';
import {NodeRendererProps, SimpleListAdapter, TS_DropDown} from '@nu-art/thunder-widgets/v3';
import {PreviewSample, PreviewSampleColumn} from '../PreviewSamples.js';

const Options = ['Apple', 'Banana', 'Cherry'];
const adapter = SimpleListAdapter(Options, (props: NodeRendererProps<string>) => <div>{props.item}</div>);
const caret = {open: <span>{'▴'}</span>, close: <span>{'▾'}</span>};

const DemoDropDown: React.FC<{disabled?: boolean; initialSelected?: string}> = props => {
	const [selected, setSelected] = useState<string | undefined>(props.initialSelected);
	return <TS_DropDown<string>
		adapter={adapter}
		selected={selected}
		disabled={props.disabled}
		placeholder={'Select…'}
		caret={caret}
		onSelected={value => setSelected(value)}
	/>;
};

export const Preview_DropDown: React.FC = () => (
	<PreviewSampleColumn>
		<PreviewSample label={'default'} className={'dl-preview-sample--field'}>
			<DemoDropDown/>
		</PreviewSample>
		<PreviewSample label={'selected'} className={'dl-preview-sample--field'}>
			<DemoDropDown initialSelected={Options[1]}/>
		</PreviewSample>
		<PreviewSample label={'disabled'} className={'dl-preview-sample--field'}>
			<DemoDropDown disabled={true}/>
		</PreviewSample>
	</PreviewSampleColumn>
);
