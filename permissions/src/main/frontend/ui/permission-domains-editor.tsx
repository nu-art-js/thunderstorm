import * as React from 'react';
import {
	ApiCallerEventTypeV2,
	EditableDBItem,
	EventType_Create,
	EventType_Delete,
	EventType_Update,
	Props_SmartComponent,
	State_SmartComponent
} from '@nu-art/db-api-generator/frontend';
import {DB_PermissionAccessLevel, DB_PermissionDomain, DB_PermissionProject} from '../shared';
import {EditorBase, State_EditorBase} from './editor-base';
import {
	ModuleFE_PermissionsAccessLevel,
	ModuleFE_PermissionsDomain,
	ModuleFE_PermissionsProject,
	OnPermissionsDomainsUpdated,
	OnPermissionsLevelsUpdated
} from '../core/module-pack';
import {SimpleListAdapter, TS_BusyButton, TS_DropDown, TS_Input, TS_PropRenderer, TS_Table} from '@nu-art/thunderstorm/frontend';
import {BadImplementationException, capitalizeFirstLetter, cloneObj, PreDB, sortArray} from '@nu-art/ts-common';
import {TS_Icons} from '@nu-art/ts-styles';

type State = State_EditorBase<DB_PermissionDomain> & {
	projects: Readonly<DB_PermissionProject[]>
	newLevel: EditableDBItem<DB_PermissionAccessLevel>;
};

const emptyLevel: PreDB<DB_PermissionAccessLevel> = Object.freeze({name: '', domainId: '', value: -1});

