import {_className, LL_H_C, LL_V_L, Props_SmartComponent, SmartComponent, State_SmartComponent} from '@nu-art/thunderstorm/frontend';
import {_values} from '@nu-art/ts-common';
import * as React from 'react';
import '../permission-keys-editor.scss';
import {Component_AccessLevelsEditor} from './Component_AccessLevelsEditor';
import {PermissionKey_FE} from '../../../PermissionKey_FE';
import {ModuleFE_PermissionsAssert} from '../../../modules/ModuleFE_PermissionsAssert';
import {ModuleFE_PermissionAccessLevel} from '../../../_entity';

type Props = Props_SmartComponent & {};

type State = State_SmartComponent & {
	editedItem?: PermissionKey_FE
};

export class PermissionKeysEditor
	extends SmartComponent<Props, State> {

	static defaultProps = {
		modules: [ModuleFE_PermissionAccessLevel]
	};

	protected async deriveStateFromProps(nextProps: Props, state: State): Promise<State> {
		state ??= this.state ? {...this.state} : {} as State;
		return state;
	}

	private renderKey = (item: PermissionKey_FE) => {
		const className = _className('item-list__list-item',
			item.key === this.state.editedItem?.key ? 'selected' : undefined);
		return <div
			className={className}
			onClick={() => this.setState({editedItem: item})}
			key={item.key}
		>{item.key}</div>;
	};

	private renderKeyList = () => {
		const allKeys = ModuleFE_PermissionsAssert.getAllPermissionKeys();

		return <LL_V_L className={'item-list'}>
			<div className={'item-list__header'}>Permission Keys</div>
			<LL_V_L className={'item-list__list'}>
				{_values(allKeys).map(this.renderKey)}
			</LL_V_L>
		</LL_V_L>;
	};

	private renderAccessLevels() {
		if (!this.state.editedItem)
			return null;

		return <Component_AccessLevelsEditor permissionKey={this.state.editedItem}/>;
	}

	private renderKeyEditor = () => {
		if (!this.state.editedItem)
			return '';

		return <LL_V_L className={'item-editor'}>
			<div className={'item-list__header'}>{this.state.editedItem.key}</div>
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