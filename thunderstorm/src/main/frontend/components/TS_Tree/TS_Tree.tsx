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
import {CSSProperties, Fragment} from 'react';
import {Adapter, TreeNode} from '../adapter/Adapter';
import {_BaseNodeRenderer} from '../adapter/BaseRenderer';
import {_className} from '../../utils/tools';
import './TS_Tree.scss';
import {ComponentSync} from '../../core/ComponentSync';
import {TreeNodeExpandState} from './types';
import {_keys, exists} from '@nu-art/ts-common';


export type Props_Tree = {
	id: string
	onNodeFocused?: (path: string, item: any) => void;
	onNodeClicked?: (path: string, item: any) => void;
	onContextMenuClicked?: (e: React.MouseEvent, path: string, item: any) => void;
	expanded?: TreeNodeExpandState
	checkExpanded: (expanded: TreeNodeExpandState, path: string) => boolean | undefined
	className?: string
	treeContainerStyle?: CSSProperties
	selectedItem?: any
	isSelected?: (item: any) => boolean
	indexTreeNodes?: boolean
	selectedPath?: string
	adapter: Adapter;
	startTreeOpen?: boolean;

	//Scroll Props
	containerRef?: React.RefObject<any>;
	scrollSelectedIntoView?: boolean;
}

type State_Tree = {
	expanded: TreeNodeExpandState
	isSelected?: (item: any) => boolean
	selected: { path?: string, item?: (item: any) => boolean }
	adapter: Adapter
}

const ignoreToggler = (): void => {
};

