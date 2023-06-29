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
import {LL_H_C, LL_V_L, SimpleListAdapter, TS_DropDown, TS_Input, TS_PropRenderer} from '@nu-art/thunderstorm/frontend';
import {ThisShouldNotHappenException, UniqueId} from '@nu-art/ts-common';
import {EditorBase, State_EditorBase} from './editor-base';
import {DB_PermissionAccessLevel, DB_PermissionDomain, DB_PermissionGroup} from '../shared';
import {ModuleFE_PermissionsAccessLevel, ModuleFE_PermissionsDomain, ModuleFE_PermissionsGroup, OnPermissionsGroupsUpdated} from '../core/module-pack';

type State = State_EditorBase<DB_PermissionGroup> & {
	newLevelDomainId?: UniqueId;
};


export class PermissionGroupsEditor
	extends EditorBase<DB_PermissionGroup, State>
	implements OnPermissionsGroupsUpdated {

	//######################### Static #########################

	readonly module = ModuleFE_PermissionsGroup;
	readonly itemName = 'Permission Group';
	readonly itemNamePlural = 'Permission Groups';
	readonly itemDisplay = (item: DB_PermissionGroup) => item.label;
	static defaultProps = {
		modules: [ModuleFE_PermissionsGroup]
	};

	//######################### Life Cycle #########################

	__onPermissionsGroupsUpdated(...params: ApiCallerEventTypeV2<DB_PermissionGroup>) {
		if ([EventType_Update, EventType_Create].includes(params[0])) {
			const level = params[1] as DB_PermissionGroup;
			this.reDeriveState({
				selectedItemId: level._id,
				editedItem: new EditableDBItem<DB_PermissionGroup>(level, ModuleFE_PermissionsGroup)
			});
		}
		if (params[0] === EventType_Delete)
			this.reDeriveState({selectedItemId: undefined, editedItem: undefined});
	}

	protected async deriveStateFromProps(nextProps: Props_SmartComponent, state: (State & State_SmartComponent)) {
		state.items = ModuleFE_PermissionsGroup.cache.all();

		if (!state.editedItem && state.items.length > 0) {
			state.editedItem = new EditableDBItem(state.items[0], ModuleFE_PermissionsGroup);
			state.selectedItemId = state.items[0]._id;
		}
		return state;
	}

	//######################### Render #########################

	private renderExistingLevels = () => {
		const group = this.state.editedItem;
		if (!group)
			return '';

		const levels = ModuleFE_PermissionsAccessLevel.cache.filter(i => !!group.item.accessLevelIds?.includes(i._id));
		if (!levels?.length)
			return '';

		return levels.map(level => {
			const domain = ModuleFE_PermissionsDomain.cache.unique(level.domainId);
			if (!domain)
				throw new ThisShouldNotHappenException(`Level has non existing domain id ${level.domainId}`);

			const domainLevels = ModuleFE_PermissionsAccessLevel.cache.filter(i => i.domainId === domain._id);
			const adapter = SimpleListAdapter(domainLevels, i => <div>{i.item.name}</div>);

			return <LL_V_L className={'level'} key={level._id}>
				<div className={'level__domain-name'}>{domain.namespace}</div>
				<TS_DropDown<DB_PermissionAccessLevel>
					adapter={adapter}
					selected={level}
					onSelected={item => {
						const levelsIds = group.item.accessLevelIds!;
						const index = levelsIds.indexOf(level._id);
						levelsIds.splice(index, 1, item._id);
						this.setProperty('accessLevelIds', levelsIds);
					}}
				/>
			</LL_V_L>;
		});
	};

	private renderNewLevel = () => {
		const group = this.state.editedItem;
		if (!group)
			return '';

		const existingDomainIds = ModuleFE_PermissionsAccessLevel.cache.filter(i => !!group.item.accessLevelIds?.includes(i._id)).map(i => i.domainId);
		const domains = ModuleFE_PermissionsDomain.cache.filter(i => !existingDomainIds.includes(i._id));
		const selected = domains.find(i => i._id === this.state.newLevelDomainId);
		const levels = selected ? ModuleFE_PermissionsAccessLevel.cache.filter(i => i.domainId === selected._id) : [];

		const domainsAdapter = SimpleListAdapter(domains, i => <div>{i.item.namespace}</div>);
		const levelsAdapter = SimpleListAdapter(levels, i => <div>{i.item.name}</div>);

		return <LL_V_L className={'level'}>
			<TS_DropDown<DB_PermissionDomain>
				adapter={domainsAdapter}
				selected={selected}
				placeholder={'Select Domain'}
				onSelected={i => this.setState({newLevelDomainId: i._id})}
			/>
			<TS_DropDown<DB_PermissionAccessLevel>
				adapter={levelsAdapter}
				selected={undefined}
				placeholder={'Select Level'}
				onSelected={i => {
					const levelIds = group.item.accessLevelIds || [];
					levelIds.push(i._id);
					this.setState({newLevelDomainId: undefined}, () => this.setProperty('accessLevelIds', levelIds));
				}}
			/>
		</LL_V_L>;
	};

	private renderAccessLevels = () => {
		return <TS_PropRenderer.Vertical label={'Access Levels'}>
			<LL_H_C className={'levels'}>
				{this.renderExistingLevels()}
				{this.renderNewLevel()}
			</LL_H_C>
		</TS_PropRenderer.Vertical>;
	};

	editorContent = () => {
		const group = this.state.editedItem!;
		return <>
			<TS_PropRenderer.Vertical label={'Label'}>
				<TS_Input type={'text'} value={group.item.label} onChange={value => this.setProperty('label', value)}/>
			</TS_PropRenderer.Vertical>
			{this.renderAccessLevels()}
		</>;
	};
}