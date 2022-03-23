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

import {ApiCallerEventType, BaseDB_ApiGeneratorCaller, BaseDB_ApiGeneratorCallerV2} from '../../frontend';
import {AppPage, IndexKeys, RoutingModule} from '@nu-art/thunderstorm/frontend';
import {DB_Object} from '@nu-art/ts-common';
import * as React from 'react';

export type Props_DBItemListV2<ItemType extends DB_Object> = {
	pageTitle: string | (() => string)
	loader?: React.ReactNode

	childRoute: string
	newRoute?: string

	moduleFE: BaseDB_ApiGeneratorCallerV2<ItemType>
	_BC_Modules?: BaseDB_ApiGeneratorCaller<any, any>[]
}


export type State_DBItemListV2<ItemType extends DB_Object> = { items?: ItemType[] };

export abstract class Page_DBItemListV2<ItemType extends DB_Object, S extends State_DBItemListV2<ItemType> = State_DBItemListV2<ItemType>, P extends Props_DBItemListV2<ItemType> = Props_DBItemListV2<ItemType>>
	extends AppPage<P, S> {

	constructor(p: P) {
		super(p, p.pageTitle);

		// @ts-ignore
		this[p.moduleFE.getDefaultDispatcher().method] = this.__onItemUpdated;
	}

	private _BC_onItemUpdatedV1 = (...params: ApiCallerEventType): void => {
		if (params[0] !== 'query')
			return;

		if (this.props._BC_Modules && !this.props._BC_Modules.find(module => module.getItems().length === 0))
			this.forceUpdate();
	};

	protected deriveStateFromProps(nextProps: P, _state?: Partial<S>): S | undefined {
		(async () => await this.resolveState(nextProps))()
			.then((state) => this.setState({...state, ..._state}))
			.catch(e => this.logError(`error: ${e}`));

		return {} as S;
	}

	protected query(keys: IndexKeys<ItemType, any>) {
		this.props.moduleFE.unique(keys);
	}

	protected async resolveState(nextProps: P) {
		const items = await this.props.moduleFE.queryCache();
		return {items} as S;
	}

	componentDidMount() {
		this.props._BC_Modules?.forEach(module => {
			// @ts-ignore
			this[module.getDefaultDispatcher().method] = this._BC_onItemUpdatedV1;

			if (module.getItems()?.length)
				return;

			module.query();
		});
	}

	protected __onItemUpdated = (state?: Partial<S>): void => {
		this.deriveStateFromProps(this.props, state);
	};

	render() {
		if (this.props._BC_Modules && this.props._BC_Modules.find(module => module.getItems().length === 0))
			return this.props.loader || '';

		return this.renderItems(this.state.items);
	}

	protected abstract renderItems(items?: ItemType[]): React.ReactNode

	protected openPageById = (params: { [key: string]: string | number }) => {
		RoutingModule.goToRoute(this.props.childRoute, params);
	};
}