export class TS_Tree<P extends Props_Tree = Props_Tree, S extends State_Tree = State_Tree>
	extends ComponentSync<P, State_Tree> {

	// ######################## Static ########################

	static defaultProps: Partial<Props_Tree> = {
		checkExpanded: (expanded: TreeNodeExpandState, path: string) => expanded[path]
	};

	protected containerRefs: { [k: string]: HTMLDivElement } = {};
	protected rendererRefs: { [k: string]: HTMLDivElement } = {};

	// ######################## Life Cycle ########################

	constructor(props: P) {
		super(props);
	}

	shouldComponentUpdate(nextProps: Readonly<P>, nextState: Readonly<State_Tree>, nextContext: any): boolean {
		return true;
	}

	protected deriveStateFromProps(nextProps: P) {
		return {
			adapter: nextProps.adapter,
			expanded: nextProps.expanded ?? this.state?.expanded ?? {'/': nextProps.startTreeOpen ?? true},
			isSelected: nextProps.isSelected,
			selected: {
				path: nextProps.selectedPath,
				item: nextProps.selectedItem
			}
		};
	}

	componentDidUpdate() {
		if (!this.props.scrollSelectedIntoView || !(this.state.selected?.item || this.state.selected?.path) || !this.props.containerRef?.current)
			return;

		const itemPath = this.state.selected.path ?? _keys(this.rendererRefs).find(key => this.getItemByPath(key as string) === this.state.selected.item)!;
		const childRect = this.rendererRefs[itemPath].getBoundingClientRect();
		const containerRect = this.props.containerRef.current.getBoundingClientRect();

		const inView = (childRect.top >= containerRect.top) && (childRect.bottom <= containerRect.top + this.props.containerRef.current.clientHeight);
		if (!inView) {
			const scrollTop = childRect.top - containerRect.top;
			const scrollBot = childRect.bottom - containerRect.bottom;
			let scroll = this.props.containerRef.current.scrollTop;
			if (Math.abs(scrollTop) < Math.abs(scrollBot))
				scroll += scrollTop;
			else
				scroll += scrollBot;

			this.props.containerRef.current.scroll({top: scroll});
		}
	}

	// ######################## Logic ########################

	private onNodeClicked = (e: React.MouseEvent) => {
		const path = e.currentTarget.getAttribute('data-path');
		if (!path)
			return this.logError('No Path for tree node:', e);
		//FIXME: consider typing the return from resolveItemFromPath instead of limiting the return to just the item
		this.props.onNodeClicked?.(path, TS_Tree.resolveItemFromPath(this.state.adapter.data, path));
	};

	private onContextMenuClicked = (e: React.MouseEvent) => {
		const path = e.currentTarget.getAttribute('data-path');
		if (!path)
			return this.logError('No Path for tree node:', e);
		//FIXME: consider typing the return from resolveItemFromPath instead of limiting the return to just the item
		this.props.onContextMenuClicked?.(e, path, TS_Tree.resolveItemFromPath(this.state.adapter.data, path));
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

	private toggleExpandState = (e: React.MouseEvent, _expanded?: boolean): void => this.expandOrCollapse(this.resolveTreeNode(e.currentTarget), _expanded);

	private expandOrCollapse = (path: string, forceExpandState?: boolean): void => {
		if (path === '/' && this.state.adapter.hideRoot && forceExpandState === false)
			return;

		const treeExpandedState = this.state.expanded;
		const currentExpandState = treeExpandedState[path];
		const newExpandState = exists(forceExpandState) ? forceExpandState : !currentExpandState;

		if (newExpandState)
			treeExpandedState[path] = newExpandState;
		else
			delete treeExpandedState[path];

		this.forceUpdate();
	};

	private resolveTreeNode(currentTarget?: Element): string {
		if (!currentTarget) {
			this.logError('Could not find node!!');
			return '';
		}

		if (!currentTarget.getAttribute('data-path'))
			return this.resolveTreeNode(currentTarget.parentElement || undefined);

		return currentTarget.getAttribute('data-path') || '';
	}

	// ######################## Render ########################

	private renderNode = (_data: any, key: string, _path: string, level: number) => {
		const nodePath = `${_path}${key}/`;
		const adjustedNode = this.state.adapter.adjust(_data);
		const data = adjustedNode.data;

		let filteredKeys: any[] = [];
		const alwaysExpanded: boolean = typeof _data === 'object' && _data.alwaysExpanded;
		let expanded = alwaysExpanded || !!this.props.checkExpanded(this.state.expanded, nodePath);
		if (nodePath.endsWith('_children/'))
			expanded = true;

		let renderChildren = expanded;

		if (typeof data !== 'object')
			renderChildren = false;

		if (renderChildren)
			filteredKeys = this.state.adapter.getFilteredChildren(_data);

		const nodeRefResolver = this.nodeResolver(nodePath, renderChildren, filteredKeys);
		const containerRefResolver = this.resolveContainer(nodePath, renderChildren, filteredKeys);

		const isSelected = this.state.isSelected?.(_data) || _data === this.state.selected.item;

		return <Fragment key={nodePath}>
			{this.renderItem(data, nodePath, key, nodeRefResolver, level, isSelected, expanded)}
			{this.renderChildren(data, nodePath, _path, level, filteredKeys, renderChildren, adjustedNode, containerRefResolver)}
		</Fragment>;
	};

	private renderChildren(data: any, nodePath: string, _path: string, level: number, filteredKeys: any[], renderChildren: boolean, adjustedNode: {
		data: object;
		deltaPath?: string
	}, containerRefResolver: (_ref: HTMLDivElement) => void) {
		if (!(filteredKeys.length > 0 && renderChildren))
			return;

		const containerRef: HTMLDivElement = this.containerRefs[nodePath];

		return (
			<div className="ts-tree__children-container" ref={containerRefResolver}>
				{containerRef && filteredKeys.map(
					(childKey) => this.renderNode(data[childKey], childKey, nodePath + (adjustedNode.deltaPath ? adjustedNode.deltaPath + '/' : ''), level + 1))}
			</div>);
	}

	private renderItem(item: any, path: string, key: string, nodeRefResolver: (_ref: HTMLDivElement) => void, level: number, isSelected: boolean, expanded?: boolean) {
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
			expandFromNode: expand => this.expandOrCollapse(path, expand),
			expanded: !!expanded,
		};

		if (this.state.adapter.childrenKey === key)
			return null;

		const className = _className('ts-tree__node', isParent && 'ts-tree__parent-node', isSelected && 'ts-tree__selected-node', `depth-${level}`);
		return <div tabIndex={this.props.indexTreeNodes ? 1 : undefined} data-path={path} className={className}
					ref={nodeRefResolver}
					onClick={this.onNodeClicked}
					onContextMenu={this.onContextMenuClicked}>
			<TreeNodeRenderer item={item} node={node}/>
		</div>;
	}

	render() {
		return <div className={_className('ts-tree', this.props.className)} style={this.props.treeContainerStyle}>
			{this.renderNode(this.state.adapter.data, '', '', (this.state.adapter.hideRoot ? -1 : 0))}
		</div>;
	}
}


