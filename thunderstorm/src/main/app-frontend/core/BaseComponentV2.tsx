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

import {Logger, LogLevel, LogParam} from '@nu-art/ts-common';
import {ResourcesModule} from '../modules/ResourcesModule';
import {BrowserHistoryModule} from '../modules/HistoryModule';
import {Thunder} from './Thunder';

export abstract class BaseComponentV2<P = any, S = any>
	extends React.Component<P, S> {

	private stateKeysToUpdate?: (keyof S)[];
	private logger: Logger;
	protected mounted = false;

	constructor(props: P) {
		super(props);
		this.logger = new Logger(this.constructor.name);

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

	UNSAFE_componentWillReceiveProps(nextProps: P) {
		console.log('UNSAFE_componentWillReceiveProps');
		const state = this._deriveStateFromProps(nextProps);
		if (state)
			this.setState(state);
	}

	private _deriveStateFromProps(nextProps: P): S | undefined {
		this.deriveStateFromProps(nextProps)
			.then((state) => this.setState(state, () => {
			}))
			.catch(e => this.logError(`error`, e));

		return this.createInitialState(nextProps);
	}

	protected updateState() {
		this._deriveStateFromProps(this.props);
	}

	protected async deriveStateFromProps(nextProps: P): Promise<S> {
		return this.createInitialState(nextProps);
	}

	protected createInitialState(nextProps: P) {
		return {} as S;
	}

	setStateKeysToUpdate(stateKeysToUpdate?: (keyof S)[]) {
		this.stateKeysToUpdate = stateKeysToUpdate;
	}

	shouldComponentUpdate(nextProps: Readonly<P>, nextState: Readonly<S>, nextContext: any): boolean {
		if (!this.stateKeysToUpdate)
			return true;

		return this.stateKeysToUpdate.find(key => this.state[key] !== nextState[key]) !== undefined;
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

