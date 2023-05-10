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
import {TS_Input, TS_PropRenderer} from '@nu-art/thunderstorm/frontend';
import {EditorBase, State_EditorBase} from './editor-base';
import {DB_PermissionProject} from '../shared';
import {ModuleFE_PermissionsProject, OnPermissionsProjectsUpdated} from '../core/module-pack';

type State = State_EditorBase<DB_PermissionProject>;

export class PermissionProjectsEditor
	extends EditorBase<DB_PermissionProject, State>
	implements OnPermissionsProjectsUpdated {


	//######################### Static #########################

	static defaultProps = {
		modules: [ModuleFE_PermissionsProject]
	};

	readonly module = ModuleFE_PermissionsProject;
	readonly itemName = 'Permission Project';
	readonly itemNamePlural = 'Permission Projects';
	readonly itemDisplay = (item: DB_PermissionProject) => item.name;

	//######################### Life Cycle #########################

	__OnPermissionsProjectsUpdated(...params: ApiCallerEventTypeV2<DB_PermissionProject>) {
		if ([EventType_Update, EventType_Create].includes(params[0])) {
			const project = params[1] as DB_PermissionProject;
			this.reDeriveState({
				selectedItemId: project._id,
				editedItem: new EditableDBItem<DB_PermissionProject>(project, ModuleFE_PermissionsProject)
			});
		}
		if (params[0] === EventType_Delete)
			this.reDeriveState({selectedItemId: undefined, editedItem: undefined});
	}

	protected async deriveStateFromProps(nextProps: Props_SmartComponent, state: (State & State_SmartComponent)) {
		state.items = ModuleFE_PermissionsProject.cache.all();
		if (!state.editedItem && state.items.length) {
			state.editedItem = new EditableDBItem(state.items[0], ModuleFE_PermissionsProject);
			state.selectedItemId = state.items[0]._id;
		}
		return state;
	}

	//######################### Render #########################

	editorContent = () => {
		const project = this.state.editedItem!;
		return <TS_PropRenderer.Vertical label={'Name'}>
			<TS_Input
				type={'text'}
				value={project.item.name}
				onChange={value => this.setProperty('name', value)}/>
		</TS_PropRenderer.Vertical>;
	};
}