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

/**
 * Created by tacb0ss on 28/07/2018.
 */
import * as React from 'react';

import {_clearTimeout, _keys, _setTimeout, _sortArray, Logger, LogLevel, LogParam, TimerHandler, EmptyObject} from '@nu-art/ts-common';
import {StorageModule} from '../modules/StorageModule';
import {ResourcesModule} from '../modules/ResourcesModule';
import {BrowserHistoryModule} from '../modules/HistoryModule';
import {Thunder} from './Thunder';


export abstract class BaseComponent<P = any, State = any>
	extends React.Component<P, State> {

	protected readonly logger: Logger;
	private timeoutMap: { [k: string]: number } = {};
	protected mounted = false;

	constructor(props: P) {
		super(props);
		this.logger = new Logger(this.constructor.name);
		this.logger.setMinLevel(LogLevel.Info);

		this._constructor();
		const __render = this.render?.bind(this);
		this.render = () => {
			this.logVerbose('rendering');
			return __render();
		};

		const __componentDidMount = this.componentDidMount?.bind(this);
		this.componentDidMount = () => {
			// @ts-ignore
			Thunder.getInstance().addUIListener(this);

			__componentDidMount?.();
			this.mounted = true;
		};

		const __componentWillUnmount = this.componentWillUnmount?.bind(this);
		this.componentWillUnmount = () => {
			__componentWillUnmount?.();
			// @ts-ignore
			Thunder.getInstance().removeUIListener(this);
			this.mounted = false;
		};

		this._deriveStateFromProps.bind(this);
		const state = this._deriveStateFromProps(props);
		if (state)
			this.state = state;
	}

	_constructor() {
	}

	UNSAFE_componentWillReceiveProps(nextProps: P) {
		if (!this.shouldComponentUpdate(nextProps, this.state, undefined))
			return;

		if (this.state) //skip the first time when the component MUST update
			this.logDebug('deriving state from new props...');

		const state = this._deriveStateFromProps(nextProps);
		if (state)
			this.setState(state);
	}

	protected abstract _deriveStateFromProps(nextProps: P): State | undefined ;

	protected reDeriveState() {
		this._deriveStateFromProps(this.props);
	}

	debounce(handler: TimerHandler, key: string, ms = 0) {
		_clearTimeout(this.timeoutMap[key]);
		this.timeoutMap[key] = _setTimeout(handler, ms);
	}

	throttle(handler: TimerHandler, key: string, ms = 0) {
		if (this.timeoutMap[key])
			return;
		this.timeoutMap[key] = _setTimeout(() => {
			handler();
			delete this.timeoutMap[key];
		}, ms);
	}

	shouldComponentUpdate(nextProps: Readonly<P>, nextState: Readonly<State>, nextContext: any): boolean {
		const _shouldRender = () => {
			const propKeys = _sortArray(_keys(this.props || EmptyObject));
			const nextPropsKeys = _sortArray(_keys(nextProps || EmptyObject));
			const stateKeys = _sortArray(_keys(this.state || EmptyObject));
			const nextStateKeys = _sortArray(_keys(nextState || EmptyObject));

			if (propKeys.length !== nextPropsKeys.length) return true;
			if (propKeys.some((key, i) => propKeys[i] !== nextPropsKeys[i] || this.props[propKeys[i]] !== nextProps[nextPropsKeys[i]])) return true;

			if (stateKeys.length !== nextStateKeys.length) return true;
			if (stateKeys.some((key, i) => stateKeys[i] !== nextStateKeys[i] || this.state[stateKeys[i]] !== nextState[nextStateKeys[i]])) return true;
			return false;
		};

		const shouldRender = _shouldRender();
		if (shouldRender)
			this.logDebug('component should update');

		return shouldRender;
	}

	protected logVerbose(...toLog: LogParam[]): void {
		this.logImpl(LogLevel.Verbose, false, toLog);
	}

	protected logDebug(...toLog: LogParam[]): void {
		this.logImpl(LogLevel.Debug, false, toLog);
	}

	protected logInfo(...toLog: LogParam[]): void {
		this.logImpl(LogLevel.Info, false, toLog);
	}

	protected logWarning(...toLog: LogParam[]): void {
		this.logImpl(LogLevel.Warning, false, toLog);
	}

	protected logError(...toLog: LogParam[]): void {
		this.logImpl(LogLevel.Error, false, toLog);
	}

	protected log(level: LogLevel, bold: boolean, ...toLog: LogParam[]): void {
		this.logImpl(level, bold, toLog);
	}

	private logImpl(level: LogLevel, bold: boolean, toLog: LogParam[]): void {
		this.logger.log(level, bold, toLog);
	}

	static store(key: string, value: string | object): void {
		StorageModule.set(key, value);
	}

	static load(key: string, defaultValue: string | number | object | undefined): string | number | object | null {
		return StorageModule.get(key, defaultValue);
	}

	static getElementId(e: React.BaseSyntheticEvent) {
		return (e.currentTarget as HTMLElement).id;
	}

	static getImageUrl(_relativePath: string) {
		let relativePath = _relativePath;
		if (!relativePath)
			return '';

		if (relativePath.indexOf('.') === -1)
			relativePath += '.png';

		return ResourcesModule.getImageUrl(relativePath);
	}

	static getQueryParameter(name: string) {
		return BrowserHistoryModule.getQueryParams()[name];
	}

	static getUrl() {
		return BrowserHistoryModule.getCurrent().pathname;
	}

	toString() {
		return this.constructor.name;
	}
}

