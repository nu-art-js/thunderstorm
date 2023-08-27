import * as React from 'react';
import {
	EditableDBItem,
	EventType_Create,
	EventType_Delete,
	EventType_Update,
	Props_SmartComponent,
	State_SmartComponent,
	TS_Input,
	TS_PropRenderer
} from '@nu-art/thunderstorm/frontend';
import {exists, UniqueId} from '@nu-art/ts-common';
import {EditorBase, State_EditorBase} from './editor-base';
import {DB_PermissionGroup} from '../../shared';
import {
	ModuleFE_PermissionsAccessLevel,
	ModuleFE_PermissionsDomain,
	ModuleFE_PermissionsGroup,
	OnPermissionsGroupsUpdated
} from '../../core/module-pack';
import {MultiSelect} from '../ui-props';
import {TS_Icons} from '@nu-art/ts-styles';
import {ApiCallerEventType} from '@nu-art/thunderstorm/frontend/core/db-api-gen/types';


type State = State_EditorBase<DB_PermissionGroup> & {
	newLevelDomainId?: UniqueId;
};

export class PermissionGroupsEditor
	extends EditorBase<DB_PermissionGroup, State, { projectId?: string }>
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
	__onPermissionsGroupsUpdated(...params: ApiCallerEventType<DB_PermissionGroup>) {
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
		state.items = ModuleFE_PermissionsGroup.cache.filter(group => !exists(this.props.projectId) || group.projectId === this.props.projectId);

		if (!state.editedItem && state.items.length > 0) {
			state.editedItem = new EditableDBItem(state.items[0], ModuleFE_PermissionsGroup);
			state.selectedItemId = state.items[0]._id;
		}
		return state;
	}

	//######################### Render #########################

	private renderLevels = () => {
		const group = this.state.editedItem;
		if (!group)
			return '';

		return <MultiSelect.AccessLevel
			editable={group}
			prop={'accessLevelIds'}
			className={'api-editor__editor__level-list'}
			itemRenderer={(levelId, onDelete) => {
				const level = ModuleFE_PermissionsAccessLevel.cache.unique(levelId)!;
				const domain = ModuleFE_PermissionsDomain.cache.unique(level.domainId)!;
				return <div key={levelId} className={'api-editor__editor__level-list__item'}>
					<TS_Icons.x.component onClick={onDelete}/>
					{`${domain.namespace}: ${level.name} (${level.value})`}
				</div>;
			}}/>;
	};

	editorContent = () => {
		const group = this.state.editedItem!;
		return <>
			<TS_PropRenderer.Vertical label={'Label'}>
				<TS_Input type={'text'} value={group.item.label} onChange={value => this.setProperty('label', value)}/>
			</TS_PropRenderer.Vertical>
			{this.renderLevels()}
		</>;
	};
}