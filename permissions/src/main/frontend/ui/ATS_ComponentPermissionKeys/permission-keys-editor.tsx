import {
	_className,
	LL_H_C,
	LL_V_L,
	Props_SmartComponent,
	SmartComponent,
	State_SmartComponent
} from '@nu-art/thunderstorm/frontend';
import {PermissionKey_FE} from '../../PermissionKey_FE';
import {ModuleFE_PermissionsAssert} from '../../modules/ModuleFE_PermissionsAssert';
import {_keys, BadImplementationException, sortArray, TypedMap} from '@nu-art/ts-common';
import * as React from 'react';
import './permission-keys-editor.scss';
import {ModuleFE_PermissionsAccessLevel} from '../../modules/manage/ModuleFE_PermissionsAccessLevel';
import {DB_PermissionKeyData} from '../../../shared/types';

type Props = Props_SmartComponent & {};

type State = State_SmartComponent & {
	keys: TypedMap<PermissionKey_FE<any>>;
	selectedItemKey?: string;
	editedItem?: {
		key: string,
		data: Partial<DB_PermissionKeyData>
	}
};

export class PermissionKeysEditor
	extends SmartComponent<Props, State> {

	static defaultProps = {
		modules: [ModuleFE_PermissionsAccessLevel,]
	};

	protected async deriveStateFromProps(nextProps: Props, state: State): Promise<State> {
		state.keys = ModuleFE_PermissionsAssert.getAllPermissionKeys();
		return state;
	}

	private selectItem = (itemKey?: string) => {
		if (itemKey) {
			const item = this.state.keys[itemKey];
			if (!item)
				throw new BadImplementationException(`Could not find item with key ${itemKey}`);
		}

		return this.reDeriveState({selectedItemKey: itemKey});
	};

	private renderKey = (item: { key: string, value: PermissionKey_FE<any> }) => {
		const className = _className('item-list__list-item', item.key === this.state.selectedItemKey ? 'selected' : undefined);
		return <div className={className} onClick={() => this.selectItem(item.key)}
					key={item.key}>{item.key}</div>;
	};

	private renderKeyList = () => {
		const items = sortArray(_keys(this.state.keys).map(keyOfKey => ({
			key: keyOfKey as string,
			value: this.state.keys[keyOfKey]
		})), item => item.key);

		return <LL_V_L className={'item-list'}>
			<div className={'item-list__header'}>Permission Keys</div>
			<LL_V_L className={'item-list__list'}>
				{items.map(this.renderKey)}
			</LL_V_L>
		</LL_V_L>;
	};

	private getDataFromKey(key: string) {
		return ModuleFE_PermissionsAssert.getPermissionKey(key).get();
	}

	private renderAccessLevels() {
		if(!this.state.selectedItemKey)
			return null;

		const data = this.getDataFromKey(this.state.selectedItemKey);
		if(!data){
			// todo
			return null;
		}
		return null;
	}

	private renderKeyEditor = () => {
		return this.state.selectedItemKey !== undefined && <LL_V_L>
            <div className={'item-list__header'}>{this.state.selectedItemKey}</div>
			{this.renderAccessLevels()}
        </LL_V_L>;
	};

	render() {
		return <LL_H_C className={'permissions-key-editor match_parent'}>
			{this.renderKeyList()}
			{this.renderKeyEditor()}
		</LL_H_C>;
	}
}