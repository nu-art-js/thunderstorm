import * as React from 'react';
import {
	_className,
	EditableDBItem,
	EventType_Create,
	EventType_Delete,
	EventType_Update,
	LL_H_C,
	LL_V_L,
	ModuleFE_BaseApi,
	Props_SmartComponent,
	State_SmartComponent,
	TS_Button,
	TS_Input,
	TS_PropRenderer
} from '@nu-art/thunderstorm/frontend';
import {EditorBase, State_EditorBase} from './editor-base';
import {DB_PermissionApi, DB_PermissionProject} from '../../shared';
import {
	ModuleFE_PermissionsAccessLevel,
	ModuleFE_PermissionsApi,
	ModuleFE_PermissionsDomain,
	ModuleFE_PermissionsProject,
	OnPermissionsApisLoaded,
	OnPermissionsProjectsUpdated
} from '../../core/module-pack';
import {ModuleFE_PermissionsAssert} from '../../modules/ModuleFE_PermissionsAssert';
import {Filter, sortArray, UniqueId} from '@nu-art/ts-common';
import {TS_Icons} from '@nu-art/ts-styles';
import {MultiSelect} from '../ui-props';
import {ApiCallerEventType} from '@nu-art/thunderstorm/frontend/core/db-api-gen/types';
import {ModuleFE_SyncManagerV2} from '@nu-art/thunderstorm/frontend/modules/sync-manager/ModuleFE_SyncManagerV2';


type State = State_EditorBase<DB_PermissionProject> & {
	apis?: DB_PermissionApi[];
	selectedApiId?: UniqueId;
	searchValue?: string;
};

export class PermissionProjectsEditor
	extends EditorBase<DB_PermissionProject, State>
	implements OnPermissionsProjectsUpdated, OnPermissionsApisLoaded {

	//######################### Static #########################

	static defaultProps = {
		modules: [ModuleFE_PermissionsProject]
	};

	readonly module = ModuleFE_PermissionsProject as ModuleFE_BaseApi<DB_PermissionProject, any>;
	readonly itemName = 'Permission Project';
	readonly itemNamePlural = 'Permission Projects';
	readonly itemDisplay = (item: DB_PermissionProject) => item.name;

	//######################### Life Cycle #########################

	__onPermissionsApisLoaded() {
		this.reDeriveState();
	}

	__OnPermissionsProjectsUpdated(...params: ApiCallerEventType<DB_PermissionProject>) {
		if ([EventType_Update, EventType_Create].includes(params[0])) {
			const project = params[1] as DB_PermissionProject;
			this.reDeriveState({
				selectedItemId: project._id,
				editedItem: new EditableDBItem(project, ModuleFE_PermissionsProject),
				searchValue: undefined
			});
		}
		if (params[0] === EventType_Delete)
			this.reDeriveState({selectedItemId: undefined, editedItem: undefined, searchValue: undefined});
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

		return <TS_Button
			className={'item-list__add-button'}
			onClick={async () => {
				await ModuleFE_PermissionsAssert.v1.createProject({}).executeSync();
				await ModuleFE_SyncManagerV2.sync();
			}}>Create Project</TS_Button>;
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

		const filter = new Filter<DB_PermissionApi>(i => [i.path]);
		const apis = sortArray(filter.filter(this.state.apis, this.state.searchValue ?? ''), i => i.path);

		return <LL_V_L className={'api-editor__list-wrapper'}>
			<LL_H_C className={'api-editor__search'}>
				<TS_Input
					type={'text'}
					value={this.state.searchValue}
					onChange={searchValue => this.setState({searchValue})}
				/>
				<TS_Icons.Search.component/>
			</LL_H_C>
			<LL_V_L className={'api-editor__list'}>
				{apis.map(api => {
					return <div
						key={api._id}
						onClick={() => this.setState({selectedApiId: api._id})}
						className={_className('api-editor__list__item', api._id === this.state.selectedApiId ? 'selected' : undefined)}
					>{api.path}</div>;
				})}
			</LL_V_L>
		</LL_V_L>;
	};

	private renderApiEditor = () => {
		const _api = this.state.apis?.find(i => i._id === this.state.selectedApiId);
		if (!_api)
			return '';

		const api = new EditableDBItem(_api, ModuleFE_PermissionsApi).setAutoSave(true);

		return <LL_V_L className={'api-editor__editor'}>
			<TS_PropRenderer.Vertical label={'Path'}>
				<div>{api.item.path}</div>
			</TS_PropRenderer.Vertical>
			<MultiSelect.AccessLevel
				editable={api}
				prop={'accessLevelIds'}
				className={'api-editor__editor__level-list'}
				itemRenderer={(levelId, onDelete) => {
					const level = ModuleFE_PermissionsAccessLevel.cache.unique(levelId)!;
					const domain = ModuleFE_PermissionsDomain.cache.unique(level.domainId)!;
					return <div key={levelId} className={'api-editor__editor__level-list__item'}>
						<TS_Icons.x.component onClick={onDelete}/>
						{`${domain.namespace}: ${level.name} (${level.value})`}
					</div>;
				}}/>
		</LL_V_L>;
	};
}