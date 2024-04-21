import * as React from 'react';
import {ModuleFE_Account} from '@nu-art/user-account/frontend';
import {DB_PermissionUser, DBProto_PermissionUser, ModuleFE_PermissionUser} from '../../_entity';
import {Page_ItemsEditorV3} from '@nu-art/thunderstorm/frontend/components/Page_ItemsEditorV3';
import {EditableRef, TS_PropRenderer, TS_Route} from '@nu-art/thunderstorm/frontend';
import {MultiSelect} from '../ui-props';
import {Component_BasePermissionItemEditor} from './editor-base';
import {InferProps} from '@nu-art/thunderstorm/frontend/utils/types';
import {
	Props_EditableItemControllerProto,
	TS_EditableItemControllerProto
} from '@nu-art/thunderstorm/frontend/components/TS_EditableItemControllerProto';


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

class Controller_EditAccount
	extends TS_EditableItemControllerProto<DBProto_PermissionUser> {
	static defaultProps: Partial<Props_EditableItemControllerProto<DBProto_PermissionUser>> = {
		keys: ['selected'],
		module: ModuleFE_PermissionUser,
		editor: Component_EditAccount as React.ComponentType<EditableRef<DBProto_PermissionUser['uiType']>>,
		createInitialInstance: () => ({}),
		autoSave: true
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

	protected renderHeader(): React.ReactNode {
		return <>User Permissions</>;
	}

	static defaultProps: Partial<InferProps<PermissionUsersEditor>> = {
		keys: ['selected'],
		module: ModuleFE_PermissionUser,
		mapper: (user) => [ModuleFE_Account.cache.unique(user._id)?.email ?? 'Not Found'],
		sort: (user) => ModuleFE_Account.cache.unique(user._id)?.email ?? 'Not Found',
		itemRenderer: (user) => <>{ModuleFE_Account.cache.unique(user._id)?.email ?? 'Not Found'}</>,
		EditorRenderer: Controller_EditAccount as React.ComponentType<Partial<Props_EditableItemControllerProto<DBProto_PermissionUser>>>,
		hideAddItem: true,
		route: this.Route
	};
}