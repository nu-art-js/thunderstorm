import * as React from 'react';
import {ModuleFE_Account} from '@nu-art/user-account-frontend/index';
import {ModuleFE_PermissionUser} from '../../_entity.js';
import {Page_ItemsEditor} from '@nu-art/thunderstorm-frontend/components/Page_ItemsEditor/index';
import {InferProps, TS_PropRenderer, TS_Route} from '@nu-art/thunderstorm-frontend/index';
import {MultiSelect} from '../ui-props.js';
import {Component_BasePermissionItemEditor} from './editor-base.js';
import {EditableRef, Props_EditableItemControllerProto, TS_EditableItemControllerProto} from '@nu-art/thunderstorm-frontend/editable-item';
import {sortArray} from '@nu-art/ts-common';
import {DB_PermissionUser, DatabaseDef_PermissionUser} from '@nu-art/permissions-shared';


class Component_EditAccount
	extends Component_BasePermissionItemEditor<DatabaseDef_PermissionUser> {

	static defaultProps = {
		module: ModuleFE_PermissionUser,
		displayResolver: (item: DB_PermissionUser) => ModuleFE_Account.cache.unique(item._id)?.email ?? 'Not Found'
	};

	editorContent = () => {
		return <TS_PropRenderer.Vertical label={'Groups'}>
			<MultiSelect.Group
				className={'user-permission-groups'}
				editable={this.state.editable!}
				prop={'groups'}
			/>
		</TS_PropRenderer.Vertical>;
	};
}

class Controller_EditAccount
	extends TS_EditableItemControllerProto<DatabaseDef_PermissionUser> {
	static defaultProps: Partial<Props_EditableItemControllerProto<DatabaseDef_PermissionUser>> = {
		keys: ['selected'],
		module: ModuleFE_PermissionUser,
		editor: Component_EditAccount as React.ComponentType<EditableRef<DatabaseDef_PermissionUser['uiType']>>,
		createInitialInstance: () => ({}),
		autoSave: true
	};
}

export class PermissionUsersEditor
	extends Page_ItemsEditor<DatabaseDef_PermissionUser> {

	//######################### Static #########################

	static Route: TS_Route = {
		key: 'user-permission-editor',
		path: 'user-permission-editor',
		Component: this
	};

	protected renderHeader(): React.ReactNode {
		return <>User Permissions</>;
	}

	static defaultProps: Partial<InferProps<PermissionUsersEditor>> = {
		keys: ['selected'],
		module: ModuleFE_PermissionUser,
		mapper: (user) => [ModuleFE_Account.cache.unique(user._id)?.email ?? 'Not Found'],
		sort: (items) => sortArray(items, (user) => ModuleFE_Account.cache.unique(user._id)?.email),
		itemRenderer: (user) => <>{ModuleFE_Account.cache.unique(user._id)?.email ?? 'Not Found'}</>,
		EditorRenderer: Controller_EditAccount as React.ComponentType<Partial<Props_EditableItemControllerProto<DatabaseDef_PermissionUser>>>,
		hideAddItem: true,
		route: this.Route
	};
}