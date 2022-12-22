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
import {DB_Object} from '@nu-art/ts-common';
import {ApiCallerEventTypeV2, BaseDB_ApiCaller, DataStatus} from '../modules/BaseDB_ApiCaller';
import {TS_ErrorBoundary, TS_Loader} from '@nu-art/thunderstorm/frontend';
import {EventType_Sync} from '../consts';
import {BaseComponent} from '@nu-art/thunderstorm/frontend/core/ComponentBase';


export enum ComponentStatus {
	Loading,
	Syncing,
	Synced,
}

export type Props_SmartComponent = {
	modules?: BaseDB_ApiCaller<DB_Object, any>[];
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
	private pending?: {
		props: Props,
		state: State
	};

	constructor(p: Props) {
		super(p);
		this.props.modules?.forEach(module => {
			// @ts-ignore
			const __callback = this[module.defaultDispatcher.method]?.bind(this);
			// @ts-ignore
			this[module.defaultDispatcher.method] = (...params: ApiCallerEventTypeV2<any>) => {
				this.onSyncEvent(module, ...params);
				__callback?.(...params);
			};
		});

		const _render = this.render?.bind(this);
		this.render = () => {

			const toRet = () => {
				if (this.state.componentPhase === ComponentStatus.Loading)
					return this.renderLoader();

				return <>
					{_render()}
					{this.state.componentPhase === ComponentStatus.Syncing &&
						<div className={'loader-transparent-container'}><TS_Loader/></div>}
				</>;
			};

			return <TS_ErrorBoundary onError={this.reDeriveState} error={this.state.error}>
				{toRet()}
			</TS_ErrorBoundary>;
		};
	}

	// ######################### Life Cycle #########################

	private onSyncEvent = (module: BaseDB_ApiCaller<DB_Object, any>, ...params: ApiCallerEventTypeV2<any>) => {
		//Define logic for change in module sync status
		// this.logInfo(`onSyncEvent: ${module.getCollectionName()} ${params[0]}`);
		if (params[0] === EventType_Sync) {
			this.reDeriveState();
		}
	};

	protected _deriveStateFromProps(nextProps: Props, partialState: State = this.createInitialState(nextProps)): State | undefined {
		const currentState = partialState;

		let isReady: boolean;
		if (!this.props.modules || this.props.modules.length === 0)
			isReady = true;
		else
			isReady = this.props.modules?.every(module => module.getDataStatus() === DataStatus.containsData);

		if (!isReady) {
			const state = this.createInitialState(nextProps);
			this.logVerbose(`Component not ready`, state);
			return state;
		}

		if (this.derivingState) {
			this.logVerbose('Scheduling new props', nextProps as {});
			this.pending = {props: nextProps, state: partialState};
			return;
		}

		this.logDebug('Will derive state from props', nextProps as {});
		this.pending = undefined;
		this.derivingState = true;

		this.deriveStateFromProps(nextProps, {...partialState, componentPhase: ComponentStatus.Synced})
			.then((state) => {

				if (this.pending)
					return this.reDeriveCompletedCallback(state);

				if (!this.mounted)
					return this.logWarning('Will not set derived state - Component Unmounted');

				this.logDebug(`resolved state: `, state);
				if (state)
					this.setState(state, this.reDeriveCompletedCallback);
			})
			.catch(e => {
				this.logError(`error`, e);
				if (!this.mounted)
					return this.logWarning('Will not set derived error state - Component Unmounted');

				this.setState({error: e}, this.reDeriveCompletedCallback);
			});

		this.logDebug(`state: `, currentState);
		return currentState;
	}

	private reDeriveCompletedCallback = (state?: State) => {
		this.derivingState = false;
		if (!this.pending)
			return;

		if (!this.mounted)
			return this.logWarning('Will not trigger pending props - Component Unmounted');

		this.logVerbose('Triggering pending props');
		this._deriveStateFromProps(this.pending.props, {...state, ...this.pending.state});
	};

	protected abstract deriveStateFromProps(nextProps: Props, state?: Partial<S> & State_SmartComponent): Promise<State>;

	protected createInitialState(nextProps: Props) {
		return {componentPhase: ComponentStatus.Loading} as State;
	}

	// ######################### Render #########################

	protected renderLoader = () => {
		return <div className={'loader-container'}><TS_Loader/></div>;
	};
}