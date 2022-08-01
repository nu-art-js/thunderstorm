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
import {compare, DB_Object} from '@nu-art/ts-common';
import {ApiCallerEventTypeV2, BaseDB_ApiGeneratorCallerV2, DataStatus, SyncStatus} from '../modules/BaseDB_ApiGeneratorCallerV2';
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

	protected componentPhase: ComponentStatus = ComponentStatus.Loading;
	private derivingState = false;
	private pendingProps?: P;

	constructor(p: Props) {
		super(p);

		this.props.modules.forEach(module => {
			// @ts-ignore
			const __callback = this[module.defaultDispatcher.method]?.bind(this);
			// @ts-ignore
			this[module.defaultDispatcher.method] = (...params: ApiCallerEventTypeV2<any>) => {
				this.onSyncEvent(module, ...params);
				__callback?.(...params);
			};
		});

		this.componentPhase = this.deriveComponentPhase();
	}

	// ######################### Life Cycle #########################

	private onSyncEvent = (module: BaseDB_ApiGeneratorCallerV2<DB_Object, any>, ...params: ApiCallerEventTypeV2<any>) => {
		//Define logic for change in module sync status
		if (params[0] === EventType_Sync) {
			this.componentPhase = this.deriveComponentPhase();
			if (this.componentPhase !== ComponentStatus.Synced)
				return this.forceUpdate();

			this.reDeriveState();
		}
	};

	private deriveComponentPhase() {
		const moduleStatuses = this.props.modules.map(module => ({syncStatus: module.getSyncStatus(), dataStatus: module.getDataStatus()}));
		const canBeRendered = this.canBeRendered();

		//If all Modules are synced
		if (moduleStatuses.every(status => status.syncStatus === SyncStatus.idle && status.dataStatus === DataStatus.containsData))
			return ComponentStatus.Synced;

		//If all modules are synced or in process of being synced, and pass the "canBeRendered" check
		if (this.props.modules.every(module => canBeRendered[module.getName()]())) {
			return ComponentStatus.Synced;
		}

		//Return loading
		return ComponentStatus.Loading;

		// //If all of the modules are outOfSync
		// if (moduleStatuses.every(status => status === SyncStatus.OutOfSync))
		// 	return ComponentStatus.Loading;
		//
		//
		// //Some of the components are in sync process
		// //If component is already out of load phase
		// if (this.componentPhase === ComponentStatus.Syncing || this.componentPhase === ComponentStatus.Synced)
		// 	return ComponentStatus.Syncing;
	}

	protected abstract canBeRendered(): { [k: string]: () => boolean }

	protected _deriveStateFromProps(nextProps: P): State | undefined {
		if (this.derivingState) {
			this.logVerbose('Scheduling new props', nextProps as {});
			this.pendingProps = nextProps;
			return;
		}

		this.logVerbose('Deriving state from props', nextProps as {});
		this.pendingProps = undefined;
		this.derivingState = true;

		const componentPhase = this.deriveComponentPhase();
		if (componentPhase !== ComponentStatus.Loading)
			this.deriveStateFromProps(nextProps)
				.then((state) => this.setState(state, this.reDeriveCompletedCallback))
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

	protected async deriveStateFromProps(nextProps: P): Promise<State> {
		return this.createInitialState(nextProps);
	}

	protected createInitialState(nextProps: P) {
		return {componentPhase: ComponentStatus.Loading} as State;
	}

	// ######################### Render #########################

	protected abstract _render(): JSX.Element

	render() {
		if (this.componentPhase === ComponentStatus.Loading)
			return <div className={'loader-container'}><TS_Loader/></div>;

		return this._render();
	}
}

export abstract class SmartPanel<Config, State = {}, Props = {}>
	extends SmartComponent<Props_WorkspacePanel<Config, Props>, State_WorkspacePanel<Config, State>> {

	protected async deriveStateFromProps(nextProps: Props_WorkspacePanel<Config, Props>) {
		const state = (await super.deriveStateFromProps(nextProps)) as State_SmartComponent;
		return {...state, config: {...nextProps.config}} as State_WorkspacePanel<Config, State> & State_SmartComponent;
	}

	shouldReDeriveState(nextProps: Readonly<Props_WorkspacePanel<Config, Props>>): boolean {
		return !compare(this.state.config, nextProps.config as Config);
	}
}