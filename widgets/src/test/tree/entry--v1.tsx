import * as React from 'react';
import {useMemo} from 'react';
import {TS_Tree} from '../../main/adapter/tree/v1/TS_Tree.js';
import {SimpleTreeAdapter} from '../../main/adapter/Adapter.js';

const data = {root: {a: 'Node A', b: {c: 'Node C'}}};

export default function EntryTreeV1() {
	const adapter = useMemo(() => SimpleTreeAdapter(data, (props) => <div>{String(props.item)}</div>), []);

	return (
		<div data-testid="tree-container">
			<TS_Tree id="test-tree" adapter={adapter}/>
		</div>
	);
}
