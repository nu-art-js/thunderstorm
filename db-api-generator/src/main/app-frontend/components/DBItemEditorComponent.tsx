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

import {ApiCallerEventTypeV2, BaseDB_ApiGeneratorCallerV2, EventType_MultiUpdate, EventType_Query, EventType_Update} from '../../frontend';
import {ComponentAsync, IndexKeys} from '@nu-art/thunderstorm/frontend';
import {_keys, compare, DB_Object, RequireOnlyOne} from '@nu-art/ts-common';
import * as React from 'react';

export type State_DBItemEditorComponentV2<ItemType> = {
	item: Partial<ItemType>
};

export type Props_DBItemEditorComponentV2<ItemType extends DB_Object, Ks extends keyof ItemType = '_id'> = RequireOnlyOne<{
	item: Partial<ItemType>
	keys: IndexKeys<ItemType, Ks>,
}> & {
	onChange?: ((item: Partial<ItemType> & DB_Object, key: keyof ItemType) => void)
	moduleFE: BaseDB_ApiGeneratorCallerV2<ItemType, Ks>
};

export abstract class DBItemEditorComponent<ItemType extends DB_Object,
	Ks extends keyof ItemType = '_id',
	Props extends any = {},
	State extends any = {},
	P extends Props_DBItemEditorComponentV2<ItemType, Ks> & Props = Props_DBItemEditorComponentV2<ItemType, Ks> & Props,
	S extends State_DBItemEditorComponentV2<ItemType> & State = State_DBItemEditorComponentV2<ItemType> & State>
	extends ComponentAsync<P, S> {

	constructor(props: P) {
		super(props);
		// this.logDebug('constructor', props.keys);
		this.__onItemUpdated.bind(this);
		// @ts-ignore
		this[props.moduleFE.defaultDispatcher.method] = this.__onItemUpdated;
		// @ts-ignore
		// this[props.moduleFE.defaultDispatcher.method].bind(this);
	}

	protected async deriveStateFromProps(nextProps: P): Promise<S> {
		let item = nextProps.item;

		if (!item)
			try {
				item = nextProps.keys && await nextProps.moduleFE.uniqueQueryCache(nextProps.keys);
			} catch (e: any) {
				this.logWarning(`error getting item from cache: `, e);
			}

		if (!item)
			item = this.createEmptyItem();

		return {item} as S;
	}

	protected createInitialState(nextProps: P) {
		return {item: this.createEmptyItem()} as S;
	}

	protected query(keys: IndexKeys<ItemType, Ks>) {
		this.props.moduleFE.unique(keys);
	}

	public createEmptyItem(): Partial<ItemType> {
		return {} as Partial<ItemType>;
	}

	render() {
		return this.renderItem(this.state.item);
	}

	protected save(item: Partial<ItemType>, key: keyof ItemType) {
		this.props.moduleFE.upsert(item as ItemType, (updatedItem) => this.props.onChange?.(updatedItem, key));
	}

	protected __onItemUpdated(...params: ApiCallerEventTypeV2<ItemType>): void {
		if (params[0] === EventType_MultiUpdate || params[0] === EventType_Query)
			return;

		if (this.props.keys && _keys(this.props.keys).find(key => this.state.item?.[key] && this.state.item?.[key] !== (params[1] as ItemType)?.[key]))
			return;

		if (params[0] === EventType_Update) {
			this.logDebug(`updated: ${params[1]}`);
			this.setState({item: (params[1] as ItemType)} as unknown as S);
			return;
		}
	}

	protected setPropValue = <K extends keyof ItemType>(key: K, value: Partial<ItemType[K]>) => {
		const item = this.state.item;
		if (!item)
			return this.logWarning('This should never happen!!! item is undefined');

		if (compare(item[key], value as ItemType[K]))
			return;

		item[key] = value as ItemType[K];
		this.props.onChange?.(item as Partial<ItemType> & DB_Object, key);
	};

	abstract renderItem(item: Partial<ItemType>): React.ReactNode;
}

