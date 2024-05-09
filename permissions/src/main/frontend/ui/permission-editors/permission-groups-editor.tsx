import * as React from 'react';
import {ModuleFE_Toaster, TS_ErrorBoundary, TS_PropRenderer, TS_Route} from '@nu-art/thunderstorm/frontend';
import {MUSTNeverHappenException, StaticLogger} from '@nu-art/ts-common';
import {MultiSelect} from '../ui-props';
import {TS_Icons} from '@nu-art/ts-styles';
import {
	DB_PermissionGroup,
	DBProto_PermissionGroup,
	ModuleFE_PermissionAccessLevel,
	ModuleFE_PermissionDomain,
	ModuleFE_PermissionGroup
} from '../../_entity';
import {Component_BasePermissionItemEditor} from './editor-base';
import {Input_Text_Blur} from './components';
import {DropDown_PermissionProject} from '../../../_entity/permission-project/frontend/ui-components';
import {Page_ItemsEditor} from '@nu-art/thunderstorm/frontend/components/Page_ItemsEditor';
import {InferProps} from '@nu-art/thunderstorm/frontend/utils/types';
import {
	Props_EditableItemControllerProto,
	TS_EditableItemControllerProto
} from '@nu-art/thunderstorm/frontend/components/TS_EditableItemControllerProto';

class Component_EditGroup
	extends Component_BasePermissionItemEditor<DBProto_PermissionGroup> {
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
					itemRenderer={(levelId, onDelete) => {
						const level = ModuleFE_PermissionAccessLevel.cache.unique(levelId);
						if (!level)
							throw new MUSTNeverHappenException(`Could not find access level with id ${levelId}`);
						const domain = ModuleFE_PermissionDomain.cache.unique(level.domainId);
						if (!domain)
							throw new MUSTNeverHappenException(`Could not find domain with id ${level.domainId}`);

						return <div key={levelId} className={'domain-level-list__item'}>
							<TS_Icons.x.component onClick={onDelete}/>
							{`${domain.namespace}: ${level.name} (${level.value})`}
						</div>;
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
	extends TS_EditableItemControllerProto<DBProto_PermissionGroup> {
	static defaultProps = {
		keys: ['selected'],
		module: ModuleFE_PermissionGroup,
		editor: Component_EditGroup,
		createInitialInstance: () => ({}),
		autoSave: true
	};
}

export class PermissionGroupsEditor
	extends Page_ItemsEditor<DBProto_PermissionGroup> {

	//######################### Static #########################

	static Route: TS_Route = {
		key: 'group-permission-editor',
		path: 'group-permission-editor',
		Component: this
	};

	static defaultProps: Partial<InferProps<PermissionGroupsEditor>> = {
		keys: ['selected'],
		module: ModuleFE_PermissionGroup,
		mapper: group => [group.label ?? 'Not Found'],
		sort: group => group.label ?? 'Not Found',
		itemRenderer: group => <>{group.label ?? 'Not Found'}</>,
		EditorRenderer: Controller_EditGroup as React.ComponentType<Partial<Props_EditableItemControllerProto<DBProto_PermissionGroup>>>,
		route: this.Route,
		contextMenuActions: [
			{
				label: 'Delete Group',
				action: async (item) => {
					try {
						await ModuleFE_PermissionGroup.v1.delete(item as unknown as DB_PermissionGroup).executeSync();
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
