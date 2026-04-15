/*
 * Permissions management system
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import * as React from 'react';
import {AwaitModules} from '@nu-art/sync-manager-frontend';
import {filterInstances, sortArray} from '@nu-art/ts-common';
import type {ApiCallerEventType} from '@nu-art/db-api-shared';
import {ModuleFE_PermissionRole, type OnPermissionRoleUpdated} from '../../_entity/permission-role/ModuleFE_PermissionRole.js';
import {DropDown_PermissionRole} from '../../_entity/permission-role/ui-components.js';
import {ModuleFE_PermissionScope, type OnPermissionScopeUpdated} from '../../_entity/permission-scope/ModuleFE_PermissionScope.js';
import {ModuleFE_PermissionUser, type OnPermissionUserUpdated} from '../../_entity/permission-user/ModuleFE_PermissionUser.js';
import {ModuleFE_Account} from '@nu-art/user-account-frontend/index';
import type {OnAccountsUpdated} from '@nu-art/user-account-frontend';
import type {
	DatabaseDef_PermissionRole,
	DatabaseDef_PermissionScope,
	DB_PermissionRole,
	DB_PermissionScope,
	DB_PermissionUser,
	UI_PermissionRole,
} from '@nu-art/permissions-shared';
import type {DB_Account} from '@nu-art/user-account-shared';
import {ComponentSync, LL_H_C, LL_V_L} from '@nu-art/thunder-widgets';
import {Component_ScopeLabels} from '../scope-editor/Component_ScopeLabels.js';
import {Component_ScopeListEditor} from '../scope-editor/Component_ScopeListEditor.js';
import './Page_Permissions.scss';


type TabId = 'users' | 'roles';

type State = {
	activeTab: TabId;

	// Users tab
	editingUserId?: string;
	editingRoleIds?: DatabaseDef_PermissionRole['id'][];
	editingPersonalScopeEntries?: DatabaseDef_PermissionScope['id'][];
	userSaving: boolean;
	userError?: string;

	// Roles tab (assignable only)
	editingRole?: Partial<UI_PermissionRole>;
	isCreatingRole: boolean;
	roleSaving: boolean;
	roleError?: string;
};

class Page_Permissions
	extends ComponentSync<{}, State>
	implements OnPermissionUserUpdated, OnPermissionRoleUpdated, OnPermissionScopeUpdated, OnAccountsUpdated {

	__onPermissionUserUpdated(..._params: ApiCallerEventType<DB_PermissionUser>) {
		this.forceUpdate();
	}

	__onPermissionRoleUpdated(..._params: ApiCallerEventType<DB_PermissionRole>) {
		this.forceUpdate();
	}

	__onPermissionScopeUpdated(..._params: ApiCallerEventType<DB_PermissionScope>) {
		this.forceUpdate();
	}

	__onAccountsUpdated(..._params: ApiCallerEventType<DB_Account>) {
		this.forceUpdate();
	}

	protected deriveStateFromProps(_nextProps: {}, state: State): State {
		return {
			...state,
			activeTab: state?.activeTab ?? 'users',
			userSaving: state?.userSaving ?? false,
			isCreatingRole: state?.isCreatingRole ?? false,
			roleSaving: state?.roleSaving ?? false,
		};
	}

	// ── Shared helpers ──

	private resolveAssignableRoleNames(user: DB_PermissionUser): string[] {
		return filterInstances(user.roles
			.map(r => ModuleFE_PermissionRole.cache.unique(r.roleId))
			.filter((r): r is DB_PermissionRole => !!r && r.type === 'assignable')
			.map(r => r.label));
	}

	private findPersonalRole(userId: string): DB_PermissionRole | undefined {
		return ModuleFE_PermissionRole.cache.unique(userId as DatabaseDef_PermissionRole['id']);
	}

	// ── Tab switching ──

	private readonly setTab = (tab: TabId) => {
		this.setState({
			activeTab: tab,
			editingUserId: undefined,
			editingRoleIds: undefined,
			editingPersonalScopeEntries: undefined,
			userError: undefined,
			editingRole: undefined,
			isCreatingRole: false,
			roleError: undefined,
		});
	};

	// ── Render ──

	render() {
		const {activeTab} = this.state;
		return <LL_V_L className={'page page-permissions'}>
			<LL_H_C className={'page__header'}>
				<h2>Permissions</h2>
			</LL_H_C>
			<LL_H_C className={'tab-bar'}>
				<button
					className={`tab-bar__tab ${activeTab === 'users' ? 'tab-bar__tab--active' : ''}`}
					onClick={() => this.setTab('users')}
				>Users</button>
				<button
					className={`tab-bar__tab ${activeTab === 'roles' ? 'tab-bar__tab--active' : ''}`}
					onClick={() => this.setTab('roles')}
				>Roles</button>
			</LL_H_C>
			{activeTab === 'users' ? this.renderUsersTab() : this.renderRolesTab()}
		</LL_V_L>;
	}

	// ── Users Tab ──

	private renderUsersTab() {
		const users = sortArray(
			ModuleFE_PermissionUser.cache.allMutable(),
			user => ModuleFE_Account.cache.unique(user._id)?.email ?? ''
		);

		return <React.Fragment>
			{users.length === 0
				? <div className={'empty-state'}>No permission users found</div>
				: <LL_V_L className={'card-list'}>{users.map(user => this.renderUserCard(user))}</LL_V_L>
			}
		</React.Fragment>;
	}

	private renderUserCard(user: DB_PermissionUser) {
		const account = ModuleFE_Account.cache.unique(user._id);
		const email = account?.email ?? 'Unknown';
		const roleNames = this.resolveAssignableRoleNames(user);
		const isEditing = this.state.editingUserId === user._id;
		const personalRole = this.findPersonalRole(user._id);

		return <div key={user._id} className={`card-list__item ${isEditing ? 'card-list__item--selected' : ''}`}>
			<LL_H_C className={'card-list__item-header'}>
				<span className={'card-list__item-name'}>{email}</span>
				<button
					className={'btn btn--ghost btn--sm'}
					onClick={() => this.startEditUser(user)}
				>{isEditing ? 'Cancel' : 'Edit'}</button>
			</LL_H_C>
			{!isEditing && <>
				{roleNames.length > 0
					? <div className={'tags'}>{roleNames.map(name => <span key={name} className={'tag tag--accent'}>{name}</span>)}</div>
					: <div className={'card-list__item-meta'}>No roles assigned</div>
				}
				<Component_ScopeLabels
					scopeEntries={personalRole?.scopeEntries ?? []}
					emptyMessage={'No personal scopes'}
				/>
			</>}
			{isEditing && this.renderUserEditor()}
		</div>;
	}

	private readonly startEditUser = (user: DB_PermissionUser) => {
		if (this.state.editingUserId === user._id) {
			this.setState({editingUserId: undefined, editingRoleIds: undefined, editingPersonalScopeEntries: undefined, userError: undefined});
			return;
		}

		const assignableRoleIds = user.roles
			.map(r => ModuleFE_PermissionRole.cache.unique(r.roleId))
			.filter((r): r is DB_PermissionRole => !!r && r.type === 'assignable')
			.map(r => r._id);

		const personalRole = this.findPersonalRole(user._id);

		this.setState({
			editingUserId: user._id,
			editingRoleIds: assignableRoleIds,
			editingPersonalScopeEntries: [...(personalRole?.scopeEntries ?? [])],
			userError: undefined,
		});
	};

	private renderUserEditor() {
		const {editingRoleIds, editingPersonalScopeEntries, userSaving} = this.state;
		if (!editingRoleIds)
			return null;

		const assignedRoles = filterInstances(editingRoleIds.map(id => ModuleFE_PermissionRole.cache.unique(id)));
		const editingRoleIdSet = new Set(editingRoleIds as string[]);
		const SelectableDropDown = DropDown_PermissionRole.selectable;

		return <LL_V_L className={'user-editor'}>
			<div className={'form-group'}>
				<label className={'form-label'}>Assigned Roles</label>
				<div className={'tags'}>
					{assignedRoles.map(role => (
						<span key={role._id} className={`tag tag--accent ${role.system ? '' : 'tag--removable'}`}>
							{role.label}
							{!userSaving && !role.system && <button
								className={'tag__remove'}
								onClick={() => this.onRemoveUserRole(role._id)}
							>&times;</button>}
						</span>
					))}
					{assignedRoles.length === 0 && <span className={'card-list__item-meta'}>None</span>}
				</div>
			</div>

			{!userSaving && <div className={'form-group'}>
				<SelectableDropDown
					onSelected={this.onAddUserRole}
					placeholder={'Add a role...'}
				itemResolver={() => ModuleFE_PermissionRole.cache.all()
					.filter(r => r.type === 'assignable' && !editingRoleIdSet.has(r._id as string))}
				/>
			</div>}

			<div className={'form-group'}>
				<label className={'form-label'}>Personal Scopes</label>
				<Component_ScopeListEditor
					scopeEntries={editingPersonalScopeEntries ?? []}
					onChanged={entries => this.setState({editingPersonalScopeEntries: entries})}
					disabled={userSaving}
				/>
			</div>

			{this.state.userError && <div className={'editor-panel__error'}>{this.state.userError}</div>}

			<LL_H_C className={'editor-panel__actions'}>
				<button
					className={'btn btn--primary btn--sm'}
					onClick={this.onSaveUser}
					disabled={userSaving}
				>{userSaving ? 'Saving...' : 'Save'}</button>
			</LL_H_C>
		</LL_V_L>;
	}

	private readonly onRemoveUserRole = (roleId: DatabaseDef_PermissionRole['id']) => {
		this.setState({editingRoleIds: this.state.editingRoleIds?.filter(id => id !== roleId)});
	};

	private readonly onAddUserRole = (role: DB_PermissionRole) => {
		this.setState({editingRoleIds: [...(this.state.editingRoleIds ?? []), role._id]});
	};

	private readonly onSaveUser = async () => {
		const {editingUserId, editingRoleIds, editingPersonalScopeEntries} = this.state;
		if (!editingUserId || !editingRoleIds)
			return;

		this.setState({userSaving: true, userError: undefined});
		try {
			const user = ModuleFE_PermissionUser.cache.unique(editingUserId);
			if (!user)
				throw new Error('User not found');

			const personalRole = this.findPersonalRole(editingUserId);
			const personalRoleId = editingUserId as DatabaseDef_PermissionRole['id'];

			const assignableRoleAssignments = editingRoleIds.map(roleId => ({roleId}));
			const allRoles = personalRole
				? [...assignableRoleAssignments, {roleId: personalRoleId}]
				: assignableRoleAssignments;

			const keepSystemRoles = user.roles.filter(r => {
				const role = ModuleFE_PermissionRole.cache.unique(r.roleId);
				return role?.system;
			});
			const systemRoleIds = new Set(keepSystemRoles.map(r => r.roleId as string));
			const mergedRoles = [
				...keepSystemRoles,
				...allRoles.filter(r => !systemRoleIds.has(r.roleId as string)),
			];

			await ModuleFE_PermissionUser.upsert({...user, roles: mergedRoles});

			if (personalRole && editingPersonalScopeEntries)
				await ModuleFE_PermissionRole.upsert({...personalRole, scopeEntries: editingPersonalScopeEntries});

			this.setState({editingUserId: undefined, editingRoleIds: undefined, editingPersonalScopeEntries: undefined, userSaving: false});
		} catch (e: any) {
			this.setState({userSaving: false, userError: e.message ?? 'Failed to save'});
		}
	};

	// ── Roles Tab (assignable only) ──

	private renderRolesTab() {
		const roles = sortArray(
			(ModuleFE_PermissionRole.cache.allMutable() as DB_PermissionRole[])
				.filter(r => r.type === 'assignable'),
			r => r.label
		);

		return <React.Fragment>
			<LL_H_C className={'page-permissions__roles-header'}>
				<button
					className={'btn btn--primary'}
					onClick={() => this.setState({isCreatingRole: true, editingRole: {type: 'assignable', scopeEntries: [], label: ''}})}
				>+ New Role</button>
			</LL_H_C>
			{this.state.editingRole && this.renderRoleEditor()}
			{roles.length === 0
				? <div className={'empty-state'}>No assignable roles defined yet</div>
				: <LL_V_L className={'card-list'}>{roles.map(role => this.renderRoleCard(role))}</LL_V_L>
			}
		</React.Fragment>;
	}

	private renderRoleCard(role: DB_PermissionRole) {
		const isEditing = this.state.editingRole?._id === role._id;

		return <div key={role._id} className={`card-list__item ${isEditing ? 'card-list__item--selected' : ''}`}>
			<LL_H_C className={'card-list__item-header'}>
				<LL_H_C style={{gap: 'var(--space-3)'}}>
					<span className={'card-list__item-name'}>{role.label}</span>
					{role.system && <span className={'badge badge--warning'}>System</span>}
				</LL_H_C>
				{!role.system && <button
					className={'btn btn--ghost btn--sm'}
					onClick={() => this.startEditRole(role)}
				>{isEditing ? 'Cancel' : 'Edit'}</button>}
			</LL_H_C>
			<Component_ScopeLabels scopeEntries={role.scopeEntries ?? []}/>
		</div>;
	}

	private readonly startEditRole = (role: DB_PermissionRole) => {
		if (this.state.editingRole?._id === role._id) {
			this.setState({editingRole: undefined, isCreatingRole: false, roleError: undefined});
			return;
		}

		this.setState({editingRole: {...role}, isCreatingRole: false, roleError: undefined});
	};

	private renderRoleEditor() {
		const role = this.state.editingRole!;
		const {roleSaving} = this.state;

		return <LL_V_L className={'editor-panel'}>
			<div className={'form-group'}>
				<label className={'form-label'}>Label</label>
				<input
					type={'text'}
					value={role.label ?? ''}
					placeholder={'Role name'}
					onChange={e => this.setState({editingRole: {...role, label: e.target.value}})}
				/>
			</div>

			<div className={'form-group'}>
				<label className={'form-label'}>Scope Assignments</label>
				<Component_ScopeListEditor
					scopeEntries={role.scopeEntries ?? []}
					onChanged={entries => this.setState({editingRole: {...role, scopeEntries: entries}})}
					disabled={roleSaving}
				/>
			</div>

			{this.state.roleError && <div className={'editor-panel__error'}>{this.state.roleError}</div>}

			<LL_H_C className={'editor-panel__actions'}>
				<button
					className={'btn btn--primary'}
					onClick={this.onSaveRole}
					disabled={roleSaving}
				>{roleSaving ? 'Saving...' : 'Save'}</button>
				<button
					className={'btn btn--secondary'}
					onClick={() => this.setState({editingRole: undefined, isCreatingRole: false, roleError: undefined})}
					disabled={roleSaving}
				>Cancel</button>
			</LL_H_C>
		</LL_V_L>;
	}

	private readonly onSaveRole = async () => {
		const role = this.state.editingRole;
		if (!role)
			return;

		if (!role.label?.trim()) {
			this.setState({roleError: 'Label is required'});
			return;
		}

		this.setState({roleSaving: true, roleError: undefined});
		try {
			await ModuleFE_PermissionRole.upsert({...role, type: 'assignable'} as UI_PermissionRole);
			this.setState({editingRole: undefined, isCreatingRole: false, roleSaving: false});
		} catch (e: any) {
			this.setState({roleSaving: false, roleError: e.message ?? 'Failed to save role'});
		}
	};
}

export const APage_Permissions = () => (
	<AwaitModules modules={[ModuleFE_PermissionUser, ModuleFE_PermissionRole, ModuleFE_PermissionScope]}>
		<Page_Permissions/>
	</AwaitModules>
);
