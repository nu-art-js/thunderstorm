import * as React from 'react';
import {ModuleFE_PermissionAccessLevel, ModuleFE_PermissionAPI, ModuleFE_PermissionDomain} from '../../../_entity.js';
import {Component_BasePermissionItemEditor} from '../editor-base.js';
import {sortArray, UniqueId} from '@nu-art/ts-common';
import {InferProps, InferState, TS_PropRenderer} from '@nu-art/thunder-widgets';
import {TS_Route} from '@nu-art/thunder-routing';
import {MultiSelect} from '../../ui-props.js';
import {TS_Icons} from '@nu-art/ts-styles';
import './permission-api-editor.scss';
import {TS_EditableItemController} from '@nu-art/editable-item';
import {DatabaseDef_PermissionAPI, DatabaseDef_PermissionAccessLevel, DB_PermissionAPI} from '@nu-art/permissions-shared';
import {Page_ItemsEditor} from '@nu-art/db-item-editor';


type Props = {
	projectId: UniqueId;
};

class Component_APIEditor
	extends Component_BasePermissionItemEditor<DatabaseDef_PermissionAPI> {
	static defaultProps = {
		module: ModuleFE_PermissionAPI,
		displayResolver: (item: DB_PermissionAPI) => item.path
	};

	editorContent = () => {
		const api = this.state.editable;
		if (!api)
			return;

		return <>
			<TS_PropRenderer.Vertical label={'Path'}>
				<div>{api.item.path}</div>
			</TS_PropRenderer.Vertical>
			<TS_PropRenderer.Vertical label={'Access Levels'}>
				<MultiSelect.AccessLevel
					editable={api}
					prop={'accessLevelIds'}
					className={'domain-level-list'}
					itemRenderer={(levelId: DatabaseDef_PermissionAccessLevel['id'], onDelete: () => void) => {
						const level = ModuleFE_PermissionAccessLevel.cache.unique(levelId)!;
						const domain = ModuleFE_PermissionDomain.cache.unique(level.domainId)!;
						return <div key={levelId} className={'domain-level-list__item'}>
							<TS_Icons.x.component onClick={onDelete}/>
							{`${domain.namespace}: ${level.name} (${level.value})`}
						</div>;
					}}/>
			</TS_PropRenderer.Vertical>
		</>;
	};
}

class Controller_ApiEditor
	extends TS_EditableItemController<DatabaseDef_PermissionAPI> {

	static defaultProps = {
		module: ModuleFE_PermissionAPI,
		editor: Component_APIEditor,
		createInitialInstance: () => ({}),
		autoSave: true
	};
}

export class PermissionAPIEditor
	extends Page_ItemsEditor<DatabaseDef_PermissionAPI, Props> {

	//######################### Static #########################

	static Route: TS_Route = {
		key: 'api-permission-editor',
		path: 'api-permission-editor',
		Component: this,
	};

	static defaultProps: Partial<InferProps<PermissionAPIEditor>> = {
		module: ModuleFE_PermissionAPI,
		mapper: api => [api.path],
		sort: (items) => sortArray(items, 'path'),
		id: 'api-permission-editor',
		itemRenderer: api => <>{api.path}</>,
		EditorRenderer: (props) => <Controller_ApiEditor {...props}/>,
		hideAddItem: true,
		route: PermissionAPIEditor.Route,
	};

	//######################### Lifecycle #########################

	protected deriveStateFromProps(nextProps: InferProps<this>, state: InferState<this>): InferState<this> {
		state = super.deriveStateFromProps(nextProps, state);
		state.filter = item => item.projectId === nextProps.projectId;
		return state;
	}

	protected renderHeader(): React.ReactNode {
		return <>Permission APIs</>;
	}

}
