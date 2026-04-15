import * as React from 'react';
import {TS_Tree as TS_TreeV1, Props_Tree} from '../v1/TS_Tree.js';

export function TS_Tree(props: Props_Tree): React.ReactElement {
	return <TS_TreeV1 {...props}/>;
}
