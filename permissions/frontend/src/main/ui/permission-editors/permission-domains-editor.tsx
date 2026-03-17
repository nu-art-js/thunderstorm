import * as React from 'react';
import {EditableDBItem, Props_EditableItemController, TS_EditableItemController} from '@nu-art/editable-item';
import {Button, InferProps, ModuleFE_Toaster, TS_PropRenderer, TS_Table} from '@nu-art/thunder-widgets';
import {TS_Route} from '@nu-art/thunder-routing';
import {BadImplementationException, capitalizeFirstLetter, exists, PreDB, sortArray, StaticLogger} from '@nu-art/ts-common';
import {TS_Icons} from '@nu-art/ts-styles';
import {ModuleFE_PermissionAccessLevel, ModuleFE_PermissionDomain, ModuleFE_PermissionProject} from '../../_entity.js';
import {Component_BasePermissionItemEditor} from './editor-base.js';
import {DropDownCaret, Input_Number_Blur, Input_Text_Blur} from './components.js';
import {DropDown_PermissionProject} from '../../_entity/permission-project/ui-components.js';
import {Page_ItemsEditor, State_ItemsEditor} from '@nu-art/db-item-editor';
import {DB_PermissionAccessLevel, DB_PermissionDomain, DatabaseDef_PermissionAccessLevel, DatabaseDef_PermissionDomain} from '@nu-art/permissions-shared';


class Component_EditDomain
	extends Component_BasePermissionItemEditor<DatabaseDef_PermissionDomain> {
	static defaultProps = {
		module: ModuleFE_PermissionDomain,
		displayResolver: (item: DB_PermissionDomain) => `${ModuleFE_PermissionProject.cache.unique(item.projectId)!.name}/${item.namespace}`
	};


	//######################### logic #########################

	private deleteLevel = async (editable: EditableDBItem<DatabaseDef_PermissionAccessLevel>) => {
		try {
			await editable.delete();
			this.forceUpdate();
		} catch (err: any) {
			this.logError({...err});
			ModuleFE_Toaster.toastError(err.errorResponse.debugMessage.split('\n')[0]);
		}
	};

	private updateLevel = async <K extends keyof DatabaseDef_PermissionAccessLevel['dbType']>(editable: EditableDBItem<DatabaseDef_PermissionAccessLevel>, prop: K, value: DatabaseDef_PermissionAccessLevel['dbType'][K]) => {
		if (editable.item._id) {
			try {
				await editable.updateObj({[prop]: value});
				return this.forceUpdate();
			} catch (err: any) {
				return this.logError(err);
			}
		}

		editable.set(prop, value);
		editable.validate();
		if (editable.hasValidationError())
			return;

		await editable.save();
		this.forceUpdate();
	};

	private getEmptyLevel(): PreDB<DB_PermissionAccessLevel> {
		return {
			domainId: this.state.editable?.item._id,
		} as PreDB<DB_PermissionAccessLevel>;
	}

	//######################### Render #########################

	editorContent = () => {
		const editable = this.state.editable!;
		return <>
			<TS_PropRenderer.Vertical label={'Project'}>
				<DropDown_PermissionProject.editable
					editable={editable}
					prop={'projectId'}
					caret={DropDownCaret}
					disabled={!!editable.item._id}
				/>
			</TS_PropRenderer.Vertical>
			<TS_PropRenderer.Vertical label={'Namespace'}>
				<Input_Text_Blur
					editable={editable}
					prop={'namespace'}
				/>
			</TS_PropRenderer.Vertical>
			<TS_PropRenderer.Vertical label={'Levels'}>
				{this.renderLevelsTable()}
			</TS_PropRenderer.Vertical>
		</>;
	};

	//######################### Render - levels #########################

	private renderLevelsTable = () => {
		const domain = this.state.editable;
		if (!domain)
			return '';

		let levels = ModuleFE_PermissionAccessLevel.cache.filter(level => level.domainId === domain.item._id) as PreDB<DB_PermissionAccessLevel>[];
		levels = sortArray(levels, i => i.value);
		levels.push(this.getEmptyLevel());
		return <TS_Table<PreDB<DB_PermissionAccessLevel>, 'action'>
			header={['name', 'value', {widthPx: 50, header: 'action'}]}
			headerRenderer={header => header === 'action' ? '' : capitalizeFirstLetter(header)}
			rows={levels}
			cellRenderer={this.levelsCellRenderer}
		/>;
	};

	private levelsCellRenderer = (prop: string, item: PreDB<DB_PermissionAccessLevel>, index: number) => {
		const editable = new EditableDBItem(item, ModuleFE_PermissionAccessLevel)
			.setAutoSave(true)
			.setDebounceTimeout(0);
		switch (prop) {
			case 'name':
				return this.renderLevelName(editable);

			case 'value':
				return this.renderLevelValue(editable);

			case 'action':
				return this.renderLevelAction(editable);
			default:
				throw new BadImplementationException(`No renderer defined for key ${prop}`);
		}
	};

	private renderLevelName = (editable: EditableDBItem<DatabaseDef_PermissionAccessLevel>) => {
		return <Input_Text_Blur
			editable={editable}
			prop={'name'}
			value={editable.item.name}
			placeholder={'Enter level name'}
			onChange={value => this.updateLevel(editable, 'name', value)}
		/>;
	};

	private renderLevelValue = (editable: EditableDBItem<DatabaseDef_PermissionAccessLevel>) => {
		return <Input_Number_Blur
			// @ts-ignore
			editable={editable}
			prop={'value'}
			value={exists(editable.item.value) ? String(editable.item.value) : undefined}
			placeholder={'Enter level value'}
			onChange={value => this.updateLevel(editable, 'value', Number(value))}
		/>;
	};

	private renderLevelAction = (editable: EditableDBItem<DatabaseDef_PermissionAccessLevel>) => {
		if (!editable.item._id)
			return;

		return <Button
			variant={'dangerous'}
			onClick={async () => await this.deleteLevel(editable)}
			className={'action-button delete'}
		>
			<TS_Icons.bin.component/>
		</Button>;
	};
}

