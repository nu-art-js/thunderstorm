import * as React from 'react';
import {
	EditableDBItemV3,
	ModuleFE_Toaster,
	TS_BusyButton,
	TS_PropRenderer,
	TS_Route,
	TS_Table
} from '@nu-art/thunderstorm/frontend';
import {
	BadImplementationException,
	capitalizeFirstLetter,
	exists,
	PreDB,
	sortArray,
	StaticLogger
} from '@nu-art/ts-common';
import {TS_Icons} from '@nu-art/ts-styles';
import {
	DB_PermissionAccessLevel,
	DB_PermissionDomain,
	DBProto_PermissionAccessLevel,
	DBProto_PermissionDomain,
	ModuleFE_PermissionAccessLevel,
	ModuleFE_PermissionDomain,
	ModuleFE_PermissionProject
} from '../../_entity';
import {Component_BasePermissionItemEditor} from './editor-base';
import {
	DropDownCaret,
	Input_Number_Blur,
	Input_Text_Blur
} from './components';
import {DropDown_PermissionProject} from '../../../_entity/permission-project/frontend/ui-components';
import {Page_ItemsEditor} from '@nu-art/thunderstorm/frontend/components/Page_ItemsEditor';
import {InferProps} from '@nu-art/thunderstorm/frontend/utils/types';
import {
	Props_EditableItemControllerProto,
	TS_EditableItemControllerProto
} from '@nu-art/thunderstorm/frontend/components/TS_EditableItemControllerProto';


class Component_EditDomain
	extends Component_BasePermissionItemEditor<DBProto_PermissionDomain> {
	static defaultProps = {
		module: ModuleFE_PermissionDomain,
		displayResolver: (item: DB_PermissionDomain) => `${ModuleFE_PermissionProject.cache.unique(item.projectId)!.name}/${item.namespace}`
	};


	//######################### logic #########################

	private deleteLevel = async (editable: EditableDBItemV3<DBProto_PermissionAccessLevel>) => {
		try {
			await editable.delete();
			this.forceUpdate();
		} catch (err: any) {
			this.logError({...err});
			ModuleFE_Toaster.toastError(err.errorResponse.debugMessage.split('\n')[0]);
		}
	};

	private updateLevel = async <K extends keyof DBProto_PermissionAccessLevel['dbType']>(editable: EditableDBItemV3<DBProto_PermissionAccessLevel>, prop: K, value: DBProto_PermissionAccessLevel['dbType'][K]) => {
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
		if (editable.hasErrors())
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

	private levelsCellRenderer = (prop: keyof DB_PermissionAccessLevel | 'action', item: PreDB<DB_PermissionAccessLevel>, index: number) => {
		const editable = new EditableDBItemV3(item, ModuleFE_PermissionAccessLevel)
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

	private renderLevelName = (editable: EditableDBItemV3<DBProto_PermissionAccessLevel>) => {
		return <Input_Text_Blur
			editable={editable}
			prop={'name'}
			value={editable.item.name}
			placeholder={'Enter level name'}
			onChange={value => this.updateLevel(editable, 'name', value)}
		/>;
	};

	private renderLevelValue = (editable: EditableDBItemV3<DBProto_PermissionAccessLevel>) => {
		return <Input_Number_Blur
			// @ts-ignore
			editable={editable}
			prop={'value'}
			value={exists(editable.item.value) ? String(editable.item.value) : undefined}
			placeholder={'Enter level value'}
			onChange={value => this.updateLevel(editable, 'value', Number(value))}
		/>;
	};

	private renderLevelAction = (editable: EditableDBItemV3<DBProto_PermissionAccessLevel>) => {
		if (!editable.item._id)
			return;

		return <TS_BusyButton
			onClick={async () => await this.deleteLevel(editable)}
			className={'action-button delete'}
		>
			<TS_Icons.bin.component/>
		</TS_BusyButton>;
	};
}

class Controller_DomainsEditor
	extends TS_EditableItemControllerProto<DBProto_PermissionDomain> {
	static defaultProps = {
		keys: ['selected'],
		module: ModuleFE_PermissionDomain,
		editor: Component_EditDomain,
		createInitialInstance: () => ({}),
		autoSave: true
	};
}

export class PermissionDomainsEditor
	extends Page_ItemsEditor<DBProto_PermissionDomain> {

	//######################### Static #########################

	static Route: TS_Route = {
		key: 'domain-permission-editor',
		path: 'domain-permission-editor',
		Component: this
	};

	static defaultProps: Partial<InferProps<PermissionDomainsEditor>> = {
		keys: ['selected'],
		module: ModuleFE_PermissionDomain,
		mapper: domain => [`${ModuleFE_PermissionProject.cache.unique(domain.projectId)!.name}/${domain.namespace}` ?? 'Not Found'],
		sort: (items) => sortArray(items, domain => `${ModuleFE_PermissionProject.cache.unique(domain.projectId)!.name}/${domain.namespace}` ?? 'Not Found'),
		itemRenderer: domain => <>{`${ModuleFE_PermissionProject.cache.unique(domain.projectId)!.name}/${domain.namespace}` ?? 'Not Found'}</>,
		EditorRenderer: Controller_DomainsEditor as React.ComponentType<Partial<Props_EditableItemControllerProto<DBProto_PermissionDomain>>>,
		route: this.Route,
		contextMenuActions: [
			{
				label: 'Delete Domain',
				action: async (item) => {
					try {
						await ModuleFE_PermissionDomain.v1.delete(item as unknown as DB_PermissionDomain).executeSync();
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
