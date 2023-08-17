import * as React from 'react';
import {
	ApiCallerEventType,
	EditableDBItem,
	EventType_Create,
	EventType_Delete,
	EventType_Update,
	Props_SmartComponent,
	State_SmartComponent
} from '@nu-art/db-api-generator/frontend';
import {_className, LL_H_C, LL_V_L, SimpleListAdapter, TS_Button, TS_DropDown, TS_Input, TS_PropRenderer} from '@nu-art/thunderstorm/frontend';
import {EditorBase, State_EditorBase} from './editor-base';
import {DB_PermissionAccessLevel, DB_PermissionApi, DB_PermissionProject} from '../shared';
import {
	ModuleFE_PermissionsAccessLevel,
	ModuleFE_PermissionsApi,
	ModuleFE_PermissionsDomain,
	ModuleFE_PermissionsProject, OnPermissionsApisLoaded,
	OnPermissionsProjectsUpdated
} from '../core/module-pack';
import {ModuleFE_Permissions} from '../modules/ModuleFE_Permissions';
import {sortArray, UniqueId} from '@nu-art/ts-common';

type State = State_EditorBase<DB_PermissionProject> & {
	apis?: DB_PermissionApi[];
	selectedApiId?: UniqueId;
};

export class PermissionProjectsEditor
	extends EditorBase<DB_PermissionProject, State>
	implements OnPermissionsProjectsUpdated, OnPermissionsApisLoaded {


	//######################### Static #########################

	static defaultProps = {
		modules: [ModuleFE_PermissionsProject]
	};

	readonly module = ModuleFE_PermissionsProject;
	readonly itemName = 'Permission Project';
	readonly itemNamePlural = 'Permission Projects';
	readonly itemDisplay = (item: DB_PermissionProject) => item.name;

	//######################### Life Cycle #########################

	__onPermissionsApisLoaded() {
		this.forceUpdate();
	}

	__OnPermissionsProjectsUpdated(...params: ApiCallerEventType<DB_PermissionProject>) {
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
		state.apis = state.editedItem ? ModuleFE_PermissionsApi.cache.filter(i => i.projectId === state.editedItem?.item._id) : undefined;
		return state;
	}

	//######################### Render #########################

	editorContent = () => {
		const project = this.state.editedItem!;
		return <LL_V_L className={'match_parent'} style={{gap: '8px'}}>
			<TS_PropRenderer.Vertical label={'Name'} style={{flex: 0}}>
				<TS_Input
					type={'text'}
					value={project.item.name}
					onChange={value => this.setProperty('name', value)}/>
			</TS_PropRenderer.Vertical>
			{this.renderApis()}
		</LL_V_L>;
	};

	protected renderListButton = () => {
		if (this.state.items.length)
			return <></>;

		return <TS_Button className={'item-list__add-button'} onClick={() => ModuleFE_Permissions.v1.createProject({}).executeSync()}>Create Project</TS_Button>;
	};

	private renderApis = () => {
		if (!this.state.apis?.length)
			return '';

		return <TS_PropRenderer.Vertical label={'APIs'} style={{flexGrow: 1, height: 0}}>
			<LL_H_C className={'api-editor'}>
				{this.renderApiList()}
				{this.renderApiEditor()}
			</LL_H_C>
		</TS_PropRenderer.Vertical>;
	};

	private renderApiList = () => {
		if (!this.state.apis)
			return '';

		const apis = sortArray(this.state.apis, i => i.path);
		return <LL_V_L className={'api-editor__list'}>
			{apis.map(api => {
				return <div
					key={api._id}
					onClick={() => this.setState({selectedApiId: api._id})}
					className={_className('api-editor__list__item', api._id === this.state.selectedApiId ? 'selected' : undefined)}
				>{api.path}</div>;
			})}
		</LL_V_L>;
	};

	private renderApiEditor = () => {
		const _api = this.state.apis?.find(i => i._id === this.state.selectedApiId);
		if (!_api)
			return '';

		const api = new EditableDBItem(_api, ModuleFE_PermissionsApi);
		const levels = ModuleFE_PermissionsAccessLevel.cache.filter(i => !api.item.accessLevelIds?.includes(i._id));
		const adapter = SimpleListAdapter(levels as DB_PermissionAccessLevel[], i => {
			const domain = ModuleFE_PermissionsDomain.cache.unique(i.item.domainId)!;
			return <>{domain.namespace} : {i.item.name} ({i.item.value})</>;
		});

		return <LL_V_L className={'api-editor__editor'}>
			<TS_PropRenderer.Vertical label={'Path'}>
				<div>{api.item.path}</div>
			</TS_PropRenderer.Vertical>
			<TS_PropRenderer.Vertical label={'Access Levels'}>
				<LL_H_C className={'api-editor__editor__level-list'}>
					{api.item.accessLevelIds?.map(levelId => {
						const level = ModuleFE_PermissionsAccessLevel.cache.unique(levelId)!;
						const domain = ModuleFE_PermissionsDomain.cache.unique(level.domainId)!;
						return <div key={levelId} className={'api-editor__editor__level-list__item'}>{`${domain.namespace}: ${level.name} (${level.value})`}</div>;
					})}
					<TS_DropDown<DB_PermissionAccessLevel>
						adapter={adapter}
						onSelected={async i => {
							if (!api.item.accessLevelIds)
								api.set('accessLevelIds', []);
							api.item.accessLevelIds!.push(i._id);
							await api.save();
						}}
					/>
				</LL_H_C>
			</TS_PropRenderer.Vertical>
		</LL_V_L>;
	};
}