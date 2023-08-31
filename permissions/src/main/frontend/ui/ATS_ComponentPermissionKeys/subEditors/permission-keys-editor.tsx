import {
	_className,
	LL_H_C,
	LL_V_L,
	Props_SmartComponent,
	SmartComponent,
	State_SmartComponent
} from '@nu-art/thunderstorm/frontend';
import {_keys, BadImplementationException, cloneArr, sortArray, TypedMap} from '@nu-art/ts-common';
import * as React from 'react';
import '../permission-keys-editor.scss';
import {DB_PermissionAccessLevel} from '../../../../shared';
import {Component_AccessLevelsEditor} from './Component_AccessLevelsEditor';
import {DB_PermissionKeyData} from '../../../../shared/types';
import {PermissionKey_FE} from '../../../PermissionKey_FE';
import {ModuleFE_PermissionsAccessLevel} from '../../../modules/manage/ModuleFE_PermissionsAccessLevel';
import {ModuleFE_PermissionsAssert} from '../../../modules/ModuleFE_PermissionsAssert';

type Props = Props_SmartComponent & {};

type EditedItemType = {
	key: string,
	data: Partial<DB_PermissionKeyData>
};
type State = State_SmartComponent & {
	keys: TypedMap<PermissionKey_FE<any>>;
	selectedItemKey?: string;
	editedItem?: EditedItemType
	selectedItemAccessLevels: DB_PermissionAccessLevel[];
};

export class PermissionKeysEditor
	extends SmartComponent<Props, State> {

	static defaultProps = {
		modules: [ModuleFE_PermissionsAccessLevel,]
	};

	protected async deriveStateFromProps(nextProps: Props, state: State): Promise<State> {
		state.keys = ModuleFE_PermissionsAssert.getAllPermissionKeys();
		state.selectedItemAccessLevels = cloneArr(ModuleFE_PermissionsAccessLevel.cache.filter(dbLevel => !!this.state.editedItem?.data?.accessLevelIds?.includes(dbLevel._id)));

		return state;
	}

	private selectItem = (itemKey?: string) => {
		let _editedItem: EditedItemType | undefined = undefined;

		if (itemKey) {
			const item = this.state.keys[itemKey];
			if (!item)
				throw new BadImplementationException(`Could not find item with key ${itemKey}`);

			_editedItem = itemKey === this.state.selectedItemKey
				? this.state.editedItem
				: {key: itemKey, data: {type: 'permission-key', accessLevelIds: [], _accessLevels: {}}};
		}

		return this.reDeriveState({selectedItemKey: itemKey, editedItem: _editedItem});
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

	// private getDataFromKey(key: string) {
	// 	return ModuleFE_PermissionsAssert.getPermissionKey(key).get();
	// }


	private renderAccessLevels() {
		if (!this.state.selectedItemKey)
			return null;

		const sortedLevels = sortArray(this.state.selectedItemAccessLevels, level => level.name);

		return <Component_AccessLevelsEditor levels={sortedLevels} onChange={() => {
			const accessLevels = this.state.selectedItemAccessLevels;
			this.logInfo(`array length: ${accessLevels.length}`);
			this.setState({selectedItemAccessLevels: sortArray(accessLevels, level => level.name)});
		}}/>;
	}

	private renderKeyEditor = () => {
		return this.state.selectedItemKey !== undefined && <LL_V_L className={'item-editor'}>
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