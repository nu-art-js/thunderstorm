/*
 * Database API Generator is a utility library for Thunderstorm.
 *
 * Given proper configurations it will dynamically generate APIs to your Firestore
 * collections, will assert uniqueness and restrict deletion... and more
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
import {compare, DB_Object, LogLevel} from '@nu-art/ts-common';
import {ApiCallerEventTypeV2, BaseDB_ApiGeneratorCallerV2, DataStatus} from '../modules/BaseDB_ApiGeneratorCallerV2';
import {Props_WorkspacePanel, State_WorkspacePanel, TS_Loader} from '@nu-art/thunderstorm/frontend';
import {EventType_Sync} from '../consts';
import {BaseComponent} from '@nu-art/thunderstorm/app-frontend/core/ComponentBase';


export enum ComponentStatus {
	Loading,
	Syncing,
	Synced,
}

export type Props_SmartComponent = {
	modules: BaseDB_ApiGeneratorCallerV2<DB_Object, any>[];
}

export type State_SmartComponent = {
	componentPhase: ComponentStatus;
	error?: Error
}

export abstract class SmartComponent<P extends any = {}, S extends any = {},
	Props extends Props_SmartComponent & P = Props_SmartComponent & P,
	State extends State_SmartComponent & S = State_SmartComponent & S>
	extends BaseComponent<Props, State> {

	// static defaultProps = {
	// 	modules: []
	// };

	private derivingState = false;
	private pendingProps?: Props;

	constructor(p: Props) {
		super(p);
		this.logger.setMinLevel(LogLevel.Verbose);
		this.props.modules.forEach(module => {
			// @ts-ignore
			const __callback = this[module.defaultDispatcher.method]?.bind(this);
			// @ts-ignore
			this[module.defaultDispatcher.method] = (...params: ApiCallerEventTypeV2<any>) => {
				this.onSyncEvent(module, ...params);
				__callback?.(...params);
			};
		});
	}

	// ######################### Life Cycle #########################

	private onSyncEvent = (module: BaseDB_ApiGeneratorCallerV2<DB_Object, any>, ...params: ApiCallerEventTypeV2<any>) => {
		//Define logic for change in module sync status
		if (params[0] === EventType_Sync) {
			this.reDeriveState();
		}
	};

	protected _deriveStateFromProps(nextProps: Props, state: State = this.createInitialState(nextProps)): State | undefined {
		const isReady = this.props.modules.every(module => module.getDataStatus() === DataStatus.containsData);
		if (!isReady)
			return this.createInitialState(nextProps);

		if (this.derivingState) {
			this.logVerbose('Scheduling new props', nextProps as {});
			this.pendingProps = nextProps;
			return;
		}

		this.logVerbose('Will deriving state from props', nextProps as {});
		this.pendingProps = undefined;
		this.derivingState = true;

		this.deriveStateFromProps(nextProps, {...state, componentPhase: ComponentStatus.Synced})
			.then((state) => {
				if (this.pendingProps)
					return this.reDeriveCompletedCallback();

				if (state)
					this.setState(state, this.reDeriveCompletedCallback);

			})
			.catch(e => {
				this.logError(`error`, e);
				this.setState({error: e}, this.reDeriveCompletedCallback);
			});

		return this.createInitialState(nextProps);
	}

	private reDeriveCompletedCallback = () => {
		this.derivingState = false;
		if (this.pendingProps) {
			this.logVerbose('Triggering pending props');
			this._deriveStateFromProps(this.pendingProps);
		}
	};

	protected abstract deriveStateFromProps(nextProps: Props, state?: Partial<S> & State_SmartComponent): Promise<State>;

	protected createInitialState(nextProps: Props) {
		return {componentPhase: ComponentStatus.Loading} as State;
	}

	// ######################### Render #########################

	protected abstract _render(): JSX.Element

	render() {
		if (this.state.componentPhase !== ComponentStatus.Synced)
			return <div className={'loader-container'}><TS_Loader/></div>;

		return this._render();
	}
}

export abstract class SmartPanel<Config, State = {}, Props = {}>
	extends SmartComponent<Props_WorkspacePanel<Config, Props>, State_WorkspacePanel<Config, State>> {

	protected createInitialState(nextProps: Props_WorkspacePanel<Config, Props>) {
		return {componentPhase: ComponentStatus.Loading, config: {...nextProps.config}} as State_WorkspacePanel<Config, State> & State_SmartComponent;
	}

	shouldReDeriveState(nextProps: Readonly<Props_WorkspacePanel<Config, Props>>): boolean {
		return !compare(this.state.config, nextProps.config as Config);
	}
}