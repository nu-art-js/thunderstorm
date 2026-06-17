import * as React from 'react';
import {useState} from 'react';
import {TS_CheckboxGroup} from '@nu-art/thunder-widgets/v3';
import {PreviewSample, PreviewSampleColumn} from '../PreviewSamples.js';

const options = [
	{id: 'a', label: 'Option A'},
	{id: 'b', label: 'Option B'},
	{id: 'c', label: 'Option C'},
];

export const Preview_CheckboxGroup: React.FC = () => {
	const [selected, setSelected] = useState<string[]>(['a']);

	return (
		<PreviewSampleColumn>
			<PreviewSample label={'partial'}>
				<TS_CheckboxGroup
					parent={{id: 'all', label: 'Select all'}}
					options={options}
					selectedIds={selected}
					onChange={setSelected}
				/>
			</PreviewSample>
			<PreviewSample label={'all selected'}>
				<TS_CheckboxGroup
					parent={{id: 'all', label: 'Select all'}}
					options={options}
					selectedIds={options.map(o => o.id)}
					onChange={() => undefined}
				/>
			</PreviewSample>
		</PreviewSampleColumn>
	);
};
