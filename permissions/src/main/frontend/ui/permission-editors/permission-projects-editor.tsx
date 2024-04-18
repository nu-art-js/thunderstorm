import * as React from 'react';
import {
	EditableDBItemV3,
	EventType_Create,
	EventType_Delete,
	EventType_Update,
	TS_Button,
	TS_PropRenderer, TS_Route
} from '@nu-art/thunderstorm/frontend';
import {ModuleFE_PermissionsAssert} from '../../modules/ModuleFE_PermissionsAssert';
import {UniqueId} from '@nu-art/ts-common';
import {ApiCallerEventType} from '@nu-art/thunderstorm/frontend/core/db-api-gen/types';
import {
	DB_PermissionAPI,
	DB_PermissionProject,
	DBProto_PermissionProject,
	DispatcherType_PermissionProject,
	ModuleFE_PermissionAPI,
	ModuleFE_PermissionProject
} from '../../_entity';
import {DispatcherInterface} from '@nu-art/thunderstorm/frontend/core/db-api-gen/v3_types';
import {EditorBase, Props_EditorBase, State_EditorBase} from './editor-base';
import {Input_Text_Blur} from './components';
import {PermissionAPIEditor} from './permission-api-editor';


type State = State_EditorBase<DBProto_PermissionProject> & {
	apis?: DB_PermissionAPI[];
	selectedApiId?: UniqueId;
	searchValue?: string;
};

export class PermissionProjectsEditor
	extends EditorBase<DBProto_PermissionProject, State>
	implements DispatcherInterface<DispatcherType_PermissionProject> {

	//######################### Static #########################

	static defaultProps = {
		module: ModuleFE_PermissionProject,
		itemName: 'Permission Project',
		itemNamePlural: 'Permission Projects',
		itemDisplay: (item: DB_PermissionProject) => item.name,
	};

	static Route: TS_Route = {
		key: 'project-permission-editor',
		path: 'project-permission-editor',
		Component: this
	};


	//######################### Life Cycle #########################

	__onPermissionProjectUpdated(...params: ApiCallerEventType<DB_PermissionProject>) {
		if ([EventType_Update, EventType_Create].includes(params[0])) {
			const project = params[1] as DB_PermissionProject;
			this.reDeriveState({
				selectedItemId: project._id,
				editedItem: new EditableDBItemV3(project, ModuleFE_PermissionProject),
				searchValue: undefined
			});
		}
		if (params[0] === EventType_Delete)
			this.reDeriveState({selectedItemId: undefined, editedItem: undefined, searchValue: undefined});
	}

	protected deriveStateFromProps(nextProps: Props_EditorBase<DBProto_PermissionProject>, state: State) {
		state = super.deriveStateFromProps(nextProps, state);
		state.apis = state.editedItem ? ModuleFE_PermissionAPI.cache.filter(i => i.projectId === state.editedItem?.item._id) : undefined;
		return state;
	}

	//######################### Render #########################

	editorContent = () => {
		const project = this.state.editedItem!;
		return <>
			<TS_PropRenderer.Vertical label={'Name'} style={{flex: 0}}>
				<Input_Text_Blur
					editable={project}
					prop={'name'}
				/>
			</TS_PropRenderer.Vertical>
			{project.item._id && <PermissionAPIEditor projectId={project.item._id}/>}
		</>;
	};

	protected renderListButton = () => {
		if (this.state.items.length)
			return <></>;

		return <TS_Button
			className={'item-list__add-button'}
			onClick={async () => {
				await ModuleFE_PermissionsAssert.v1.createProject({}).executeSync();
			}}>Create Project</TS_Button>;
	};
}