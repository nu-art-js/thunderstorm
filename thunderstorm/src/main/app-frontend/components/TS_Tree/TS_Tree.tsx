/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as React from 'react';
import {TreeNode, TreeNodeExpandState,} from './types';
import {Adapter} from '../adapter/Adapter';
import {_BaseNodeRenderer} from '../adapter/BaseRenderer';
import {UIComponent} from '../../core/UIComponent';
import {_className} from '../../utils/tools';
import {Fragment} from 'react';
import './TS_Tree.scss';

export type Props_Tree = {
	id: string
	onNodeFocused?: (path: string, item: any) => void;
	onNodeClicked?: (path: string, item: any) => void;
	expanded?: TreeNodeExpandState
	checkExpanded: (expanded: TreeNodeExpandState, path: string) => boolean | undefined
	selectedItem?: any
	adapter: Adapter
}

type State_Tree = {
	expanded: TreeNodeExpandState
	selectedItem?: any
	adapter: Adapter
}

const ignoreToggler = (): void => {
};

export class TS_Tree<P extends Props_Tree = Props_Tree, S extends State_Tree = State_Tree>
	extends UIComponent<P, State_Tree> {

	static defaultProps: Partial<Props_Tree> = {
		checkExpanded: (expanded: TreeNodeExpandState, path: string) => expanded[path]
	};

	protected containerRefs: { [k: string]: HTMLDivElement } = {};
	protected rendererRefs: { [k: string]: HTMLDivElement } = {};

	constructor(props: P) {
		super(props);
	}

	protected deriveStateFromProps(nextProps: P) {
		return {
			adapter: nextProps.adapter,
			expanded: (this.props.id !== nextProps.id ? nextProps.expanded : this.state?.expanded) || {'/': true},
			selectedItem: nextProps.selectedItem
		};
	}

	render() {
		return <div className="ts-tree">
			{this.renderNode(this.state.adapter.data, '', '', 1)}
		</div>;
	}

	private renderNode = (_data: any, key: string, _path: string, level: number) => {
		const nodePath = `${_path}${key}/`;
		const adjustedNode = this.state.adapter.adjust(_data);
		const data = adjustedNode.data;

		let filteredKeys: any[] = [];

		let expanded = !!this.props.checkExpanded(this.state.expanded, nodePath);
		if (nodePath.endsWith('_children/'))
			expanded = true;


		let renderChildren = expanded;

		if (typeof data !== 'object')
			renderChildren = false;

		if (renderChildren)

			filteredKeys = this.state.adapter.getFilteredChildren(_data);

		const nodeRefResolver = this.nodeResolver(nodePath, renderChildren, filteredKeys);
		const containerRefResolver = this.resolveContainer(nodePath, renderChildren, filteredKeys);

		return <Fragment key={nodePath}>
			{this.renderItem(data, nodePath, key, nodeRefResolver, expanded)}
			{this.renderChildren(data, nodePath, _path, level, filteredKeys, renderChildren, adjustedNode, containerRefResolver)}
		</Fragment>;
	};

	private nodeResolver(nodePath: string, renderChildren: boolean, filteredKeys: any[]) {
		return (_ref: HTMLDivElement) => {
			if (this.rendererRefs[nodePath])
				return;

			this.rendererRefs[nodePath] = _ref;
			if (this.containerRefs[nodePath] && renderChildren && filteredKeys.length > 0)
				this.forceUpdate();
		};
	}

	private resolveContainer(nodePath: string, renderChildren: boolean, filteredKeys: any[]) {
		return (_ref: HTMLDivElement) => {
			if (this.containerRefs[nodePath])
				return;

			this.containerRefs[nodePath] = _ref;
			if (renderChildren && filteredKeys.length > 0)
				this.forceUpdate();
		};
	}

	private renderChildren(data: any, nodePath: string, _path: string, level: number, filteredKeys: any[], renderChildren: boolean, adjustedNode: { data: object; deltaPath?: string }, containerRefResolver: (_ref: HTMLDivElement) => void) {
		if (!(filteredKeys.length > 0 && renderChildren))
			return;

		const containerRef: HTMLDivElement = this.containerRefs[nodePath];

		return (
			<div className="ts-tree__children-container" ref={containerRefResolver}>
				{containerRef && filteredKeys.map(
					(childKey) => this.renderNode(data[childKey], childKey, nodePath + (adjustedNode.deltaPath ? adjustedNode.deltaPath + '/' : ''), level + 1))}
			</div>);
	}

	private renderItem(item: any, path: string, key: string, nodeRefResolver: (_ref: HTMLDivElement) => void, expanded?: boolean) {
		if (this.state.adapter.hideRoot && path.length === 1)
			return null;

		const TreeNodeRenderer: _BaseNodeRenderer<any> = this.state.adapter.treeNodeRenderer;
		// console.log("isParent: ", this.state.adapter.isParent(item));
		const isParent = this.state.adapter.isParent(item);
		const node: TreeNode = {
			adapter: this.state.adapter,
			propKey: key,
			path,
			item,
			expandToggler: isParent ? this.toggleExpandState : ignoreToggler,
			onClick: this.onNodeClicked,
			expanded: !!expanded,
			selected: item === this.props.selectedItem
		};

		return <div className={_className('ts-tree__node', isParent && 'ts-tree__parent-node')} ref={nodeRefResolver}>
			<TreeNodeRenderer item={item} node={node}/>
		</div>;
	}

	getItemByPath(path: string) {
		return TS_Tree.resolveItemFromPath(this.state.adapter.data, path);
	}

	public static resolveItemFromPath(data: any, path?: string) {
		if (!path)
			return;

		let item: any = data;
		const hierarchy: string[] = path.split('/');
		hierarchy.shift();

		for (const el of hierarchy) {
			if (el) {
				item = item[el];
				if (!item)
					return;
			}
		}

		return item;
	}

	private toggleExpandState = (e: React.MouseEvent, _expanded?: boolean): void => this.expandOrCollapse(e.currentTarget.id, _expanded);

	private expandOrCollapse = (path: string, forceExpandState?: boolean): void => {
		if (path === '/' && this.state.adapter.hideRoot && forceExpandState === false)
			return;

		const treeExpandedState = this.state.expanded;
		const currentExpandState = treeExpandedState[path];
		let newExpandState = currentExpandState === undefined;
		if (forceExpandState !== undefined)
			newExpandState = forceExpandState ? forceExpandState : false;

		if (newExpandState)
			treeExpandedState[path] = newExpandState;
		else
			delete treeExpandedState[path];

		this.forceUpdate();
	};

	private onNodeClicked = (e: React.MouseEvent): void => {
		// This is an assumption that we should document somewhere
		const path = e.currentTarget.id;
		const item = this.getItemByPath(path);

		this.props.onNodeClicked && this.props.onNodeClicked(path, item);
	};
}

