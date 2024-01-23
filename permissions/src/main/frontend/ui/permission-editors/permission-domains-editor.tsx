import * as React from 'react';
import {EditableDBItemV3, EventType_Create, EventType_Delete, EventType_Update, TS_BusyButton, TS_PropRenderer, TS_Table} from '@nu-art/thunderstorm/frontend';
import {BadImplementationException, capitalizeFirstLetter, exists, PreDB, sortArray} from '@nu-art/ts-common';
import {TS_Icons} from '@nu-art/ts-styles';
import {ApiCallerEventType} from '@nu-art/thunderstorm/frontend/core/db-api-gen/types';
import {
	DB_PermissionAccessLevel,
	DB_PermissionDomain,
	DB_PermissionProject,
	DBProto_PermissionAccessLevel,
	DBProto_PermissionDomain,
	DispatcherType_PermissionAccessLevel,
	DispatcherType_PermissionDomain,
	ModuleFE_PermissionAccessLevel,
	ModuleFE_PermissionDomain,
	ModuleFE_PermissionProject
} from '../../_entity';
import {DispatcherInterface} from '@nu-art/thunderstorm/frontend/core/db-api-gen/v3_types';
import {EditorBase, Props_EditorBase, State_EditorBase} from './editor-base';
import {DropDownCaret, Input_Number_Blur, Input_Text_Blur} from './components';
import {DropDown_PermissionProject} from '../../../_entity/permission-project/frontend/ui-components';

type State = State_EditorBase<DBProto_PermissionDomain> & {
	projects: Readonly<DB_PermissionProject[]>
};

export class PermissionDomainsEditor
	extends EditorBase<DBProto_PermissionDomain, State>
	implements DispatcherInterface<DispatcherType_PermissionDomain>, DispatcherInterface<DispatcherType_PermissionAccessLevel> {

	//######################### Static #########################

	static defaultProps = {
		module: ModuleFE_PermissionDomain,
		itemName: 'Permission Domain',
		itemNamePlural: 'Permission Domains',
		itemDisplay: (item: DB_PermissionDomain) => `${ModuleFE_PermissionProject.cache.unique(item.projectId)!.name}/${item.namespace}`,
	};

	//######################### Life Cycle #########################

	__onPermissionDomainUpdated(...params: ApiCallerEventType<DB_PermissionDomain>) {
		if ([EventType_Update, EventType_Create].includes(params[0])) {
			const domain = params[1] as DB_PermissionDomain;
			this.reDeriveState({
				selectedItemId: domain._id,
				editedItem: new EditableDBItemV3(domain, ModuleFE_PermissionDomain)
			});
		}
		if (params[0] === EventType_Delete)
			this.reDeriveState({selectedItemId: undefined, editedItem: undefined});
	}

	__onPermissionAccessLevelUpdated(...params: ApiCallerEventType<DB_PermissionAccessLevel>) {
		this.forceUpdate();
	}

	protected deriveStateFromProps(nextProps: Props_EditorBase<DBProto_PermissionDomain>, state: State) {
		state = super.deriveStateFromProps(nextProps, state);
		state.projects = ModuleFE_PermissionProject.cache.all();
		return state;
	}

	//######################### Logic #########################

	private deleteLevel = async (editable: EditableDBItemV3<DBProto_PermissionAccessLevel>) => {
		await editable.delete();
		this.forceUpdate();
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
			domainId: this.state.editedItem?.item._id,
		} as PreDB<DB_PermissionAccessLevel>;
	};

	//######################### Render #########################

	editorContent = () => {
		const editable = this.state.editedItem!;
		return <>
			<TS_PropRenderer.Vertical label={'Project'}>
				<DropDown_PermissionProject.editable
					editable={editable}
					prop={'projectId'}
					caret={DropDownCaret}
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
		const domain = this.state.editedItem;
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