import * as React from 'react';
import {DB_PermissionAPI, DBProto_PermissionAPI, ModuleFE_PermissionAccessLevel, ModuleFE_PermissionAPI, ModuleFE_PermissionDomain} from '../../../_entity';
import {Component_BasePermissionItemEditor} from '../editor-base';
import {UniqueId} from '@nu-art/ts-common';
import {TS_PropRenderer, TS_Route} from '@nu-art/thunderstorm/frontend';
import {MultiSelect} from '../../ui-props';
import {TS_Icons} from '@nu-art/ts-styles';
import {ProtoDef_Selection, Page_ItemsEditor} from '@nu-art/thunderstorm/frontend/components/Page_ItemsEditor';
import {InferProps, InferState} from '@nu-art/thunderstorm/frontend/utils/types';
import './permission-api-editor.scss';
import {TS_EditableItemControllerProto} from '@nu-art/thunderstorm/frontend/components/TS_EditableItemControllerProto';


type Props = {
	projectId: UniqueId;
};

class Component_APIEditor
	extends Component_BasePermissionItemEditor<DBProto_PermissionAPI> {
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
					itemRenderer={(levelId, onDelete) => {
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
	extends TS_EditableItemControllerProto<DBProto_PermissionAPI> {

	static defaultProps = {
		module: ModuleFE_PermissionAPI,
		editor: Component_APIEditor,
		keys: ['selected'],
		createInitialInstance: () => ({}),
		autoSave: true
	};
}

export class PermissionAPIEditor
	extends Page_ItemsEditor<DBProto_PermissionAPI, ProtoDef_Selection, Props> {

	//######################### Static #########################

	static Route: TS_Route = {
		key: 'api-permission-editor',
		path: 'api-permission-editor',
		Component: this,
	};

	static defaultProps: Partial<InferProps<PermissionAPIEditor>> = {
		keys: ['selected'],
		module: ModuleFE_PermissionAPI,
		mapper: api => [api.path],
		sort: api => api.path,
		id: 'api-permission-editor',
		itemRenderer: api => <>{api.path}</>,
		EditorRenderer: (props) => <Controller_ApiEditor {...props}/>,
		hideAddItem: true,
		route: this.Route,
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
