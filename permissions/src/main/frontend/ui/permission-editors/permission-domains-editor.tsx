import * as React from 'react';
import {DB_PermissionDomain, DB_PermissionProject} from '../../shared';
import {EditorBase, State_EditorBase} from './editor-base';
import {
	ModuleFE_PermissionsDomain,
	ModuleFE_PermissionsProject,
	OnPermissionsDomainsUpdated,
} from '../../core/module-pack';
import {
	EditableDBItem, EditableDBItemV3,
	EventType_Create,
	EventType_Delete,
	EventType_Update,
	genericNotificationAction,
	getElementCenterPos,
	LL_H_C,
	Model_PopUp,
	ModuleFE_BaseApi,
	ModuleFE_MouseInteractivity,
	mouseInteractivity_PopUp,
	openContent,
	Props_SmartComponent,
	State_SmartComponent,
	TS_BusyButton,
	TS_Button,
	TS_Input,
	TS_PropRenderer,
	TS_Table
} from '@nu-art/thunderstorm/frontend';
import {
	BadImplementationException,
	capitalizeFirstLetter,
	cloneObj,
	DBDef,
	PreDB,
	RuntimeModules,
	sortArray
} from '@nu-art/ts-common';
import {TS_Icons} from '@nu-art/ts-styles';
import {Dialog_ActionProcessorConfirmation} from '@nu-art/thunderstorm/frontend/_ats/dialogs';
import {ApiCallerEventType} from '@nu-art/thunderstorm/frontend/core/db-api-gen/types';
import {defaultAccessLevels} from '../../../shared/consts';
import {Permissions_DropDown} from '../ui-props';
import {DBModuleType} from '@nu-art/thunderstorm';
import {DBProto_PermissionAccessLevel, DB_PermissionAccessLevel, DispatcherType_PermissionAccessLevel, ModuleFE_PermissionAccessLevel} from '../../_entity';
import {DispatcherInterface} from '@nu-art/thunderstorm/frontend/core/db-api-gen/v3_types';


type State = State_EditorBase<DB_PermissionDomain> & {
	projects: Readonly<DB_PermissionProject[]>
	newLevel: EditableDBItemV3<DBProto_PermissionAccessLevel>;
	dbDefs: DBDef<any>[];
};

const emptyLevel = Object.freeze({name: '', domainId: '', value: -1} as PreDB<DB_PermissionAccessLevel>);

export class PermissionDomainsEditor
	extends EditorBase<DB_PermissionDomain, State>
	implements OnPermissionsDomainsUpdated, DispatcherInterface<DispatcherType_PermissionAccessLevel> {

	//######################### Static #########################

	readonly module = ModuleFE_PermissionsDomain;
	readonly itemName = 'Permission Domain';
	readonly itemNamePlural = 'Permission Domains';
	readonly itemDisplay = (item: DB_PermissionDomain) => `${ModuleFE_PermissionsProject.cache.unique(item.projectId)!.name}/${item.namespace}`;
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

	__onPermissionAccessLevelUpdated(...params: ApiCallerEventType<DB_PermissionAccessLevel>) {
		this.forceUpdate();
	}

	protected async deriveStateFromProps(nextProps: Props_SmartComponent, state: (State & State_SmartComponent)) {
		state.items = ModuleFE_PermissionsDomain.cache.all();
		state.projects = ModuleFE_PermissionsProject.cache.all();
		state.newLevel ??= new EditableDBItemV3(emptyLevel, ModuleFE_PermissionAccessLevel);

		if (!state.editedItem && state.items.length) {
			state.editedItem = new EditableDBItem(state.items[0], ModuleFE_PermissionsDomain);
			state.selectedItemId = state.items[0]._id;
		}
		state.dbDefs ??= RuntimeModules()
			.filter<ModuleFE_BaseApi<any>>((module: DBModuleType) => !!module.dbDef)
			.map(module => module.dbDef);

		return state;
	}

	//######################### Logic #########################

	private updateLevel = async <K extends keyof DB_PermissionAccessLevel>(_level: DB_PermissionAccessLevel, key: K, value: DB_PermissionAccessLevel[K]) => {
		const domain = this.state.editedItem;
		if (!domain)
			throw new BadImplementationException('Editing a level with no selected domain');

		const level = new EditableDBItemV3(_level, ModuleFE_PermissionAccessLevel);
		level.set(key, value);
		if (!level.item.domainId)
			level.set('domainId', domain.item._id);

		await level.save();
		this.forceUpdate();
	};

	private deleteLevel = async (_level: DB_PermissionAccessLevel) => {
		const level = new EditableDBItemV3(_level, ModuleFE_PermissionAccessLevel);
		return level.delete();
	};

	private saveNewLevel = async () => {
		if (!this.state.editedItem)
			throw new BadImplementationException('Saving level with no selected domain');

		this.state.newLevel.set('domainId', this.state.editedItem.item._id);
		return this.state.newLevel.save();
	};

	private _saveImpl = async (createLevels: boolean) => {
		ModuleFE_MouseInteractivity.hide(mouseInteractivity_PopUp);
		await genericNotificationAction(
			async () => {
				await new EditableDBItem(this.state.editedItem!.item, ModuleFE_PermissionsDomain, async (domain) => {
					if (!createLevels)
						return;

					await ModuleFE_PermissionAccessLevel.v1.upsertAll(defaultAccessLevels.map(i => ({
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

		let levels = ModuleFE_PermissionAccessLevel.cache.filter(level => level.domainId === domain.item._id);
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
					this.state.newLevel.set('name', value);
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
					this.state.newLevel.set('value', Number(value));
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
								// await ModuleFE_PermissionsAssert.v1.connectDomainToRoutes({domainId: this.state.editedItem!.item._id!, dbName: dbDef.dbName}).executeSync();
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
			<TS_PropRenderer.Vertical label={'Namespace'}>
				<LL_H_C className={'match_width'} style={{gap: '10px'}}>
					<TS_Input type={'text'} value={domain.item.namespace}
										onChange={value => this.setProperty('namespace', value)}/>
					<Permissions_DropDown.Project
						onSelected={(item) => {
							return this.setProperty('projectId', item._id);
						}}
						selected={domain.item.projectId}
					/>
					{this.renderConnectDomainButton()}
				</LL_H_C>
			</TS_PropRenderer.Vertical>
			<TS_PropRenderer.Vertical label={'Levels'}>
				{this.renderLevelsTable()}
			</TS_PropRenderer.Vertical>
		</>;
	};
}