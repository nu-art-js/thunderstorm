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
import {_values, TypedMap} from '@nu-art/ts-common';
import {BaseDB_ApiGeneratorCallerV2, SyncStatus} from '../modules/BaseDB_ApiGeneratorCallerV2';
import {ComponentAsync, TS_Loader} from '@nu-art/thunderstorm/frontend';
import {EventType_Sync} from '../consts';

export enum ComponentStatus {
	Loading,
	Syncing,
	Synced,
}

type Module = BaseDB_ApiGeneratorCallerV2<any>

type Props_SmartComponent = {
	modules: Module[];
}

export abstract class SmartComponent<P extends any = {}, State extends any = {}, Props extends Props_SmartComponent & P = Props_SmartComponent & P>
	extends ComponentAsync<Props, State> {

	readonly moduleSyncStatuses: TypedMap<SyncStatus> = {};
	protected componentPhase: ComponentStatus = ComponentStatus.Loading;

	protected constructor(p: Props) {
		super(p);

		this.props.modules.forEach(module => {
			//@ts-ignore
			this[module.defaultDispatcher.method] = (...params: ApiCallerEventTypeV2<any>) => {
				//Define logic for change in module sync status
				if (params[0] === EventType_Sync) {
					this.moduleSyncStatuses[module.getName()] = module.getSyncStatus();
					this.componentPhase = this.deriveComponentPhase();
					if (this.componentPhase !== ComponentStatus.Synced)
						return this.forceUpdate();

					this.reDeriveState();
				}
			};
		});

		this.componentPhase = this.deriveComponentPhase(true);
	}

	private deriveComponentPhase(queryModuleStatuses: boolean = false) {

		if (queryModuleStatuses) {
			this.props.modules.forEach(module => {
				this.moduleSyncStatuses[module.getName()] = module.getSyncStatus();
			});
		}
		const moduleStatuses = _values(this.moduleSyncStatuses);
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