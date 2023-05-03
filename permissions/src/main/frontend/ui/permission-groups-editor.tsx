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
import {LL_H_C, SimpleListAdapter, TS_DropDown, TS_Input, TS_PropRenderer} from '@nu-art/thunderstorm/frontend';
import {BadImplementationException} from '@nu-art/ts-common';
import {EditorBase, State_EditorBase} from './editor-base';
import {DB_PermissionAccessLevel, DB_PermissionGroup} from '../shared';
import {ModuleFE_PermissionsAccessLevel, ModuleFE_PermissionsGroup, OnPermissionsGroupsUpdated} from '../core/module-pack';
import {TS_Icons} from '@nu-art/ts-styles';

type State = State_EditorBase<DB_PermissionGroup> & {
	levels: Readonly<DB_PermissionAccessLevel[]>
};


export class PermissionGroupsEditor
	extends EditorBase<DB_PermissionGroup, State>
	implements OnPermissionsGroupsUpdated {

	//######################### Static #########################

	readonly module = ModuleFE_PermissionsGroup;
	readonly itemName = 'Permission Group';
	readonly itemNamePlural = 'Permission Groups';
	readonly itemDisplay = (item: DB_PermissionGroup) => item.label;
	static defaultProps = {
		modules: [ModuleFE_PermissionsGroup]
	};

	//######################### Life Cycle #########################

	__onPermissionsGroupsUpdated(...params: ApiCallerEventTypeV2<DB_PermissionGroup>) {
		if ([EventType_Update, EventType_Create].includes(params[0])) {
			const level = params[1] as DB_PermissionGroup;
			this.reDeriveState({
				selectedItemId: level._id,
				editedItem: new EditableDBItem<DB_PermissionGroup>(level, ModuleFE_PermissionsGroup)
			});
		}
		if (params[0] === EventType_Delete)
			this.reDeriveState({selectedItemId: undefined, editedItem: undefined});
	}

	protected async deriveStateFromProps(nextProps: Props_SmartComponent, state: (State & State_SmartComponent)) {
		state.items = ModuleFE_PermissionsGroup.cache.all();
		state.levels = ModuleFE_PermissionsAccessLevel.cache.all();
		return state;
	}

	//######################### Render #########################

	private renderAccessLevels = () => {
		const group = this.state.editedItem!;
		const ids = group.item.accessLevelIds || [];
		const adapter = SimpleListAdapter(this.state.levels.filter(i => !ids.includes(i._id)) as DB_PermissionAccessLevel[], item => <div>{item.item.name}</div>);
		return <TS_PropRenderer.Vertical label={'Access Levels'}>
			<LL_H_C className={'editable-list'}>
				{ids.map(id => {
					const level = this.state.levels.find(level => level._id === id);
					if (!level)
						throw new BadImplementationException(`No permission level found for id ${id}`);

					return <div className={'editable-list__item'} key={id}>
						{level.name}
						<TS_Icons.x.component
							className={'editable-list__remove-icon'}
							onClick={() => this.setProperty('accessLevelIds', ids.filter(i => i !== id))}
						/>
					</div>;
				})}
				<TS_DropDown<DB_PermissionAccessLevel>
					adapter={adapter}
					onSelected={value => this.setProperty('accessLevelIds', [...ids, value._id])}
					selected={undefined}
					className={'fancy'}
					placeholder={'Add Access Level'}
				/>
			</LL_H_C>
		</TS_PropRenderer.Vertical>;
	};

	editorContent = () => {
		const group = this.state.editedItem!;
		return <>
			<TS_PropRenderer.Vertical label={'Label'}>
				<TS_Input type={'text'} value={group.item.label} onChange={value => this.setProperty('label', value)}/>
			</TS_PropRenderer.Vertical>
			{this.renderAccessLevels()}
		</>;
	};
}