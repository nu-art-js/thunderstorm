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
import {KeyboardListener} from '../tools/KeyboardListener';

export type Action = { action?: (p?: any) => any }
export type TreeNodeItem = (Action & { [key: string]: any });

export type TreeNode = {
	item: TreeNodeItem | string | number | object
	path: string
	name: string
	onClick: (e: React.MouseEvent) => void
	onDoubleClick: (e: React.MouseEvent) => void

	expandToggler: (e: React.MouseEvent, expand?: boolean) => void
	expanded: boolean
	focused: boolean
};

export type TreeNodeAdjuster = (obj: object) => {
	data: object
	deltaPath?: string
};

export type PropertyFilter = <T extends object>(obj: T, key: keyof T) => any;

type Props = {
	id: string
	root: object
	hideRootElement?: boolean
	onNodeClicked?: (path: string, id: string) => void;
	onNodeDoubleClicked?: (path: string, id: string) => void;
	renderer?: (props: TreeNode) => any;
	indentPx?: number;
	callBackState?: (key: string, value: any, level: number) => boolean

	nodeAdjuster?: TreeNodeAdjuster
	propertyFilter?: PropertyFilter
	childrenContainerStyle?: (level: number, parentNodeRef: HTMLDivElement, containerRef: HTMLDivElement, parentRef?: HTMLDivElement) => CSSProperties
	nodesState?: TreeNodeState;
	checkExpanded?: (expanded: TreeNodeState, path: string) => boolean

	keyEventHandler?: (node: HTMLDivElement, e: KeyboardEvent) => void;
	onFocus?: () => void
	onBlur?: () => void
}

export type TreeNodeState = { [path: string]: boolean };
type TreeState = {
	expanded: TreeNodeState,
	focused?: string
}

export const DefaultTreeRenderer = (props: TreeNode) => {
	function renderCollapse() {
		let toDisplay;
		if (typeof props.item !== "object")
			toDisplay = "";
		else if (Object.keys(props.item).length === 0)
			toDisplay = "";
		else if (props.expanded)
			toDisplay = "-";
		else
			toDisplay = "+";

		return <div className={`clickable`} id={props.path} onClick={props.expandToggler} style={{width: "15px"}}>{toDisplay}</div>
	}

	let label;
	if (typeof props.item !== "object")
		label = ` : ${props.item}`;
	else if (Object.keys(props.item).length === 0)
		label = " : {}";
	else
		label = "";

	return (<div className="ll_h_c">
		{renderCollapse()}
		<div
			id={props.path}
			className={`${(props.item as TreeNodeItem).action || props.onClick || props.onDoubleClick ? 'clickable' : ''}`}
			onClick={props.onClick}
			style={{backgroundColor: props.focused ? "lime" : "unset", userSelect: "none"}}
			onDoubleClick={(props.item as TreeNodeItem).action || props.onDoubleClick}>{props.name || "root"} {label} </div>
	</div>);
};

const noAdjuster: TreeNodeAdjuster = (obj: object) => ({data: obj, deltaPath: ""});

