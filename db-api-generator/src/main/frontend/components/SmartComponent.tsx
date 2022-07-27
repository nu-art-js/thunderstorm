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
import {ApiCallerEventTypeV2, BaseDB_ApiGeneratorCallerV2, SyncStatus} from '../modules/BaseDB_ApiGeneratorCallerV2';
import {ComponentAsync, Props_WorkspacePanel, State_WorkspacePanel, TS_Loader} from '@nu-art/thunderstorm/frontend';
import {EventType_Sync} from '../consts';


export enum ComponentStatus {
	Loading,
	Syncing,
	Synced,
}

export type Props_SmartComponent = {
	modules: BaseDB_ApiGeneratorCallerV2<DB_Object, any>[];
}

export abstract class SmartComponent<P extends any = {}, State extends any = {}, Props extends Props_SmartComponent & P = Props_SmartComponent & P>
	extends ComponentAsync<Props, State> {

	protected componentPhase: ComponentStatus = ComponentStatus.Loading;

	private onSyncEvent = (module: BaseDB_ApiGeneratorCallerV2<DB_Object, any>, ...params: ApiCallerEventTypeV2<any>) => {
		//Define logic for change in module sync status
		if (params[0] === EventType_Sync) {
			this.componentPhase = this.deriveComponentPhase();
			if (this.componentPhase !== ComponentStatus.Synced)
				return this.forceUpdate();

			this.reDeriveState();
		}
	};

	constructor(p: Props) {
		super(p);

		this.props.modules.forEach(module => {
			const __callback = this[module.defaultDispatcher.method]?.bind(this);
			this[module.defaultDispatcher.method] = (...params: ApiCallerEventTypeV2<any>) => {
				__callback?.(...params);
				this.onSyncEvent(module, ...params);
			};
		});

		this.componentPhase = this.deriveComponentPhase(true);
	}

	private deriveComponentPhase() {
		const moduleStatuses = this.props.modules.forEach(module.getSyncStatus);

		//If all of the modules are outOfSync
		if (moduleStatuses.every(status => status === SyncStatus.OutOfSync))
			return ComponentStatus.Loading;

		//If all of the modules are synced
		if (moduleStatuses.every(status => status === SyncStatus.Synced))
			return ComponentStatus.Synced;

		//Some of the components are in sync process
		//If component is already out of load phase
		if (this.componentPhase === ComponentStatus.Syncing || this.componentPhase === ComponentStatus.Synced)
			return ComponentStatus.Syncing;

		//Return loading
		return ComponentStatus.Loading;
	}

	protected abstract _render(): JSX.Element

	render() {
		if (this.componentPhase === ComponentStatus.Loading)
			return <div className={'loader-container'}><TS_Loader/></div>;

		return this._render();
	}
}

export abstract class SmartPanel<Config, State = {}, Props = {}>
	extends SmartComponent<Props_WorkspacePanel<Config, Props>, State_WorkspacePanel<Config, State>> {

	protected async deriveStateFromProps(nextProps: Props_WorkspacePanel<Config, Props>): Promise<State_WorkspacePanel<Config, State>> {
		return {config: {...nextProps.config}} as State_WorkspacePanel<Config, State>;
	}

	shouldReDeriveState(nextProps: Readonly<Props_WorkspacePanel<Config, Props>>): boolean {
		return !compare(this.state.config, nextProps.config as Config);
	}
}