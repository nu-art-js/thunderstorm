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
import {CSSProperties} from 'react';
import {TreeNode, TreeNodeExpandState,} from './types';
import {Adapter} from '../adapter/Adapter';
import {_BaseNodeRenderer} from '../adapter/BaseRenderer';
import {UIComponent} from '../../core/UIComponent';

export type Props_Tree = {
	id: string
	onNodeFocused?: (path: string, item: any) => void;
	onNodeClicked?: (path: string, item: any) => void;
	expanded?: TreeNodeExpandState
	childrenContainerStyle?: (level: number, parentNodeRef: HTMLDivElement, containerRef: HTMLDivElement, parentRef?: HTMLDivElement) => CSSProperties
	indentPx: number;
	checkExpanded: (expanded: TreeNodeExpandState, path: string) => boolean | undefined
	selectedItem?: any
	adapter: Adapter
}

type State_Tree = {
	expanded: TreeNodeExpandState
	focused?: string
	selectedItem?: any
	adapter: Adapter
}

const ignoreToggler = (): void => {
};

export class TS_Tree<P extends Props_Tree = Props_Tree, S extends State_Tree = State_Tree>
	extends UIComponent<P, State_Tree> {

	static defaultProps: Partial<Props_Tree> = {
		indentPx: 20,
		checkExpanded: (expanded: TreeNodeExpandState, path: string) => expanded[path]
	};

	protected containerRefs: { [k: string]: HTMLDivElement } = {};
	protected rendererRefs: { [k: string]: HTMLDivElement } = {};
	protected renderedElements: string[] = [];

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

	// componentDidMount(): void {
	// 	this.renderedElementsInit();
	// }
	//
	// renderedElementsInit = () => {
	// 	const keys = Object.keys(this.state.expanded);
	// 	this.renderedElements = keys.reduce((toRet, key) => {
	// 		if (this.state.expanded[key])
	// 			return toRet;
	//
	// 		this.state.adapter.hideRoot && removeItemFromArray(toRet, '/');
	//
	// 		keys.forEach(el => {
	// 			if (el.startsWith(key) && el !== key)
	// 				removeItemFromArray(toRet, el);
	// 		});
	// 		return toRet;
	// 	}, keys);
	// };

	render() {
		return this.renderNode(this.state.adapter.data, '', '', 1);
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

		return <div key={nodePath} ref={nodeRefResolver}>
			{this.renderItem(data, nodePath, key, expanded)}
			{this.renderChildren(data, nodePath, _path, level, filteredKeys, renderChildren, adjustedNode, containerRefResolver)}
		</div>;
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
			<div
				style={this.getChildrenContainerStyle(level, this.rendererRefs[nodePath], containerRef, this.containerRefs[_path])}
				ref={containerRefResolver}>
				{containerRef && filteredKeys.map(
					(childKey) => this.renderNode(data[childKey], childKey, nodePath + (adjustedNode.deltaPath ? adjustedNode.deltaPath + '/' : ''), level + 1))}
			</div>);
	}

	private renderItem(item: any, path: string, key: string, expanded?: boolean) {
		if (this.state.adapter.hideRoot && path.length === 1)
			return null;

		const TreeNodeRenderer: _BaseNodeRenderer<any> = this.state.adapter.treeNodeRenderer;
		// console.log("isParent: ", this.state.adapter.isParent(item));
		const node: TreeNode = {
			adapter: this.state.adapter,
			propKey: key,
			path,
			item,
			expandToggler: this.state.adapter.isParent(item) ? this.toggleExpandState : ignoreToggler,
			onClick: this.onNodeClicked,
			onFocus: this.onNodeFocused,
			expanded: !!expanded,
			focused: path === this.state.focused,
			selected: item === this.props.selectedItem
		};
		return <div onMouseEnter={() => this.setState({focused: node.path})} onMouseLeave={() => this.setState({focused: ''})}><TreeNodeRenderer item={item}
																																																																						 node={node}/>
		</div>;
	}

	private getChildrenContainerStyle = (level: number, parentNodeRef: HTMLDivElement, containerRef?: HTMLDivElement, parentContainerRef?: HTMLDivElement): CSSProperties => {
		if (!containerRef)
			return {};

		if (this.props.childrenContainerStyle)
			return this.props.childrenContainerStyle(level, parentNodeRef, containerRef, parentContainerRef);

		return {marginLeft: this.props.indentPx};
	};

	private setFocusedNode(path: string) {
		this.rendererRefs[path].scrollIntoView({block: 'nearest'});
		this.setState({focused: path});
	}

	getItemByPath(path: string) {
		return TS_Tree.resolveItemFromPath(this.state.adapter.data, path);
	}

	public static resolveItemFromPath(data: any, path: string) {
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

		this.setState({focused: path});
		this.forceUpdate();
	};

	private onNodeFocused = (e: React.MouseEvent): void => {
		// This is an assumption that we should document somewhere
		const path = e.currentTarget.id;
		const item = this.getItemByPath(path);

		this.props.onNodeFocused && this.props.onNodeFocused(path, item);
		if (this.state.focused === path)
			return;

		this.setFocusedNode(path);
	};

	private onNodeClicked = (e: React.MouseEvent): void => {
		this.onNodeFocused(e);
		// This is an assumption that we should document somewhere
		const path = e.currentTarget.id;
		const item = this.getItemByPath(path);

		this.props.onNodeClicked && this.props.onNodeClicked(path, item);
	};
}


