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
import {
	_keys,
	removeItemFromArray
} from "@nu-art/ts-common";
import {
	PropertyFilter,
	TreeNodeAdjuster,
	TreeRenderer
} from "./types";
import {KeyboardListener} from "../../tools/KeyboardListener";
import {stopPropagation} from '../../utils/tools';


export type BaseTreeProps = {
	id: string
	root: object
	hideRootElement?: boolean
	onNodeClicked?: Function;
	onNodeDoubleClicked?: Function;
	renderer: (tree: BaseTree) => TreeRenderer;
	callBackState: (key: string, value: any, level: number) => boolean

	childrenContainerStyle?: (level: number, parentNodeRef: HTMLDivElement, containerRef: HTMLDivElement, parentRef?: HTMLDivElement) => CSSProperties
	nodesState?: TreeNodeState;

	indentPx: number;
	propertyFilter: PropertyFilter
	nodeAdjuster: TreeNodeAdjuster
	checkExpanded: (expanded: TreeNodeState, path: string) => boolean

	keyEventHandler?: (node: HTMLDivElement, e: KeyboardEvent) => boolean;
	onFocus?: () => void
	onBlur?: () => void
}

export type TreeNodeState = { [path: string]: boolean };
type TreeState = {
	expanded: TreeNodeState,
	focused?: string
}


