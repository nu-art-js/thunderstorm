import * as React from 'react';
import {useState} from 'react';
import {TS_Radio} from '@nu-art/thunder-widgets/v3';
import {PreviewSample, PreviewSampleColumn} from '../PreviewSamples.js';

const Options = ['Option A', 'Option B', 'Option C'];

const DemoRadio: React.FC<{group: string; disabled?: boolean}> = props => {
	const [checked, setChecked] = useState<string>(Options[0]);
	return <TS_Radio<string>
		values={Options}
		groupName={props.group}
		checked={checked}
		disabled={props.disabled}
		onCheck={value => setChecked(value)}
	/>;
};

/** Enabled and disabled on separate rows — radio group is vertical by default. */
export const Preview_Radio: React.FC = () => (
	<PreviewSampleColumn className={'dl-preview-column--rows'}>
		<PreviewSample label={'enabled'}>
			<DemoRadio group={'dl-radio-enabled'}/>
		</PreviewSample>
		<PreviewSample label={'disabled'}>
			<DemoRadio group={'dl-radio-disabled'} disabled={true}/>
		</PreviewSample>
	</PreviewSampleColumn>
);
