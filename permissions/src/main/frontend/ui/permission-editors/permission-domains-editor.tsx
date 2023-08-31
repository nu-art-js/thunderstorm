import * as React from 'react';
import {DB_PermissionAccessLevel, DB_PermissionDomain, DB_PermissionProject} from '../../shared';
import {EditorBase, State_EditorBase} from './editor-base';
import {
	ModuleFE_PermissionsAccessLevel,
	ModuleFE_PermissionsDomain,
	ModuleFE_PermissionsProject,
	OnPermissionsDomainsUpdated,
	OnPermissionsLevelsUpdated
} from '../../core/module-pack';
import {
	EditableDBItem,
	EventType_Create,
	EventType_Delete,
	EventType_Update,
	genericNotificationAction,
	getElementCenterPos,
	LL_H_C,
	Model_PopUp,
	ModuleFE_MouseInteractivity,
	mouseInteractivity_PopUp,
	openContent,
	Props_SmartComponent,
	State_SmartComponent,
	Thunder,
	TS_BusyButton,
	TS_Button,
	TS_Input,
	TS_PropRenderer,
	TS_Table
} from '@nu-art/thunderstorm/frontend';
import {BadImplementationException, capitalizeFirstLetter, cloneObj, DBDef, exists, filterInstances, Module, PreDB, sortArray} from '@nu-art/ts-common';
import {TS_Icons} from '@nu-art/ts-styles';
import {Dialog_ActionProcessorConfirmation} from '@nu-art/thunderstorm/frontend/_ats/dialogs';
import {ModuleFE_PermissionsAssert} from '../../modules/ModuleFE_PermissionsAssert';
import {ApiCallerEventType} from '@nu-art/thunderstorm/frontend/core/db-api-gen/types';
import {defaultAccessLevels} from '../../../shared/consts';
import {Permissions_DropDown} from '../ui-props';


type State = State_EditorBase<DB_PermissionDomain> & {
	projects: Readonly<DB_PermissionProject[]>
	newLevel: EditableDBItem<DB_PermissionAccessLevel>;
	dbDefs: DBDef<any>[];
};

const emptyLevel = Object.freeze({name: '', domainId: '', value: -1} as PreDB<DB_PermissionAccessLevel>);

export class PermissionDomainsEditor
	extends EditorBase<DB_PermissionDomain, State, { projectId?: string }>
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

	__onPermissionsDomainsUpdated(...params: ApiCallerEventType<DB_PermissionDomain>) {
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

	__onPermissionsLevelsUpdated(...params: ApiCallerEventType<DB_PermissionAccessLevel>) {
		this.forceUpdate();
	}

	protected async deriveStateFromProps(nextProps: Props_SmartComponent, state: (State & State_SmartComponent)) {
		state.items = ModuleFE_PermissionsDomain.cache.filter(domain => !exists(this.props.projectId) || domain.projectId === this.props.projectId);
		state.projects = ModuleFE_PermissionsProject.cache.all();
		state.newLevel ??= new EditableDBItem(emptyLevel, ModuleFE_PermissionsAccessLevel);

		if (!state.editedItem && state.items.length) {
			state.editedItem = new EditableDBItem(state.items[0], ModuleFE_PermissionsDomain);
			state.selectedItemId = state.items[0]._id;
		}

		state.dbDefs ??= filterInstances(Thunder.getInstance()
			.filterModules<Module>(module => 'dbDef' in module)
			.map(module => 'dbDef' in module ? module.dbDef as DBDef<any> : undefined));

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

	private _saveImpl = async (createLevels: boolean) => {
		ModuleFE_MouseInteractivity.hide(mouseInteractivity_PopUp);
		await genericNotificationAction(
			async () => {
				await new EditableDBItem(this.state.editedItem!.item, ModuleFE_PermissionsDomain, async (domain) => {
					if (!createLevels)
						return;

					await ModuleFE_PermissionsAccessLevel.v1.upsertAll(defaultAccessLevels.map(i => ({
						...i,
						domainId: domain._id
					} as PreDB<DB_PermissionAccessLevel>))).executeSync();

				}).save();
			},
			`Saving ${this.itemName}`, 3);
	};

	protected saveItem = async (e: React.MouseEvent) => {
		if (this.state.editedItem?.item._id)
			await this._saveImpl(false);

		const model: Model_PopUp = {
			id: 'save-initial-domain',
			modalPos: {x: 0, y: -1},
			offset: {x: 0, y: -10},
			originPos: getElementCenterPos(e.target as Element),
			content: () => <>
				<div className={'save-initial-domain__title'}>Create default access levels?</div>
				<LL_H_C className={'save-initial-domain__buttons'}>
					<TS_Button onClick={() => this._saveImpl(false)}>No</TS_Button>
					<TS_Button onClick={() => {
						this._saveImpl(true);
					}}>Yes</TS_Button>
				</LL_H_C>
			</>,
		};
		ModuleFE_MouseInteractivity.showContent(model);
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
		const domain = this.state.editedItem;
		if (!domain)
			return '';

		return <TS_PropRenderer.Vertical label={'Project'}>
			<Permissions_DropDown.Project
				selected={domain.item.projectId}
				onSelected={project => this.setProperty('projectId', project._id)}
			/>
		</TS_PropRenderer.Vertical>;
	};

	private renderDBDefList = () => {
		return <>
			{this.state.dbDefs.map(dbDef => {
				return <div
					onClick={() => {
						ModuleFE_MouseInteractivity.hide(mouseInteractivity_PopUp);
						Dialog_ActionProcessorConfirmation.show(
							{
								key: 'connect-domain-to-routes',
								description: `Connect domain ${this.state.editedItem!.item.namespace} to default routes under module ${dbDef.entityName}?`,
								group: ''
							},
							async () => {
								await ModuleFE_PermissionsAssert.v1.connectDomainToRoutes({domainId: this.state.editedItem!.item._id!, dbName: dbDef.dbName}).executeSync();
							}
						);
					}}
					className={'db-def-list__item'}
				>{dbDef.entityName}</div>;
			})}
		</>;
	};

	private renderConnectDomainButton = () => {
		if (!this.state.editedItem?.item._id)
			return '';

		return <TS_Button
			{...openContent.popUp.right('db-def-list', this.renderDBDefList)}
			className={'db-def-button'}
		>Connect To Routes</TS_Button>;
	};

	editorContent = () => {
		const domain = this.state.editedItem!;
		return <>
			{this.renderProjectsDropDown()}
			<TS_PropRenderer.Vertical label={'Namespace'}>
				<LL_H_C className={'match_width'} style={{gap: '10px'}}>
					<TS_Input type={'text'} value={domain.item.namespace}
										onChange={value => this.setProperty('namespace', value)}/>
					{this.renderConnectDomainButton()}
				</LL_H_C>
			</TS_PropRenderer.Vertical>
			<TS_PropRenderer.Vertical label={'Levels'}>
				{this.renderLevelsTable()}
			</TS_PropRenderer.Vertical>
		</>;
	};
}