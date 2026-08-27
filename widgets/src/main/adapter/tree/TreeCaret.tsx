import * as React from 'react';
import {_className} from '@nu-art/thunder-core';
import {Collapsed, Expanded} from '../../components/treeicons.js';
import {NodeRendererProps} from '../BaseRenderer.js';

/** Chevron expand/collapse — click target for branch nodes only; leaf nodes get a fixed spacer. */
export const TreeExpandCollapseChevron = (props: NodeRendererProps) => {
	if (!props.node.adapter.hadChildren(props.item))
		return <span className={_className('ts-tree__caret', 'ts-tree__caret--leaf')} aria-hidden/>;

	const Icon = props.node.expanded ? Expanded : Collapsed;
	return (
		<button
			type={'button'}
			className={_className('ts-tree__caret', 'ts-tree__caret--branch', 'clickable')}
			aria-expanded={props.node.expanded}
			aria-label={props.node.expanded ? 'Collapse' : 'Expand'}
			onClick={event => {
				event.stopPropagation();
				props.node.expandToggler(event);
			}}
		>
			<Icon style={{display: 'block'}}/>
		</button>
	);
};

/** Row chrome without whole-row expand — expand/collapse lives on the caret only. */
export const wrapTreeNodeWithCaret = (
	renderRow: (props: NodeRendererProps) => React.ReactElement,
	expandCollapseRenderer: React.ComponentType<NodeRendererProps> = TreeExpandCollapseChevron,
): React.ComponentType<NodeRendererProps> => props => (
	<div className={_className('ll_h_c', 'ts-tree__node-inner')}>
		{React.createElement(expandCollapseRenderer, props)}
		{renderRow(props)}
	</div>
);
