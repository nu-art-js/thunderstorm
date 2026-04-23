/*
 * Permissions management system
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {AwaitModules} from '@nu-art/sync-manager-frontend';
import {Filter, sortArray} from '@nu-art/ts-common';
import type {ApiCallerEventType} from '@nu-art/db-api-shared';
import type {DB_AccessGroup, DB_PermissionScope, DatabaseDef_PermissionScope} from '@nu-art/permissions-shared';
import {ModuleFE_PermissionScope, type OnPermissionScopeUpdated} from '../../_entity/permission-scope/ModuleFE_PermissionScope.js';
import {ModuleFE_AccessGroup, type OnAccessGroupUpdated} from '../../_entity/access-group/ModuleFE_AccessGroup.js';
import {ComponentSync, LL_H_C, LL_H_T, LL_V_L, SimpleListAdapter, TS_DropDown, TS_Input, TS_JSONViewer} from '@nu-art/thunder-widgets';
import {Component_ScopeMultiSelect} from '../scope-editor/Component_ScopeMultiSelect.js';
import {Component_ScopeLabels} from '../scope-editor/Component_ScopeLabels.js';
import './Page_Permissions.scss';


type State = {
	selectedGroupId?: string;
	editingGroup?: DB_AccessGroup;
	groupSearch: string;
};

const memberFilter = new Filter<DB_AccessGroup>(item => [item.label]);
const editableGroupTypes = new Set(['entity', 'custom']);

function resolveGroupLabel(id: string): string {
	return ModuleFE_AccessGroup.cache.unique(id)?.label ?? id;
}

function resolveScopeLabel(id: string): string {
	const entity = ModuleFE_PermissionScope.cache.unique(id);
	return entity ? `${entity.key}:${entity.value}` : id;
}

function resolveIds(ids: string[] | undefined, resolver: (id: string) => string): string[] {
	if (!ids?.length)
		return [];

	return ids.map(resolver);
}

function buildResolvedDocument(group: DB_AccessGroup): Record<string, unknown> {
	const access = (group as Record<string, unknown>).__access as Record<string, string[]> | undefined;

	const result: Record<string, unknown> = {
		_id: group._id,
		_v: (group as Record<string, unknown>)._v,
		type: group.type,
		key: group.key,
		label: group.label,
	};

	const members = resolveIds(group.members as string[], resolveGroupLabel);
	if (members.length)
		result.members = members;

	const scopeEntries = resolveIds((group.scopeEntries ?? []) as string[], resolveScopeLabel);
	if (scopeEntries.length)
		result.scopeEntries = scopeEntries;

	if (access) {
		const resolved: Record<string, string[]> = {};
		for (const [role, ids] of Object.entries(access)) {
			const labels = resolveIds(ids, resolveGroupLabel);
			if (labels.length)
				resolved[role] = labels;
		}

		if (Object.keys(resolved).length)
			result.__access = resolved;
	}

	return result;
}

class Page_Permissions
	extends ComponentSync<{}, State>
	implements OnAccessGroupUpdated, OnPermissionScopeUpdated {

	__onAccessGroupUpdated(..._params: ApiCallerEventType<DB_AccessGroup>) {
		this.forceUpdate();
	}

	__onPermissionScopeUpdated(..._params: ApiCallerEventType<DB_PermissionScope>) {
		this.forceUpdate();
	}

	protected deriveStateFromProps(_nextProps: {}, state: State): State {
		return {
			...state,
			groupSearch: state?.groupSearch ?? '',
		};
	}

	private readonly selectGroup = (group: DB_AccessGroup) => {
		const isEditable = editableGroupTypes.has(group.type);
		this.setState({
			selectedGroupId: group._id,
			editingGroup: isEditable ? {
				...group,
				members: [...group.members],
				scopeEntries: group.scopeEntries ? [...group.scopeEntries] : [],
			} : undefined,
		});
	};

	private readonly onScopeEntriesChanged = (entries: DatabaseDef_PermissionScope['id'][]) => {
		const draft = this.state.editingGroup;
		if (!draft)
			return;

		this.setState({editingGroup: {...draft, scopeEntries: entries}});
	};

	private readonly addMember = (member: DB_AccessGroup) => {
		const draft = this.state.editingGroup;
		if (!draft)
			return;

		if (draft.members.includes(member._id))
			return;

		this.setState({editingGroup: {...draft, members: [...draft.members, member._id]}});
	};

	private readonly removeMember = (memberId: string) => {
		const draft = this.state.editingGroup;
		if (!draft)
			return;

		this.setState({editingGroup: {...draft, members: draft.members.filter(id => id !== memberId)}});
	};

	private readonly saveGroup = async () => {
		const draft = this.state.editingGroup;
		if (!draft)
			return;

		await ModuleFE_AccessGroup.upsert(draft);
	};

	private readonly cancelEdit = () => {
		const selectedId = this.state.selectedGroupId;
		if (!selectedId)
			return;

		const original = ModuleFE_AccessGroup.cache.unique(selectedId) as DB_AccessGroup | undefined;
		if (!original)
			return;

		this.setState({
			editingGroup: editableGroupTypes.has(original.type) ? {
				...original,
				members: [...original.members],
				scopeEntries: original.scopeEntries ? [...original.scopeEntries] : [],
			} : undefined,
		});
	};

	render() {
		const groups = sortArray(
			ModuleFE_AccessGroup.cache.allMutable() as DB_AccessGroup[],
			g => g.label
		);

		const filteredGroups = this.state.groupSearch
			? groups.filter(g => g.label.toLowerCase().includes(this.state.groupSearch.toLowerCase()))
			: groups;

		const selectedGroup = this.state.selectedGroupId
			? groups.find(g => g._id === this.state.selectedGroupId)
			: undefined;

		return <LL_H_T className={'page-permissions'}>
			{this.renderListPanel(filteredGroups)}
			{this.renderDetailPanel(selectedGroup)}
			{this.renderDebugPanel(selectedGroup)}
		</LL_H_T>;
	}

	private renderListPanel(groups: DB_AccessGroup[]) {
		return <LL_V_L className={'page-permissions__list-panel'}>
			<h2>Access Groups</h2>
			<TS_Input
				type={'text'}
				value={this.state.groupSearch}
				placeholder={'Filter groups...'}
				saveEvent={['change']}
				onChange={value => this.setState({groupSearch: value})}
			/>
			<LL_V_L className={'page-permissions__group-list'}>
				{groups.length === 0
					? <div className={'empty-state'}>No groups</div>
					: groups.map(group => this.renderGroupRow(group))
				}
			</LL_V_L>
		</LL_V_L>;
	}

	private renderGroupRow(group: DB_AccessGroup) {
		const isSelected = this.state.selectedGroupId === group._id;
		const scopeCount = group.scopeEntries?.length ?? 0;

		return <div
			key={group._id}
			className={`page-permissions__group-row ${isSelected ? 'page-permissions__group-row--selected' : ''}`}
			onClick={() => this.selectGroup(group)}
		>
			<LL_H_C className={'page-permissions__group-row-header'}>
				<span className={'page-permissions__group-row-name'}>{group.label}</span>
				<span className={'badge badge--info'}>{group.type}</span>
			</LL_H_C>
			<span className={'page-permissions__group-row-meta'}>
				{scopeCount} scope{scopeCount !== 1 ? 's' : ''} · {group.members.length} member{group.members.length !== 1 ? 's' : ''}
			</span>
		</div>;
	}

	private renderDetailPanel(group?: DB_AccessGroup) {
		if (!group)
			return <LL_V_L className={'page-permissions__detail-panel page-permissions__detail-panel--empty'}>
				<div className={'empty-state'}>Select a group to view details</div>
			</LL_V_L>;

		const isEditable = editableGroupTypes.has(group.type);
		const draft = this.state.editingGroup;

		return <LL_V_L className={'page-permissions__detail-panel'}>
			<LL_H_C className={'page-permissions__detail-header'}>
				<h3>{group.label}</h3>
				<LL_H_C style={{gap: 'var(--space-2)'}}>
					<span className={'badge badge--info'}>{group.type}</span>
					<span className={'page-permissions__detail-key'}>{group.key}</span>
				</LL_H_C>
			</LL_H_C>

			<LL_V_L className={'page-permissions__detail-section'}>
				<h4>Scopes</h4>
				{isEditable && draft
					? <Component_ScopeMultiSelect
						scopeEntries={(draft.scopeEntries ?? []) as DatabaseDef_PermissionScope['id'][]}
						onChanged={this.onScopeEntriesChanged}
					/>
					: <Component_ScopeLabels
						scopeEntries={group.scopeEntries ?? []}
						emptyMessage={'No scopes assigned'}
					/>
				}
			</LL_V_L>

			<LL_V_L className={'page-permissions__detail-section'}>
				<h4>Members ({isEditable && draft ? draft.members.length : group.members.length})</h4>
				{isEditable && draft
					? this.renderMemberEditor(draft)
					: this.renderMemberReadonly(group)
				}
			</LL_V_L>

			{isEditable && draft && <LL_H_C className={'editor-panel__actions'}>
				<button className={'btn btn--primary btn--sm'} onClick={this.saveGroup}>Save</button>
				<button className={'btn btn--ghost btn--sm'} onClick={this.cancelEdit}>Reset</button>
			</LL_H_C>}
		</LL_V_L>;
	}

	private renderDebugPanel(group?: DB_AccessGroup) {
		if (!group)
			return <LL_V_L className={'page-permissions__debug-panel page-permissions__debug-panel--empty'}/>;

		const resolved = buildResolvedDocument(group);

		return <LL_V_L className={'page-permissions__debug-panel'}>
			<h4>Document</h4>
			<div className={'page-permissions__debug-tree'}>
				<TS_JSONViewer item={resolved} expandAll compact/>
			</div>
		</LL_V_L>;
	}

	private renderMemberReadonly(group: DB_AccessGroup) {
		if (group.members.length === 0)
			return <span className={'card-list__item-meta'}>No members</span>;

		return <div className={'tags'}>
			{group.members.map(memberId => {
				const memberGroup = ModuleFE_AccessGroup.cache.unique(memberId);
				return <span key={memberId} className={'tag tag--accent'}>
					{memberGroup?.label ?? memberId}
				</span>;
			})}
		</div>;
	}

	private renderMemberEditor(draft: DB_AccessGroup) {
		return <LL_V_L className={'page-permissions__member-editor'}>
			{this.renderMemberTags(draft.members)}
			{this.renderAddMemberDropdown(draft.members)}
		</LL_V_L>;
	}

	private renderMemberTags(members: string[]) {
		if (members.length === 0)
			return <span className={'card-list__item-meta'}>No members</span>;

		return <div className={'tags'}>
			{members.map(memberId => {
				const memberGroup = ModuleFE_AccessGroup.cache.unique(memberId);
				return <span key={memberId} className={'tag tag--accent'}>
					{memberGroup?.label ?? memberId}
					<button className={'tag__remove'} onClick={() => this.removeMember(memberId)}>&times;</button>
				</span>;
			})}
		</div>;
	}

	private renderAddMemberDropdown(currentMembers: string[]) {
		const memberSet = new Set(currentMembers);
		const candidates = sortArray(
			(ModuleFE_AccessGroup.cache.allMutable() as DB_AccessGroup[])
				.filter(g => g._id !== this.state.selectedGroupId && !memberSet.has(g._id)),
			g => g.label
		);

		if (candidates.length === 0)
			return null;

		return <TS_DropDown<DB_AccessGroup>
			className={'page-permissions__member-dropdown'}
			adapter={SimpleListAdapter(candidates, node => <>{node.item.label}</>)}
			filter={memberFilter}
			placeholder={'Add member...'}
			onSelected={this.addMember}
		/>;
	}
}

export const APage_Permissions = () => (
	<AwaitModules modules={[ModuleFE_AccessGroup, ModuleFE_PermissionScope]}>
		<Page_Permissions/>
	</AwaitModules>
);
