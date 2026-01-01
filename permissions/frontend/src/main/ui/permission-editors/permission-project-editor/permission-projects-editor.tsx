import * as React from 'react';
import { InferProps, TS_PropRenderer, TS_Route } from "@nu-art/thunder-routing";
import { ModuleFE_PermissionProject } from '../../../_entity.js';
import { Component_BasePermissionItemEditor } from '../editor-base.js';
import { Input_Text_Blur } from '../components.js';
import { PermissionAPIEditor } from '../permission-api-edior/permission-api-editor.js';
import { Page_ItemsEditor } from '@nu-art/thunderstorm-frontend/components/Page_ItemsEditor/index';
import './permission-project-editor.scss';
import { Props_EditableItemControllerProto, TS_EditableItemControllerProto } from '@nu-art/thunderstorm-frontend/components/TS_EditableItemControllerProto/index';
import { sortArray } from '@nu-art/ts-common';
import { DB_PermissionProject, DBProto_PermissionProject } from '@nu-art/permissions-shared';
class Component_EditProject extends Component_BasePermissionItemEditor<DBProto_PermissionProject> {
    static defaultProps = {
        module: ModuleFE_PermissionProject,
        displayResolver: (item: DB_PermissionProject) => ModuleFE_PermissionProject.cache.unique(item._id)?.name ?? 'Not Found'
    };
    editorContent = () => {
        const project = this.state.editable!;
        return <>
			<TS_PropRenderer.Vertical label={'Name'} style={{ flex: 0 }}>
				<Input_Text_Blur editable={project} prop={'name'}/>
			</TS_PropRenderer.Vertical>
			{project.item._id && <PermissionAPIEditor projectId={project.item._id}/>}
		</>;
    };
}
class Controller_ProjectEditor extends TS_EditableItemControllerProto<DBProto_PermissionProject> {
    static defaultProps = {
        keys: ['selected'],
        module: ModuleFE_PermissionProject,
        editor: Component_EditProject,
        createInitialInstance: () => ({}),
        autoSave: true
    };
}
export class PermissionProjectsEditor extends Page_ItemsEditor<DBProto_PermissionProject> {
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
        sort: (items) => sortArray(items, 'name'),
        itemRenderer: project => <>{project.name ?? 'Not Found'}</>,
        EditorRenderer: Controller_ProjectEditor as React.ComponentType<Partial<Props_EditableItemControllerProto<DBProto_PermissionProject>>>,
        hideAddItem: true,
        route: this.Route
    };
    protected renderHeader(): React.ReactNode {
        return <>Permission Project</>;
    }
}