export class PermissionDomainsEditor
	extends EditorBase<DB_PermissionDomain, State>
	implements OnPermissionsDomainsUpdated, OnPermissionsLevelsUpdated {


	//######################### Static #########################

	readonly module = ModuleFE_PermissionsDomain;
	readonly itemName = 'Permission Domain';
	readonly itemNamePlural = 'Permission Domains';
	readonly itemDisplay = (item: DB_PermissionDomain) => item.namespace;
	static defaultProps = {
		modules: [ModuleFE_PermissionsDomain]
	};

	//######################### Life Cycle #########################

	__onPermissionsDomainsUpdated(...params: ApiCallerEventTypeV2<DB_PermissionDomain>) {
		if ([EventType_Update, EventType_Create].includes(params[0])) {
			const domain = params[1] as DB_PermissionDomain;
			this.reDeriveState({
				selectedItemId: domain._id,
				editedItem: new EditableDBItem<DB_PermissionDomain>(domain, ModuleFE_PermissionsDomain)
			});
		}
		if (params[0] === EventType_Delete)
			this.reDeriveState({selectedItemId: undefined, editedItem: undefined});
	}

	__onPermissionsLevelsUpdated(...params: ApiCallerEventTypeV2<DB_PermissionAccessLevel>) {
		this.forceUpdate();
	}

	protected async deriveStateFromProps(nextProps: Props_SmartComponent, state: (State & State_SmartComponent)) {
		state.items = ModuleFE_PermissionsDomain.cache.all();
		state.projects = ModuleFE_PermissionsProject.cache.all();
		state.newLevel ??= new EditableDBItem(emptyLevel, ModuleFE_PermissionsAccessLevel);

		if (!state.editedItem && state.items.length) {
			state.editedItem = new EditableDBItem(state.items[0], ModuleFE_PermissionsDomain);
			state.selectedItemId = state.items[0]._id;
		}

		return state;
	}

	//######################### Logic #########################

	private updateLevel = async <K extends keyof DB_PermissionAccessLevel>(_level: DB_PermissionAccessLevel, key: K, value: DB_PermissionAccessLevel[K]) => {
		const domain = this.state.editedItem;
		if (!domain)
			throw new BadImplementationException('Editing a level with no selected domain');

		const level = new EditableDBItem(_level, ModuleFE_PermissionsAccessLevel);
		level.update(key, value);
		if (!level.item.domainId)
			level.update('domainId', domain.item._id);

		await level.save();
		this.forceUpdate();
	};

	private deleteLevel = async (_level: DB_PermissionAccessLevel) => {
		const level = new EditableDBItem(_level, ModuleFE_PermissionsAccessLevel);
		return level.delete();
	};

	private saveNewLevel = async () => {
		if (!this.state.editedItem)
			throw new BadImplementationException('Saving level with no selected domain');

		this.state.newLevel.update('domainId', this.state.editedItem.item._id);
		return this.state.newLevel.save();
	};

	//######################### Render levels #########################

	private renderLevelsTable = () => {
		const domain = this.state.editedItem;
		if (!domain)
			return '';

		let levels = ModuleFE_PermissionsAccessLevel.cache.filter(level => level.domainId === domain.item._id);
		levels = sortArray(levels, i => i.value);
		levels.push(cloneObj(emptyLevel) as DB_PermissionAccessLevel);
		return <TS_Table<DB_PermissionAccessLevel, 'action'>
			header={['name', 'value', {widthPx: 50, header: 'action'}]}
			headerRenderer={header => header === 'action' ? '' : capitalizeFirstLetter(header)}
			rows={levels}
			cellRenderer={this.levelsCellRenderer}
		/>;
	};

	private levelsCellRenderer = (prop: keyof DB_PermissionAccessLevel | 'action', item: DB_PermissionAccessLevel, index: number) => {
		switch (prop) {
			case 'name':
				return this.renderLevelName(item);

			case 'value':
				return this.renderLevelValue(item);

			case 'action':
				return this.renderLevelAction(item);
			default:
				throw new BadImplementationException(`No renderer defined for key ${prop}`);
		}
	};

	private renderLevelName = (level: DB_PermissionAccessLevel) => {
		const actionProp = level._id
			? {onBlur: async (value: string) => await this.updateLevel(level, 'name', value)}
			: {
				onChange: (value: string) => {
					this.state.newLevel.update('name', value);
					this.forceUpdate();
				}
			};

		return <TS_Input
			type={'text'}
			value={level.name}
			placeholder={'Enter level name'}
			{...actionProp}
		/>;
	};

	private renderLevelValue = (level: DB_PermissionAccessLevel) => {
		const actionProp = level._id
			? {onBlur: async (value: string) => await this.updateLevel(level, 'value', Number(value))}
			: {
				onChange: (value: string) => {
					this.state.newLevel.update('value', Number(value));
					this.forceUpdate();
				}
			};

		return <TS_Input
			type={'number'}
			value={level.value >= 0 ? String(level.value) : undefined}
			placeholder={'Enter level value'}
			{...actionProp}
		/>;
	};

	private renderLevelAction = (level: DB_PermissionAccessLevel) => {
		if (!level._id)
			return <TS_BusyButton onClick={this.saveNewLevel} className={'action-button save'}>
				<TS_Icons.save.component/>
			</TS_BusyButton>;

		return <TS_BusyButton
			onClick={async () => await this.deleteLevel(level)}
			className={'action-button delete'}
			key={level._id}>
			<TS_Icons.bin.component/>
		</TS_BusyButton>;
	};

	//######################### Render #########################

	private renderProjectsDropDown = () => {
		if (!this.state.editedItem)
			return '';

		const domain = this.state.editedItem;
		const adapter = SimpleListAdapter(this.state.projects as DB_PermissionProject[], item => <div>{item.item.name}</div>);
		const selected = domain.item.projectId ? this.state.projects.find(item => item._id === domain.item.projectId) : undefined;
		return <TS_PropRenderer.Vertical label={'Project'}>
			<TS_DropDown<DB_PermissionProject>
				adapter={adapter}
				selected={selected}
				onSelected={item => this.setProperty('projectId', item._id)}
			/>
		</TS_PropRenderer.Vertical>;
	};

	editorContent = () => {
		const domain = this.state.editedItem!;
		return <>
			{this.renderProjectsDropDown()}
			<TS_PropRenderer.Vertical label={'Namespace'}>
				<TS_Input type={'text'} value={domain.item.namespace} onChange={value => this.setProperty('namespace', value)}/>
			</TS_PropRenderer.Vertical>
			<TS_PropRenderer.Vertical label={'Levels'}>
				{this.renderLevelsTable()}
			</TS_PropRenderer.Vertical>
		</>;
	};
}