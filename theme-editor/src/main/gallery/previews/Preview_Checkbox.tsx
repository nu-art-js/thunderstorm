import * as React from 'react';
import {useState} from 'react';
import {Props_TS_CheckboxV2, TS_Checkbox} from '@nu-art/thunder-widgets/v3';
import {PreviewSample, PreviewSampleColumn} from '../PreviewSamples.js';

const DemoCheckbox: React.FC<Partial<Props_TS_CheckboxV2> & {initial?: boolean}> = props => {
	const {initial, ...rest} = props;
	const [checked, setChecked] = useState<boolean | undefined>(initial);
	return <TS_Checkbox label={'Label'} {...rest} checked={checked} onCheck={setChecked}/>;
};

export const Preview_Checkbox: React.FC = () => (
	<PreviewSampleColumn>
		<PreviewSample label={'unchecked'}>
			<DemoCheckbox initial={false}/>
		</PreviewSample>
		<PreviewSample label={'checked'}>
			<DemoCheckbox initial={true}/>
		</PreviewSample>
		<PreviewSample label={'indeterminate'}>
			<DemoCheckbox initial={undefined}/>
		</PreviewSample>
		<PreviewSample label={'disabled'}>
			<DemoCheckbox initial={true} disabled={true}/>
		</PreviewSample>
	</PreviewSampleColumn>
);
