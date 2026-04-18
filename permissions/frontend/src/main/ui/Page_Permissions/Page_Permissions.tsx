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
import {ComponentSync, LL_H_C, LL_V_L, SimpleListAdapter, TS_DropDown} from '@nu-art/thunder-widgets';
import {Component_ScopeLabels} from '../scope-editor/Component_ScopeLabels.js';
import {Component_ScopeListEditor} from '../scope-editor/Component_ScopeListEditor.js';
import './Page_Permissions.scss';


type State = {
	editingGroup?: DB_AccessGroup;
};

const memberFilter = new Filter<DB_AccessGroup>(item => [item.label]);

const editableGroupTypes = new Set(['entity', 'custom']);

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
		return {...state};
	}

	private readonly expandGroup = (group: DB_AccessGroup) => {
		this.setState({
			editingGroup: {
				...group,
				members: [...group.members],
				scopeEntries: group.scopeEntries ? [...group.scopeEntries] : [],
			}
		});
	};

	private readonly collapseGroup = () => {
		this.setState({editingGroup: undefined});
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
		this.setState({editingGroup: undefined});
	};

	render() {
		const groups = sortArray(
			ModuleFE_AccessGroup.cache.allMutable() as DB_AccessGroup[],
			g => g.label
		);

		return <LL_V_L className={'page page-permissions'}>
			<LL_H_C className={'page__header'}>
				<h2>Permissions — Access Groups</h2>
			</LL_H_C>
			{groups.length === 0
				? <div className={'empty-state'}>No access groups</div>
				: <LL_V_L className={'card-list'}>{groups.map(group => this.renderGroupCard(group))}</LL_V_L>
			}
		</LL_V_L>;
	}

	private renderGroupCard(group: DB_AccessGroup) {
		const draft = this.state.editingGroup;
		const isExpanded = draft?._id === group._id;
		const isEditable = editableGroupTypes.has(group.type);

		return <div key={group._id} className={`card-list__item ${isExpanded ? 'card-list__item--selected' : ''}`}>
			<LL_H_C className={'card-list__item-header'}>
				<LL_H_C style={{gap: 'var(--space-3)'}}>
					<span className={'card-list__item-name'}>{group.label}</span>
					<span className={'badge badge--info'}>{group.type}</span>
				</LL_H_C>
				<button
					className={'btn btn--ghost btn--sm'}
					onClick={() => isExpanded ? this.collapseGroup() : this.expandGroup(group)}
				>{isExpanded ? 'Collapse' : 'Details'}</button>
			</LL_H_C>

			<Component_ScopeLabels scopeEntries={group.scopeEntries ?? []} emptyMessage={'No scopes'}/>

			{isExpanded && draft && (isEditable ? this.renderGroupEditor(draft) : this.renderGroupReadonly(group))}
		</div>;
	}

	private renderGroupReadonly(group: DB_AccessGroup) {
		return <LL_V_L className={'group-details'}>
			<div className={'form-group'}>
				<label className={'form-label'}>Key</label>
				<span>{group.key}</span>
			</div>
			<div className={'form-group'}>
				<label className={'form-label'}>Members ({group.members.length})</label>
				{group.members.length === 0
					? <span className={'card-list__item-meta'}>No members</span>
					: <div className={'tags'}>{group.members.map(memberId => {
						const memberGroup = ModuleFE_AccessGroup.cache.unique(memberId);
						return <span key={memberId} className={'tag tag--accent'}>
							{memberGroup?.label ?? memberId}
						</span>;
					})}</div>
				}
			</div>
		</LL_V_L>;
	}

	private renderGroupEditor(draft: DB_AccessGroup) {
		return <LL_V_L className={'group-details'}>
			<div className={'form-group'}>
				<label className={'form-label'}>Key</label>
				<span>{draft.key}</span>
			</div>

			<div className={'form-group'}>
				<label className={'form-label'}>Scopes</label>
				<Component_ScopeListEditor
					scopeEntries={(draft.scopeEntries ?? []) as DatabaseDef_PermissionScope['id'][]}
					onChanged={this.onScopeEntriesChanged}
				/>
			</div>

			<div className={'form-group'}>
				<label className={'form-label'}>Members ({draft.members.length})</label>
				{this.renderMemberTags(draft.members)}
				{this.renderAddMemberDropdown(draft.members)}
			</div>

			<LL_H_C className={'editor-panel__actions'}>
				<button className={'btn btn--primary btn--sm'} onClick={this.saveGroup}>Save</button>
				<button className={'btn btn--ghost btn--sm'} onClick={this.collapseGroup}>Cancel</button>
			</LL_H_C>
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
				.filter(g => (g.type === 'user' || g.type === 'service-account') && !memberSet.has(g._id)),
			g => g.label
		);

		if (candidates.length === 0)
			return null;

		return <TS_DropDown<DB_AccessGroup>
			className={'member-dropdown'}
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
