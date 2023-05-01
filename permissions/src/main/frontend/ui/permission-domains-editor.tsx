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
import {DB_PermissionDomain, DB_PermissionProject} from '../shared';
import {EditorBase, State_EditorBase} from './editor-base';
import {ModuleFE_PermissionsDomain, ModuleFE_PermissionsProject, OnPermissionsDomainsUpdated} from '../core/module-pack';

type State = State_EditorBase<DB_PermissionDomain> & {
	projects: Readonly<DB_PermissionProject[]>
};

export class PermissionDomainsEditor
	extends EditorBase<DB_PermissionDomain, State>
	implements OnPermissionsDomainsUpdated {

	//######################### Static #########################

	readonly module = ModuleFE_PermissionsDomain;
	readonly itemName = 'Permission Domain';
	readonly itemNamePlural = 'Permission Domains';
	readonly itemDisplay = (item: DB_PermissionDomain) => item.namespace;
	static defaultProps = {
		modules: [ModuleFE_PermissionsDomain]
	};

	//######################### Life Cycle #########################

	__onPermissionsDomainsUpdated(...params: ApiCallerEventTypeV2<DB_PermissionDomain>) {
		if ([EventType_Update, EventType_Create].includes(params[0])) {
			const domain = params[1] as DB_PermissionDomain;
			this.reDeriveState({
				selectedItemId: domain._id,
				editedItem: new EditableDBItem<DB_PermissionDomain>(domain, ModuleFE_PermissionsDomain)
			});
		}
		if (params[0] === EventType_Delete)
			this.reDeriveState({selectedItemId: undefined, editedItem: undefined});
	}

	protected async deriveStateFromProps(nextProps: Props_SmartComponent, state: (State & State_SmartComponent)) {
		state.items = ModuleFE_PermissionsDomain.cache.all();
		state.projects = ModuleFE_PermissionsProject.cache.all();
		return state;
	}

	//######################### Render #########################

	private renderProjectsDropDown = () => {
		if (!this.state.editedItem)
			return '';

		const domain = this.state.editedItem;
		const adapter = SimpleListAdapter(this.state.projects as DB_PermissionProject[], item => <div>{item.item.name}</div>);
		const selected = domain.item.projectId ? this.state.projects.find(item => item._id === domain.item.projectId) : undefined;
		return <TS_PropRenderer.Vertical label={'Project'}>
			<TS_DropDown<DB_PermissionProject>
				adapter={adapter}
				selected={selected}
				onSelected={item => this.setProperty('projectId', item._id)}
			/>
		</TS_PropRenderer.Vertical>;
	};

	editorContent = () => {
		const domain = this.state.editedItem!;
		return <>
			{this.renderProjectsDropDown()}
			<TS_PropRenderer.Vertical label={'Namespace'}>
				<TS_Input type={'text'} value={domain.item.namespace} onChange={value => this.setProperty('namespace', value)}/>
			</TS_PropRenderer.Vertical>
		</>;
	};
}