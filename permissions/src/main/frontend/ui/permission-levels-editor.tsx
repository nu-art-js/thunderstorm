import * as React from 'react';
import {
	ApiCallerEventTypeV2,
	EditableDBItem,
	EventType_Create,
	EventType_Delete,
	EventType_Update,
	Props_SmartComponent,
	State_SmartComponent
} from '@nu-art/db-api-generator/frontend';
import {SimpleListAdapter, TS_DropDown, TS_Input, TS_PropRenderer} from '@nu-art/thunderstorm/frontend';
import {EditorBase, State_EditorBase} from './editor-base';
import {DB_PermissionAccessLevel, DB_PermissionDomain} from '../shared';
import {ModuleFE_PermissionsAccessLevel, ModuleFE_PermissionsDomain, OnPermissionsLevelsUpdated} from '../core/module-pack';

type State = State_EditorBase<DB_PermissionAccessLevel> & {
	domains: Readonly<DB_PermissionDomain[]>
};

export class PermissionLevelsEditor
	extends EditorBase<DB_PermissionAccessLevel, State>
	implements OnPermissionsLevelsUpdated {

	//######################### Static #########################

	readonly module = ModuleFE_PermissionsAccessLevel;
	readonly itemName = 'Permission Level';
	readonly itemNamePlural = 'Permission Levels';
	readonly itemDisplay = (item: DB_PermissionAccessLevel) => item.name;
	static defaultProps = {
		modules: [ModuleFE_PermissionsAccessLevel]
	};

	//######################### Life Cycle #########################

	__onPermissionsLevelsUpdated(...params: ApiCallerEventTypeV2<DB_PermissionAccessLevel>) {
		if ([EventType_Update, EventType_Create].includes(params[0])) {
			const level = params[1] as DB_PermissionAccessLevel;
			this.reDeriveState({
				selectedItemId: level._id,
				editedItem: new EditableDBItem<DB_PermissionAccessLevel>(level, ModuleFE_PermissionsAccessLevel)
			});
		}
		if (params[0] === EventType_Delete)
			this.reDeriveState({selectedItemId: undefined, editedItem: undefined});
	}

	protected async deriveStateFromProps(nextProps: Props_SmartComponent, state: (State & State_SmartComponent)) {
		state.items = ModuleFE_PermissionsAccessLevel.cache.all();
		state.domains = ModuleFE_PermissionsDomain.cache.all();
		return state;
	}

	//######################### Render #########################

	private renderDomainDropDown = () => {
		const level = this.state.editedItem;
		if (!level)
			return '';

		const selectedDomain = level.item.domainId ? this.state.domains.find(item => item._id === level.item.domainId) : undefined;
		const adapter = SimpleListAdapter(this.state.domains as DB_PermissionDomain[], item => <div>{item.item.namespace}</div>);
		return <TS_PropRenderer.Vertical label={'Domain'}>
			<TS_DropDown<DB_PermissionDomain>
				adapter={adapter}
				selected={selectedDomain}
				onSelected={item => this.setProperty('domainId', item._id)}
			/>
		</TS_PropRenderer.Vertical>;
	};

	editorContent = () => {
		const level = this.state.editedItem!;
		return <>
			<TS_PropRenderer.Vertical label={'Name'}>
				<TS_Input type={'text'} value={level.item.name} onChange={value => this.setProperty('name', value)}/>
			</TS_PropRenderer.Vertical>
			<TS_PropRenderer.Vertical label={'Value'}>
				<TS_Input type={'number'} value={String(level.item.value)} onChange={value => this.setProperty('value', Number(value))}/>
			</TS_PropRenderer.Vertical>
			{this.renderDomainDropDown()}
		</>;
	};
}