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


type Props = {
	id: string
	root: object
	hideRootElement?: boolean
	onNodeClicked?: Function;
	onNodeDoubleClicked?: Function;
	renderer?: TreeRenderer;
	callBackState?: (key: string, value: any, level: number) => boolean

	childrenContainerStyle?: (level: number, parentNodeRef: HTMLDivElement, containerRef: HTMLDivElement, parentRef?: HTMLDivElement) => CSSProperties
	nodesState?: TreeNodeState;

	indentPx: number;
	propertyFilter: PropertyFilter
	nodeAdjuster: TreeNodeAdjuster
	checkExpanded: (expanded: TreeNodeState, path: string) => boolean

	keyEventHandler?: (node: HTMLDivElement, e: KeyboardEvent) => void;
	onFocus?: () => void
	onBlur?: () => void
}

export type TreeNodeState = { [path: string]: boolean };
type TreeState = {
	expanded: TreeNodeState,
	focused?: string
}


export abstract class BaseTree
	extends React.Component<Props, TreeState> {

	static defaultProps: Partial<Props> = {
		indentPx: 20,
		propertyFilter: () => true,
		checkExpanded: (expanded: TreeNodeState, path: string) => expanded[path],
		nodeAdjuster: (obj: object) => ({data: obj, deltaPath: ""})
	};

	protected containerRefs: { [k: string]: HTMLDivElement } = {};
	protected rendererRefs: { [k: string]: HTMLDivElement } = {};

	constructor(props: Props) {
		super(props);
		this.state = {expanded: this.recursivelyExpand(this.props.root, this.props.callBackState || (() => true))};
	}

	protected keyEventHandler = (node: HTMLDivElement, e: KeyboardEvent): void => {
		if (this.props.keyEventHandler)
			return this.props.keyEventHandler(node, e);

		console.log('focused on tree');
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
			console.log('pressed enter');
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