export class Tree
	extends React.Component<Props, TreeState> {

	static defaultProps: Partial<Props> = {
		indentPx: 20,
		propertyFilter: () => true,
		checkExpanded: (expanded: TreeNodeState, path: string) => expanded[path]
	};

	private containerRefs: { [k: string]: HTMLDivElement } = {};
	private rendererRefs: { [k: string]: HTMLDivElement } = {};
	private nodeAdjuster = this.props.nodeAdjuster || noAdjuster;

	constructor(props: Props) {
		super(props);
		this.state = {expanded: this.recursivelyExpand(this.props.root, this.props.callBackState || (() => true))};
	}

	recursivelyExpand = (obj: object, condition: (key: string, value: any, level: number) => boolean) => {
		const state = {'/': condition ? condition('/', obj, 0) : false};
		return this.recursivelyExpandImpl(obj, state, condition)
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

	render() {
		return <KeyboardListener
			onKeyboardEventListener={this.keyEventHandler}
			onFocus={this.props.onFocus}
			onBlur={this.blur}>
			{this.renderNode(this.props.root, "", "", 1)}
		</KeyboardListener>;
	}

	protected keyEventHandler = (node: HTMLDivElement, e: KeyboardEvent): void => {
		if (this.props.keyEventHandler)
			return this.props.keyEventHandler(node, e);

		e.preventDefault();
		e.stopPropagation();
		if (e.code === "Escape")
			return node.blur();

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
			if (idx === -1 || idx + 1 === renderedElements.length)
				return this.setState({focused: renderedElements[0]});

			return this.setState({focused: renderedElements[idx + 1]})
		}

		if (e.code === "ArrowUp") {
			if (idx === -1)
				return this.setState({focused: renderedElements[0]});

			if (idx === 0)
				return this.setState({focused: renderedElements[renderedElements.length - 1]});

			return this.setState({focused: renderedElements[idx - 1]})
		}

		if (this.state.focused && e.code === "ArrowRight")
			return this.expandOrCollapse(this.state.focused, true);

		if (this.state.focused && e.code === "ArrowLeft")
			return this.expandOrCollapse(this.state.focused, false);

		if (this.state.focused && e.code === "Enter") {
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
			const deltaPath = this.nodeAdjuster(element).deltaPath;
			if (deltaPath)
				element = element[deltaPath];

			const action = element.action || this.props.onNodeDoubleClicked || this.props.onNodeClicked;
			return action ? action() : null;
		}
	};

	private recursivelyExpandImpl = (obj: object, state: TreeNodeState, condition: (key: string, value: any, level: number) => boolean, path: string = "/", level: number = 1) => {
		if (obj === null)
			return state;

		const _obj = this.nodeAdjuster(obj);
		return _keys(obj).reduce((_state, key) => {
			const value = obj[key];
			if (!_obj.deltaPath)
				_state[`${path}${key}/`] = condition(key, value, level);
			if (condition(key, value, level) && typeof value === "object")
				this.recursivelyExpandImpl(value, _state, condition, `${path}${key}/`, level + 1);

			return _state;
		}, state);
	};

	private renderNode = (_data: any, key: string, _path: string, level: number) => {
		let data = _data;
		const nodePath = `${_path}${key}/`;
		const Renderer = this.props.renderer || DefaultTreeRenderer;
		const adjustedNode = this.nodeAdjuster(data);
		data = adjustedNode.data;

		let renderChildren = true;
		let filteredKeys: any[] = [];

		// parentRef && console.log("curr: ", parentRef, parentRef.offsetTop);
		const expanded = this.props.checkExpanded ? this.props.checkExpanded(this.state.expanded, nodePath) : false;
		if (!expanded)
			renderChildren = false;

		if (typeof data !== "object")
			renderChildren = false;

		if (renderChildren)
			filteredKeys = _keys(data).filter((__key) => this.props.propertyFilter ? this.props.propertyFilter(data, __key) : true);


		const containerRef: HTMLDivElement = this.containerRefs[nodePath];

		return <div key={nodePath}
		            ref={(_ref: HTMLDivElement) => {
			            if (this.rendererRefs[nodePath])
				            return;

			            this.rendererRefs[nodePath] = _ref;
			            if (this.containerRefs[nodePath] && renderChildren && filteredKeys.length > 0)
				            this.forceUpdate();
		            }}>
			{!(this.props.hideRootElement && _path.length === 0) &&
			<Renderer
				name={key}
				item={data}
				path={nodePath}
				expandToggler={this.toggleExpanded}
				onClick={this.onNodeClicked}
				onDoubleClick={this.onNodeDoubleClicked}
				expanded={expanded}
				focused={nodePath === this.state.focused}
			/>}

			{filteredKeys.length > 0 && renderChildren &&
			<div
				style={this.getChildrenContainerStyle(level, this.rendererRefs[nodePath], containerRef, this.containerRefs[_path])}
				ref={(_ref: HTMLDivElement) => {
					if (this.containerRefs[nodePath])
						return;

					this.containerRefs[nodePath] = _ref;
					if (this.rendererRefs[nodePath] && renderChildren && filteredKeys.length > 0)
						this.forceUpdate();
				}}>

				{containerRef && filteredKeys.map(
					(childKey) => this.renderNode(data[childKey], childKey, nodePath + (adjustedNode.deltaPath ? adjustedNode.deltaPath + "/" : ""), level + 1))}
			</div>}
		</div>
	};

	private getChildrenContainerStyle = (level: number, parentNodeRef: HTMLDivElement, containerRef: HTMLDivElement, parentContainerRef?: HTMLDivElement): CSSProperties => {
		if (!containerRef)
			return {};

		if (this.props.childrenContainerStyle)
			return this.props.childrenContainerStyle(level, parentNodeRef, containerRef, parentContainerRef);

		return {marginLeft: this.props.indentPx || 10};
	};

}
