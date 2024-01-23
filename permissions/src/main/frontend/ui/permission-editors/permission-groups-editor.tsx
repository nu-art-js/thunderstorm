import * as React from 'react';
import {EditableDBItemV3, EventType_Create, EventType_Delete, EventType_Update, TS_Input, TS_PropRenderer} from '@nu-art/thunderstorm/frontend';
import {UniqueId} from '@nu-art/ts-common';
import {MultiSelect} from '../ui-props';
import {TS_Icons} from '@nu-art/ts-styles';
import {
	DB_PermissionGroup,
	DBProto_PermissionGroup,
	DispatcherType_PermissionGroup,
	ModuleFE_PermissionAccessLevel,
	ModuleFE_PermissionDomain,
	ModuleFE_PermissionGroup,
	ModuleFE_PermissionProject
} from '../../_entity';
import {EditorBase, State_EditorBase} from './editor-base';
import {ApiCallerEventTypeV3, DispatcherInterface} from '@nu-art/thunderstorm/frontend/core/db-api-gen/v3_types';

type State = State_EditorBase<DBProto_PermissionGroup> & {
	newLevelDomainId?: UniqueId;
};

export class PermissionGroupsEditor
	extends EditorBase<DBProto_PermissionGroup, State>
	implements DispatcherInterface<DispatcherType_PermissionGroup> {

	//######################### Static #########################

	static defaultProps = {
		module: ModuleFE_PermissionGroup,
		itemName: 'Permission Group',
		itemNamePlural: 'Permission Groups',
		itemDisplay: (item: DB_PermissionGroup) => `${ModuleFE_PermissionProject.cache.unique(item.projectId)?.name || 'Global'}/${item.label}`,
	};

	//######################### Life Cycle #########################

	__onPermissionGroupUpdated(...params: ApiCallerEventTypeV3<DBProto_PermissionGroup>) {
		if ([EventType_Update, EventType_Create].includes(params[0])) {
			const group = params[1] as DB_PermissionGroup;
			this.reDeriveState({
				selectedItemId: group._id,
				editedItem: new EditableDBItemV3(group, ModuleFE_PermissionGroup)
			});
		}
		if (params[0] === EventType_Delete)
			this.reDeriveState({selectedItemId: undefined, editedItem: undefined});
	};

	//######################### Render #########################

	private renderLevels = () => {
		const group = this.state.editedItem;
		if (!group)
			return '';

		return <MultiSelect.AccessLevel
			editable={group}
			prop={'accessLevelIds'}
			className={'domain-level-list'}
			itemRenderer={(levelId, onDelete) => {
				const level = ModuleFE_PermissionAccessLevel.cache.unique(levelId)!;
				const domain = ModuleFE_PermissionDomain.cache.unique(level.domainId)!;
				return <div key={levelId} className={'domain-level-list__item'}>
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