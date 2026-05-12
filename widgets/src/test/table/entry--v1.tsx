import * as React from 'react';
import {TS_Table} from '../../main/table/v1/TS_Table.js';

type Row = { name: string; value: number };

export default function EntryTableV1() {
	return (
		<div data-testid="table-v1-container">
			<TS_Table<Row>
				header={[{header: 'name'}, {header: 'value'}]}
				rows={[{name: 'Row1', value: 1}, {name: 'Row2', value: 2}]}
				cellRenderer={(prop, item) => <>{item[prop]}</>}
			/>
		</div>
	);
}
