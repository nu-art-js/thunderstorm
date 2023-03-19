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

import {DB_Object, PreDB} from '@nu-art/ts-common';
import * as React from 'react';
import './TS_Dialog2.scss';
import {BaseDB_ModuleFE} from '../../modules/BaseDB_ModuleFE';
import {_className, ComponentSync, LL_H_C, LL_V_L, TS_Button, ModuleFE_Dialog} from '@nu-art/thunderstorm/frontend';
import {BaseDB_ApiCaller} from '../../modules/BaseDB_ApiCaller';


export type Props<T extends DB_Object, Ks extends keyof T = '_id'> = {
	module: BaseDB_ModuleFE<T, Ks, any>;
	body: React.ReactNode | ((item?: PreDB<T>) => React.ReactNode)
	title: React.ReactNode | ((item?: PreDB<T>) => React.ReactNode)
	actions: DialogAction<T>[]
	item?: PreDB<T>;
}

type DialogAction<T extends DB_Object> = {
	label: React.ReactNode
	action: ((item: T) => any | Promise<any>) | ((item: PreDB<T>) => any | Promise<any>)
	className?: string
}

type State<T> = { inProgress: boolean, item: T }

const Button_Close = {
	label: 'Close',
	action: ModuleFE_Dialog.close
};

class SmartDialog<T extends DB_Object, Ks extends keyof T = '_id'>
	extends ComponentSync<Props<T, Ks>, State<T>> {

	constructor(props: Props<T, Ks>) {
		super(props);
	}

	protected deriveStateFromProps(nextProps: Props<T, Ks>) {
		return {inProgress: this.state?.inProgress || false, item: this.props.item as T || {} as T};
	}

	render() {
		return (
			<LL_V_L className="ts-dialog-2">
				{this.renderTitle()}
				{this.renderBody()}
				<LL_H_C className="ts-dialog__buttons-container">
					{this.props.actions.map((action, index) =>
						<TS_Button
							key={index}
							className={_className('ts-dialog__button', action.className)}
							onClick={(e) => action.action(this.state.item)}>{action.label}
						</TS_Button>
					)}
				</LL_H_C>
			</LL_V_L>
		);
	}

	private renderBody() {
		const body = this.props.body;
		if (!body)
			return;

		return <LL_V_L className="ts-dialog__body">
			{typeof body === 'function' ? body(this.state.item) : body}
		</LL_V_L>;
	}

	private renderTitle() {
		const title = this.props.title;
		if (!title)
			return;

		return <LL_H_C className="ts-dialog__header">
			{typeof title === 'function' ? title(this.state.item) : title}
		</LL_H_C>;
	}
}

export type DialogConfig<T extends DB_Object, Ks extends keyof T = '_id'> = {
	moduleApi: BaseDB_ApiCaller<T, Ks, any>
	moduleDB: BaseDB_ModuleFE<T, Ks, any>
	renderer: React.ReactNode | ((item?: PreDB<T>) => React.ReactNode)
}

export const createSmartDialog = <T extends DB_Object, Ks extends keyof T = '_id'>(config: DialogConfig<T, Ks>) => {
	return {
		update: (item?: PreDB<T>, title: string | ((item?: PreDB<T>) => React.ReactNode) = () => '') => {
			const module: BaseDB_ModuleFE<T, Ks, any> = config.moduleDB;
			const actions = [Button_Close, {
				label: item ? 'Update' : 'Create',
				action: (item: PreDB<T>) => config.moduleApi.v1.upsert(item).executeSync()
			}];

			return <SmartDialog<T, Ks>
				module={module}
				body={config.renderer}
				title={title}
				actions={actions}

			/>;
		},
		delete: (item: T, title?: string | ((item?: PreDB<T>) => React.ReactNode)) => {
			const module: BaseDB_ModuleFE<T, Ks, any> = config.moduleDB;
			const actions = [Button_Close, {
				label: 'Delete',
				action: (item: T) => config.moduleApi.v1.delete({_id: item._id}).executeSync()
			}];

			return <SmartDialog<T, Ks>
				module={module}
				body={config.renderer}
				title={title}
				actions={actions}

			/>;

		}
	};
};