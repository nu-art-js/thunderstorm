import * as React from 'react';
import {useMemo, useState} from 'react';
import {TS_DropDown} from '../../main/adapter/dropdown/v1/TS_DropDown.js';
import {SimpleListAdapter} from '../../main/adapter/Adapter.js';

const items = ['Option A', 'Option B', 'Option C'];

export default function EntryDropdownV1() {
	const [selected, setSelected] = useState<string | undefined>();
	const adapter = useMemo(() => SimpleListAdapter(items, (props) => <div>{props.item}</div>), []);

	return (
		<div data-testid="dropdown-container">
			<TS_DropDown
				adapter={adapter}
				onSelected={setSelected}
				selected={selected}
			/>
		</div>
	);
}
