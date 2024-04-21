import * as React from 'react';
import {ModuleFE_Account} from '@nu-art/user-account/frontend';
import {DB_PermissionUser, DBProto_PermissionUser, ModuleFE_PermissionUser} from '../../_entity';
import {Page_ItemsEditorV3, Props_ItemsEditorV3} from '@nu-art/thunderstorm/frontend/components/Page_ItemsEditorV3';
import {EditableRef, TS_PropRenderer, TS_Route} from '@nu-art/thunderstorm/frontend';
import {MultiSelect} from '../ui-props';
import {Component_BasePermissionItemEditor} from './editor-base';


class Component_EditAccount
	extends Component_BasePermissionItemEditor<DBProto_PermissionUser> {

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

export class PermissionUsersEditor
	extends Page_ItemsEditorV3<DBProto_PermissionUser> {

	//######################### Static #########################

	static Route: TS_Route = {
		key: 'user-permission-editor',
		path: 'user-permission-editor',
		Component: this
	};

	static defaultProps: Partial<Props_ItemsEditorV3<DBProto_PermissionUser>> = {
		module: ModuleFE_PermissionUser,
		mapper: (user) => [ModuleFE_Account.cache.unique(user._id)?.email ?? 'Not Found'],
		sort: (user) => ModuleFE_Account.cache.unique(user._id)?.email ?? 'Not Found',
		itemRenderer: (user) => <>{ModuleFE_Account.cache.unique(user._id)?.email ?? 'Not Found'}</>,
		EditorRenderer: Component_EditAccount as React.ComponentType<EditableRef<DBProto_PermissionUser['uiType']>>,
		route: this.Route
	};
}