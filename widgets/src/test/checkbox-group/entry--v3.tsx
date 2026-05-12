import * as React from 'react';
import {TS_CheckboxGroup} from '../../main/checkbox-group/v3/TS_CheckboxGroup.js';

export default function EntryCheckboxGroupV3() {
	const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
	return (
		<div data-testid="checkbox-group-v3-container">
			<TS_CheckboxGroup
				parent={{id: 'p', label: 'Parent v3'}}
				options={[{id: 'a', label: 'A'}, {id: 'b', label: 'B'}]}
				selectedIds={selectedIds}
				onChange={setSelectedIds}
			/>
		</div>
	);
}