export abstract class BaseTree<P extends BaseTreeProps = BaseTreeProps, S extends TreeState = TreeState>
	extends React.Component<P, TreeState> {

	static _defaultProps: Partial<BaseTreeProps> = {
		indentPx: 20,
		checkExpanded: (expanded: TreeNodeState, path: string) => expanded[path],
	};

	protected containerRefs: { [k: string]: HTMLDivElement } = {};
	protected rendererRefs: { [k: string]: HTMLDivElement } = {};

	private Renderer: TreeRenderer;

	constructor(props: P) {
		super(props);

		this.Renderer = this.props.renderer(this);
		this.state = {expanded: this.recursivelyExpand(this.props.root, this.props.callBackState || (() => true))} as S;
	}

	render() {
		return <KeyboardListener
			id={this.props.id}
			onKeyboardEventListener={this.keyEventHandler}
			onFocus={this.props.onFocus}
			onBlur={this.blur}>
			{this.renderNode(this.props.root, "", "", 1)}
		</KeyboardListener>;
	}

	private renderNode = (_data: any, key: string, _path: string, level: number) => {
		let data = _data;
		const nodePath = `${_path}${key}/`;
		const adjustedNode = this.props.nodeAdjuster(data);
		data = adjustedNode.data;

		let renderChildren = true;
		let filteredKeys: any[] = [];

		const expanded = this.props.checkExpanded(this.state.expanded, nodePath);
		if (!expanded)
			renderChildren = false;

		if (typeof data !== "object")
			renderChildren = false;

		if (renderChildren)
			filteredKeys = _keys(data).filter((__key) => this.props.propertyFilter(data, __key));


		const nodeRefResolver = (_ref: HTMLDivElement) => {
			if (this.rendererRefs[nodePath])
				return;

			this.rendererRefs[nodePath] = _ref;
			if (this.containerRefs[nodePath] && renderChildren && filteredKeys.length > 0)
				this.forceUpdate();
		};

		const containerRefResolver = (_ref: HTMLDivElement) => {
			if (this.containerRefs[nodePath])
				return;

			this.containerRefs[nodePath] = _ref;
			if (renderChildren && filteredKeys.length > 0)
				this.forceUpdate();
		};

		return <div key={nodePath} ref={nodeRefResolver}>
			{this.renderItem(data, nodePath, key, expanded)}
			{this.renderChildren(data, nodePath, _path, level, filteredKeys, renderChildren, adjustedNode, containerRefResolver)}
		</div>
	};

	private renderChildren(data: any, nodePath: string, _path: string, level: number, filteredKeys: any[], renderChildren: boolean, adjustedNode: { data: object; deltaPath?: string }, containerRefResolver: (_ref: HTMLDivElement) => void) {
		if (!(filteredKeys.length > 0 && renderChildren))
			return;

		const containerRef: HTMLDivElement = this.containerRefs[nodePath];

		return (
			<div
				style={this.getChildrenContainerStyle(level, this.rendererRefs[nodePath], containerRef, this.containerRefs[_path])}
				ref={containerRefResolver}>
				{containerRef && filteredKeys.map(
					(childKey) => this.renderNode(data[childKey], childKey, nodePath + (adjustedNode.deltaPath ? adjustedNode.deltaPath + "/" : ""), level + 1))}
			</div>);
	}

	private renderItem(item: any, nodePath: string, key: string, expanded: boolean) {
		if (this.props.hideRootElement && nodePath.length === 1)
			return null;

		return (
			<this.Renderer
				name={key}
				item={item}
				path={nodePath}
				expandToggler={this.toggleExpanded}
				onClick={this.onNodeClicked}
				onDoubleClick={this.onNodeDoubleClicked}
				expanded={expanded}
				focused={nodePath === this.state.focused}/>
		);
	}

	private getChildrenContainerStyle = (level: number, parentNodeRef: HTMLDivElement, containerRef: HTMLDivElement, parentContainerRef?: HTMLDivElement): CSSProperties => {
		if (!containerRef)
			return {};

		if (this.props.childrenContainerStyle)
			return this.props.childrenContainerStyle(level, parentNodeRef, containerRef, parentContainerRef);

		return {marginLeft: this.props.indentPx};
	};

	setState<K extends keyof TreeState>(state: ((prevState: Readonly<TreeState>, props: Readonly<P>) => (Pick<TreeState, K> | TreeState | null)) | Pick<TreeState, K> | TreeState | null, callback?: () => void) {
		// @ts-ignore
		if (state && typeof state === "object" && state.focused) { // @ts-ignore
			console.log("focused: " + state.focused)
		}
		super.setState(state, callback);
	}

	protected keyEventHandler = (node: HTMLDivElement, e: KeyboardEvent): void => {
		if (this.props.keyEventHandler && this.props.keyEventHandler(node, e))
			return;

		console.log(`focused on tree: ${this.props.id}`);
		e.preventDefault();
		e.stopPropagation();
		if (e.code === "Escape") {
			stopPropagation(e);
			return node.blur();
		}

		const renderedElements: string[] = Object.keys(this.state.expanded).reduce((carry, key) => {
			if (this.state.expanded[key])
				return carry;

			Object.keys(this.state.expanded).forEach(el => {
				if (el.startsWith(key) && el !== key)
					removeItemFromArray(carry, el);
			});
			return carry;
		}, Object.keys(this.state.expanded));

		const idx = renderedElements.findIndex(el => el === this.state.focused);
		if (idx >= renderedElements.length)
			return;

		if (e.code === "ArrowDown") {
			stopPropagation(e);
			if (idx === -1 || idx + 1 === renderedElements.length)
				return this.setState({focused: renderedElements[0]});

			return this.setState({focused: renderedElements[idx + 1]})
		}

		if (e.code === "ArrowUp") {
			stopPropagation(e);
			if (idx === -1)
				return this.setState({focused: renderedElements[0]});

			if (idx === 0)
				return this.setState({focused: renderedElements[renderedElements.length - 1]});

			return this.setState({focused: renderedElements[idx - 1]})
		}

		if (this.state.focused && e.code === "ArrowRight") {
			stopPropagation(e);
			return this.expandOrCollapse(this.state.focused, true);
		}

		if (this.state.focused && e.code === "ArrowLeft") {
			stopPropagation(e);
			return this.expandOrCollapse(this.state.focused, false);
		}

		if (this.state.focused && e.code === "Enter") {
			stopPropagation(e);
			let element: any = this.props.root;
			const hierarchy: string[] = this.state.focused.split('/');
			hierarchy.shift();

			for (const el of hierarchy) {
				if (el) {
					element = element[el];
					if (!element)
						return;
				}
			}
			const deltaPath = this.props.nodeAdjuster(element).deltaPath;
			if (deltaPath)
				element = element[deltaPath];

			const action = element.action || this.props.onNodeDoubleClicked || this.props.onNodeClicked;
			return action ? action() : null;
		}
	};

	recursivelyExpand = (obj: object, condition: (key: string, value: any, level: number) => boolean) => {
		const state = {'/': condition ? condition('/', obj, 0) : false};
		return this.recursivelyExpandImpl(obj, state, condition)
	};

	private recursivelyExpandImpl = (obj: object, state: TreeNodeState, condition: (key: string, value: any, level: number) => boolean, path: string = "/", level: number = 1) => {
		if (obj === null)
			return state;

		const _obj = this.props.nodeAdjuster(obj);
		return _keys(obj).reduce((_state, key) => {
			const value = obj[key];
			if (!_obj.deltaPath)
				_state[`${path}${key}/`] = condition(key, value, level);
			if (condition(key, value, level) && typeof value === "object")
				this.recursivelyExpandImpl(value, _state, condition, `${path}${key}/`, level + 1);

			return _state;
		}, state);
	};

	toggleExpanded = (e: React.MouseEvent, _expanded?: boolean): void => {
		const path = e.currentTarget.id;
		this.expandOrCollapse(path, _expanded);
	};

	expandOrCollapse = (path: string, _expanded?: boolean): void => {
		this.setState((prevState: TreeState) => {
			const expanded = prevState.expanded[path];
			prevState.expanded[path] = _expanded !== undefined ? _expanded : !expanded;
			prevState.focused = path;
			return prevState;
		})
	};

	onNodeClicked = (e: React.MouseEvent): void => {
		const path = e.currentTarget.id;
		if (!this.props.onNodeClicked)
			return this.setState({focused: path});

		this.props.onNodeClicked(path, this.props.id);
	};

	onNodeDoubleClicked = (e: React.MouseEvent): void => {
		if (!this.props.onNodeDoubleClicked)
			return;

		const path = e.currentTarget.id;
		this.props.onNodeDoubleClicked(path, this.props.id);
	};

	blur = () => {
		this.props.onBlur && this.props.onBlur();
		this.setState({focused: ''});
	};
}

