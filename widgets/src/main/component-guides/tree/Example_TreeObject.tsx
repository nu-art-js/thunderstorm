import * as React from 'react';
import {useMemo} from 'react';
import {AdapterBuilder} from '../../adapter/Adapter.js';
import {NodeRendererProps} from '../../adapter/BaseRenderer.js';
import {TreeExpandCollapseChevron, wrapTreeNodeWithCaret} from '../../adapter/tree/TreeCaret.js';
import {TS_Tree} from '../../adapter/tree/v3/TS_Tree.js';

const objectTreeData = {
	workspace: {
		components: {
			Button: 'widget',
			Input: 'widget',
			Tree: 'widget',
		},
		tokens: {
			colors: 'group',
			typography: 'group',
		},
	},
	settings: {
		theme: 'dark',
		density: 'comfortable',
	},
};

const renderObjectNode = (props: NodeRendererProps<any>) => {
	const suffix = typeof props.item === 'object'
		? ''
		: `: ${String(props.item)}`;
	return <span>{`${props.node.propKey}${suffix}`}</span>;
};

const buildObjectTreeAdapter = () => AdapterBuilder()
	.tree()
	.singleRender(renderObjectNode)
	.setExpandCollapseRenderer(TreeExpandCollapseChevron)
	.setNodeRenderer(wrapTreeNodeWithCaret(renderObjectNode))
	.setData(objectTreeData)
	.build();

/** Sample A — plain object tree + single renderer (debug / JSON-like data). */
export const Example_TreeObject: React.FC = () => {
	const adapter = useMemo(buildObjectTreeAdapter, []);
	return (
		<TS_Tree
			id={'ts-tree-example-object'}
			adapter={adapter}
			checkExpanded={(expanded, path) => expanded[path] ?? path.split('/').length <= 3}
		/>
	);
};
