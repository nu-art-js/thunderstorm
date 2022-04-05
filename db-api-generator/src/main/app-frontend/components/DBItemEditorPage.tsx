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

import {
	ApiCallerEventType,
	ApiCallerEventTypeV2,
	BaseDB_ApiGeneratorCaller,
	BaseDB_ApiGeneratorCallerV2,
	EventType_Create,
	EventType_Delete,
	EventType_MultiUpdate,
	EventType_Query,
	EventType_Unique
} from '../../frontend';
import {AppPage, IndexKeys, RoutingModule, stopPropagation} from '@nu-art/thunderstorm/frontend';
import {DB_Object, TypedMap} from '@nu-art/ts-common';
import * as React from 'react';
import {Props_DBItemEditorComponentV2} from './DBItemEditorComponent';

export type Props_DBItemEditorPageV2<ItemType extends DB_Object, Ks extends keyof ItemType = '_id'> = {
	keys: Ks[]
	pageTitle: string
	loader?: React.ReactNode

	parentRoute: string
	childRoute: string
	newRoute: string

	moduleFE: BaseDB_ApiGeneratorCallerV2<ItemType, Ks>
	itemEditor?: React.ElementType<Props_DBItemEditorComponentV2<ItemType>>
	_BC_Modules?: BaseDB_ApiGeneratorCaller<any, any>[]
}

export type State_DBItemEditorPageV2<ItemType extends DB_Object, Ks extends keyof ItemType = '_id'> = {
	keys: IndexKeys<ItemType, Ks>,
	item?: ItemType
}

export abstract class DBItemEditorPage<ItemType extends DB_Object,
	Ks extends keyof ItemType = '_id',
	S extends State_DBItemEditorPageV2<ItemType, Ks> = State_DBItemEditorPageV2<ItemType, Ks>,
	P extends Props_DBItemEditorPageV2<ItemType, Ks> = Props_DBItemEditorPageV2<ItemType, Ks>>
	extends AppPage<P, S> {

	constructor(props: P) {
		super(props, props.pageTitle);

		// @ts-ignore
		this[props.moduleFE.getDefaultDispatcher().method] = this.__onItemUpdated;
	}

	protected deriveStateFromProps(nextProps: P): S | undefined {
		(async () => await this.resolveState(nextProps))()
			.then((state) => {
				if (!state.keys && RoutingModule.getMyRouteKey() !== this.props.newRoute) {
					RoutingModule.goToRoute(this.props.parentRoute);
					return '';
				}

				return this.setState(state);
			})
			.catch(e => this.logError(`error: ${e}`));
		return {} as S;
	}

	protected async resolveState(nextProps: P) {
		const keys = this.resolveKeys(nextProps, (key: Ks) => DBItemEditorPage.getQueryParameter(key as string));
		let item: DB_Object | undefined;
		try {
			item = await this.props.moduleFE.uniqueQueryCache(keys);
		} catch (e: any) {
			this.logWarning(`error getting item from cache: `, e);
		}
		return {keys, item: item || {}} as S;
	}

	private resolveKeys(props: P, resolver: (key: Ks) => string | undefined) {
		return props.keys.reduce((toRet, key) => {
			const value = resolver(key);
			if (value)
				toRet[key] = value as unknown as ItemType[Ks];
			return toRet;
		}, {} as IndexKeys<ItemType, Ks>);
	}

	private handleSave = (ev: KeyboardEvent) => {
		if ((ev.metaKey || ev.ctrlKey) && !ev.shiftKey && ev.key === 's') {
			stopPropagation(ev);
			this.saveImpl();
		}
	};

	protected saveImpl = (item?: Partial<ItemType>) => {
		this.props.moduleFE.upsert((item || this.state.item) as ItemType);
	};

	componentWillUnmount() {
		document.removeEventListener('keydown', this.handleSave);
	}

	private _BC_onItemUpdatedV1 = (...params: ApiCallerEventType): void => {
		if (params[0] !== 'query')
			return;

		if (this.props._BC_Modules && !this.props._BC_Modules.find(module => module.getItems().length === 0))
			this.forceUpdate();
	};

	componentDidMount() {
		document.addEventListener('keydown', this.handleSave);
		this.props._BC_Modules?.forEach(module => {
			// @ts-ignore
			this[module.getDefaultDispatcher().method] = this._BC_onItemUpdatedV1;

			if (module.getItems()?.length)
				return;

			module.query();
		});
	}

	private __onItemUpdated = (...params: ApiCallerEventTypeV2<ItemType>): void => {
		if (params[0] === EventType_MultiUpdate || params[0] === EventType_Query)
			return;

		if (this.props.keys.find(key => (params[1] as ItemType)[key] !== this.state.keys[key]))
			return this.logWarning('TBR: Not our items was updated');

		if (params[0] === EventType_Delete)
			return RoutingModule.goToRoute(this.props.parentRoute);

		if (params[0] === EventType_Create) {
			const keys = this.resolveKeysFromInstance(params[1]) as unknown as TypedMap<string>;
			return RoutingModule.goToRoute(this.props.childRoute, keys);
		}

		if (params[0] === EventType_Unique) {
			(async () => {
				const keys = this.resolveKeysFromInstance(params[1]);
				const item = await this.props.moduleFE.uniqueQueryCache(keys);
				if (!item) {
					this.logWarning('THIS SHOULD NOT HAPPEN');
					return {};
				}

				return {item, keys} as S;
			})()
				.then((state) => this.setState(state))
				.catch(e => this.logError(`error: ${e}`));
			return;
		}
	};

	private resolveKeysFromInstance(item: ItemType) {
		return this.resolveKeys(this.props, (key: Ks) => item[key] as unknown as string);
	}

	render() {
		if (!this.state.item)
			return this.props.loader || '';

		if (this.props._BC_Modules && this.props._BC_Modules.find(module => module.getItems().length === 0))
			return this.props.loader || '';

		return this.renderEditor();
	}


	renderEditor() {
		const ItemEditor = this.props.itemEditor;
		if (!ItemEditor)
			return 'This editor class should override the renderEditor method!';

		// @ts-ignore
		return <ItemEditor keys={this.state.keys} moduleFE={this.props.moduleFE} onChange={this.saveImpl}/>;
	}
}