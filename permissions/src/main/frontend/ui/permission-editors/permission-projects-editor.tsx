import * as React from 'react';
import {
	_className,
	EditableDBItemV3,
	EventType_Create,
	EventType_Delete,
	EventType_Update,
	LL_H_C,
	LL_V_L,
	TS_Button,
	TS_Input,
	TS_PropRenderer
} from '@nu-art/thunderstorm/frontend';
import {ModuleFE_PermissionsAssert} from '../../modules/ModuleFE_PermissionsAssert';
import {Filter, sortArray, UniqueId} from '@nu-art/ts-common';
import {TS_Icons} from '@nu-art/ts-styles';
import {MultiSelect} from '../ui-props';
import {ApiCallerEventType} from '@nu-art/thunderstorm/frontend/core/db-api-gen/types';
import {ModuleFE_SyncManagerV2} from '@nu-art/thunderstorm/frontend/modules/sync-manager/ModuleFE_SyncManagerV2';
import {
	DB_PermissionAPI,
	DB_PermissionProject,
	DBProto_PermissionProject,
	DispatcherType_PermissionProject,
	ModuleFE_PermissionAccessLevel,
	ModuleFE_PermissionAPI,
	ModuleFE_PermissionDomain,
	ModuleFE_PermissionProject
} from '../../_entity';
import {DispatcherInterface} from '@nu-art/thunderstorm/frontend/core/db-api-gen/v3_types';
import {EditorBaseV3, State_EditorBaseV3} from './editor-base-v3';


type State = State_EditorBaseV3<DBProto_PermissionProject> & {
	apis?: DB_PermissionAPI[];
	selectedApiId?: UniqueId;
	searchValue?: string;
};

export class PermissionProjectsEditor
	extends EditorBaseV3<DBProto_PermissionProject, State>
	implements DispatcherInterface<DispatcherType_PermissionProject> {

	//######################### Static #########################

	static defaultProps = {
		modules: [ModuleFE_PermissionProject]
	};

	readonly module = ModuleFE_PermissionProject;
	readonly itemName = 'Permission Project';
	readonly itemNamePlural = 'Permission Projects';
	readonly itemDisplay = (item: DB_PermissionProject) => item.name;

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

	protected deriveStateFromProps(nextProps: {}, state: State) {
		state.items = ModuleFE_PermissionProject.cache.all();
		if (!state.editedItem && state.items.length) {
			state.editedItem = new EditableDBItemV3(state.items[0], ModuleFE_PermissionProject);
			state.selectedItemId = state.items[0]._id;
		}
		state.apis = state.editedItem ? ModuleFE_PermissionAPI.cache.filter(i => i.projectId === state.editedItem?.item._id) : undefined;
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

		const filter = new Filter<DB_PermissionAPI>(i => [i.path]);
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

		const api = new EditableDBItemV3(_api, ModuleFE_PermissionAPI).setAutoSave(true);

		return <LL_V_L className={'api-editor__editor'}>
			<TS_PropRenderer.Vertical label={'Path'}>
				<div>{api.item.path}</div>
			</TS_PropRenderer.Vertical>
			<MultiSelect.AccessLevel
				editable={api}
				prop={'accessLevelIds'}
				className={'api-editor__editor__level-list'}
				itemRenderer={(levelId, onDelete) => {
					const level = ModuleFE_PermissionAccessLevel.cache.unique(levelId)!;
					const domain = ModuleFE_PermissionDomain.cache.unique(level.domainId)!;
					return <div key={levelId} className={'api-editor__editor__level-list__item'}>
						<TS_Icons.x.component onClick={onDelete}/>
						{`${domain.namespace}: ${level.name} (${level.value})`}
					</div>;
				}}/>
		</LL_V_L>;
	};
}