class Controller_DomainsEditor
	extends TS_EditableItemController<DatabaseDef_PermissionDomain> {
	static defaultProps = {
		module: ModuleFE_PermissionDomain,
		editor: Component_EditDomain,
		createInitialInstance: () => ({}),
		autoSave: true
	};
}

export class PermissionDomainsEditor
	extends Page_ItemsEditor<DatabaseDef_PermissionDomain> {

	//######################### Static #########################

	static Route: TS_Route = {
		key: 'domain-permission-editor',
		path: 'domain-permission-editor',
		Component: this
	};

	static defaultProps: Partial<InferProps<PermissionDomainsEditor>> = {
		module: ModuleFE_PermissionDomain,
		mapper: domain => [`${ModuleFE_PermissionProject.cache.unique(domain.projectId)!.name}/${domain.namespace}`],
		sort: (items) => sortArray(items, domain => `${ModuleFE_PermissionProject.cache.unique(domain.projectId)!.name}/${domain.namespace}`),
		itemRenderer: domain => <>{`${ModuleFE_PermissionProject.cache.unique(domain.projectId)!.name}/${domain.namespace}`}</>,
		EditorRenderer: Controller_DomainsEditor as React.ComponentType<Partial<Props_EditableItemController<DatabaseDef_PermissionDomain>>>,
		route: PermissionDomainsEditor.Route,
		contextMenuActions: [
			{
				label: 'Delete Domain',
				action: async (state: State_ItemsEditor<DatabaseDef_PermissionDomain>) => {
					try {
						await ModuleFE_PermissionDomain.deleteUnique({_id: state.editable.item._id!});
						return true;
					} catch (err: any) {
						StaticLogger.logError(err);
						ModuleFE_Toaster.toastError(err.errorResponse.debugMessage.split('\n')[0]);
					}
				}
			}
		]
	};


	//######################### Logic #########################

	protected renderHeader(): React.ReactNode {
		return <>Permission Domain</>;
	}

}
