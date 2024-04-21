import * as React from 'react';
import {EditableRef, TS_PropRenderer, TS_Route} from '@nu-art/thunderstorm/frontend';
import {DB_PermissionProject, DBProto_PermissionProject, ModuleFE_PermissionProject} from '../../../_entity';
import {Component_BasePermissionItemEditor} from '../editor-base';
import {Input_Text_Blur} from '../components';
import {PermissionAPIEditor} from '../permission-api-edior/permission-api-editor';
import {Page_ItemsEditorV3} from '@nu-art/thunderstorm/frontend/components/Page_ItemsEditorV3';
import {InferProps} from '@nu-art/thunderstorm/frontend/utils/types';
import './permission-project-editor.scss';

class Component_EditProject
	extends Component_BasePermissionItemEditor<DBProto_PermissionProject> {

	static defaultProps = {
		module: ModuleFE_PermissionProject,
		displayResolver: (item: DB_PermissionProject) => ModuleFE_PermissionProject.cache.unique(item._id)?.name ?? 'Not Found'
	};

	editorContent = () => {
		const project = this.state.editable!;
		return <>
			<TS_PropRenderer.Vertical label={'Name'} style={{flex: 0}}>
				<Input_Text_Blur
					editable={project}
					prop={'name'}
				/>
			</TS_PropRenderer.Vertical>
			{project.item._id && <PermissionAPIEditor projectId={project.item._id}/>}
		</>;
	};

}

export class PermissionProjectsEditor
	extends Page_ItemsEditorV3<DBProto_PermissionProject> {

	//######################### Static #########################

	static Route: TS_Route = {
		key: 'project-permission-editor',
		path: 'project-permission-editor',
		Component: this,
		children: [PermissionAPIEditor.Route]
	};

	static defaultProps: Partial<InferProps<PermissionProjectsEditor>> = {
		keys: ['selected'],
		id: 'permission-projects-editor',
		module: ModuleFE_PermissionProject,
		mapper: project => [project.name ?? 'Not Found'],
		sort: project => project.name ?? 'Not Found',
		itemRenderer: project => <>{project.name ?? 'Not Found'}</>,
		EditorRenderer: Component_EditProject as React.ComponentType<EditableRef<DBProto_PermissionProject['uiType']>>,
		hideAddItem: true,
		route: this.Route
	};


	protected renderHeader(): React.ReactNode {
		return <>Permission Project</>;
	}
}