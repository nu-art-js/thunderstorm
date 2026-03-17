import * as React from 'react';
import {Fragment} from 'react';
import {InferProps, ModuleFE_Toaster, TS_ErrorBoundary, TS_PropRenderer} from '@nu-art/thunder-widgets';
import {TS_Route} from '@nu-art/thunder-routing';
import {MUSTNeverHappenException, sortArray, StaticLogger} from '@nu-art/ts-common';
import {MultiSelect} from '../ui-props.js';
import {TS_Icons} from '@nu-art/ts-styles';
import {ModuleFE_PermissionAccessLevel, ModuleFE_PermissionDomain, ModuleFE_PermissionGroup} from '../../_entity.js';
import {Component_BasePermissionItemEditor} from './editor-base.js';
import {Input_Text_Blur} from './components.js';
import {DropDown_PermissionProject} from '../../_entity/permission-project/ui-components.js';
import {Page_ItemsEditor, State_ItemsEditor} from '@nu-art/db-item-editor';
import {Props_EditableItemController, TS_EditableItemController} from '@nu-art/editable-item';
import {DB_PermissionGroup, DatabaseDef_PermissionGroup, DatabaseDef_PermissionAccessLevel} from '@nu-art/permissions-shared';

class Component_EditGroup
	extends Component_BasePermissionItemEditor<DatabaseDef_PermissionGroup> {
	static defaultProps = {
		module: ModuleFE_PermissionGroup,
		displayResolver: (item: DB_PermissionGroup) => ModuleFE_PermissionGroup.cache.unique(item._id)?.label ?? 'Not Found'
	};

	private renderLevels = () => {
		const group = this.state.editable;
		if (!group)
			return '';

		return <TS_ErrorBoundary>
			<TS_PropRenderer.Vertical label={'Levels'}>
				<MultiSelect.AccessLevel
					editable={group}
					prop={'accessLevelIds'}
					className={'domain-level-list'}
					itemRenderer={(levelId: DatabaseDef_PermissionAccessLevel['id'], onDelete: () => void) => {
						const level = ModuleFE_PermissionAccessLevel.cache.unique(levelId);
						if (!level)
							throw new MUSTNeverHappenException(`Could not find access level with id ${levelId}`);
						const domain = ModuleFE_PermissionDomain.cache.unique(level.domainId);
						if (!domain)
							throw new MUSTNeverHappenException(`Could not find domain with id ${level.domainId}`);

						return <Fragment key={levelId}>
							<TS_Icons.x.component onClick={onDelete}/>
							{`${domain.namespace}: ${level.name} (${level.value})`}
						</Fragment>;
					}}/>
			</TS_PropRenderer.Vertical>
		</TS_ErrorBoundary>;
	};

	editorContent = () => {
		const group = this.state.editable!;
		return <>
			<TS_PropRenderer.Vertical label={'Label'}>
				<Input_Text_Blur
					editable={group}
					prop={'label'}
				/>
			</TS_PropRenderer.Vertical>
			<TS_PropRenderer.Vertical label={'UI Label'}>
				<Input_Text_Blur
					editable={group}
					prop={'uiLabel'}
				/>
			</TS_PropRenderer.Vertical>
			<TS_PropRenderer.Vertical label={'Project'}>
				<DropDown_PermissionProject.editable
					editable={group}
					prop={'projectId'}
				/>
			</TS_PropRenderer.Vertical>
			{this.renderLevels()}
		</>;
	};
}

class Controller_EditGroup
	extends TS_EditableItemController<DatabaseDef_PermissionGroup> {
	static defaultProps = {
		module: ModuleFE_PermissionGroup,
		editor: Component_EditGroup,
		createInitialInstance: () => ({}),
		autoSave: true
	};
}

export class PermissionGroupsEditor
	extends Page_ItemsEditor<DatabaseDef_PermissionGroup> {

	//######################### Static #########################

	static Route: TS_Route = {
		key: 'group-permission-editor',
		path: 'group-permission-editor',
		Component: this
	};

	static defaultProps: Partial<InferProps<PermissionGroupsEditor>> = {
		module: ModuleFE_PermissionGroup,
		mapper: group => [group.label ?? 'Not Found'],
		sort: (items) => sortArray(items, 'label'),
		itemRenderer: group => <>{group.label ?? 'Not Found'}</>,
		EditorRenderer: Controller_EditGroup as React.ComponentType<Partial<Props_EditableItemController<DatabaseDef_PermissionGroup>>>,
		route: PermissionGroupsEditor.Route,
		contextMenuActions: [
			{
				label: 'Delete Group',
				action: async (state: State_ItemsEditor<DatabaseDef_PermissionGroup>) => {
					try {
						await ModuleFE_PermissionGroup.deleteUnique({_id: state.editable.item._id!});
						return true;
					} catch (err: any) {
						StaticLogger.logError({...err});
						ModuleFE_Toaster.toastError(err.errorResponse.debugMessage.split('\n')[0]);
					}
				}
			}
		]
	};

	protected renderHeader(): React.ReactNode {
		return <>Permission Group</>;
	}
}
