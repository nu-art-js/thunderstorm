/*
 * Permissions management system
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import * as React from 'react';
import {filterInstances, sortArray} from '@nu-art/ts-common';
import {stringToUniqueId} from '@nu-art/db-api-shared';
import {ModuleFE_PermissionsAssert} from '../../modules/ModuleFE_PermissionsAssert.js';
import {DropDown_PermissionRole, ModuleFE_PermissionRole, ModuleFE_PermissionScope, ModuleFE_PermissionUser} from '../../_entity.js';
import {ModuleFE_Account} from '@nu-art/user-account-frontend/index';
import type {DatabaseDef_PermissionRole, DB_PermissionRole, DB_PermissionUser} from '@nu-art/permissions-shared';
import {PermissionScope_Permissions} from '@nu-art/permissions-shared';
import type {DatabaseDef_Account} from '@nu-art/user-account-shared';
import {TS_Route} from '@nu-art/thunder-routing';
import {LL_H_C} from '@nu-art/thunder-widgets';


type ScopeDescriptor = { key: string; values: string[] };

type State = {
	selectedUserId?: string;
	editingRoleIds?: DatabaseDef_PermissionRole['id'][];
	saving: boolean;
	error?: string;
};

export class ScopePermissionsEditor
	extends React.Component<{}, State> {

	static Route: TS_Route = {
		key: 'scope-permissions-editor',
		path: 'scope-permissions-editor',
		Component: ScopePermissionsEditor
	};

	state: State = {
		saving: false,
	};

	private deriveScopeStructure(): ScopeDescriptor[] {
		const entities = ModuleFE_PermissionScope.cache.all();
		const scopeMap = new Map<string, string[]>();
		for (const entity of entities) {
			const values = scopeMap.get(entity.key) ?? [];
			if (!values.includes(entity.value))
				values.push(entity.value);

			scopeMap.set(entity.key, values);
		}

		return [...scopeMap.entries()].map(([key, values]) => ({key, values}));
	}

	private canEdit(): boolean {
		try {
			return ModuleFE_PermissionsAssert.hasScopeAccess(PermissionScope_Permissions, 'write');
		} catch {
			return false;
		}
	}

	private renderScopeHeader(scopes: ScopeDescriptor[]) {
		return <div className={'scope-editor__header'}>
			<h2>Scope Permissions</h2>
			<div className={'scope-editor__scopes-summary'}>
				{scopes.map(scope => (
					<div key={scope.key} className={'scope-editor__scope-chip'}>
						<strong>{scope.key}</strong>: {scope.values.join(' < ')}
					</div>
				))}
			</div>
		</div>;
	}

	private resolveUserEffectiveScopes(user: DB_PermissionUser, scopes: ScopeDescriptor[]): Record<string, string> {
		const roles = user.roles
			.map(r => ModuleFE_PermissionRole.cache.unique(r.roleId))
			.filter((r): r is DB_PermissionRole => !!r);

		const scopeEntities = filterInstances(
			roles.flatMap(r => r.scopeEntries ?? [])
				.map(id => ModuleFE_PermissionScope.cache.unique(id))
		);

		const effective: Record<string, string> = {};
		for (const scope of scopes) {
			let maxIdx = -1;
			for (const entity of scopeEntities) {
				if (entity.key !== scope.key)
					continue;

				const idx = scope.values.indexOf(entity.value);
				if (idx > maxIdx)
					maxIdx = idx;
			}

			if (maxIdx >= 0)
				effective[scope.key] = scope.values[maxIdx];
		}

		return effective;
	}

	private readonly onRowClick = (user: DB_PermissionUser) => {
		if (!this.canEdit() || this.state.saving)
			return;

		if (this.state.selectedUserId === user._id) {
			this.setState({selectedUserId: undefined, editingRoleIds: undefined, error: undefined});
			return;
		}

		this.setState({
			selectedUserId: user._id,
			editingRoleIds: user.roles.map(r => r.roleId),
			error: undefined,
		});
	};

	private readonly onRemoveRole = (roleId: DatabaseDef_PermissionRole['id']) => {
		const editingRoleIds = this.state.editingRoleIds?.filter(id => id !== roleId);
		this.setState({editingRoleIds});
	};

	private readonly onAddRole = (role: DB_PermissionRole) => {
		const editingRoleIds = [...(this.state.editingRoleIds ?? []), role._id];
		this.setState({editingRoleIds});
	};

	private readonly onSave = async () => {
		const {selectedUserId, editingRoleIds} = this.state;
		if (!selectedUserId || !editingRoleIds)
			return;

		this.setState({saving: true, error: undefined});
		try {
			await ModuleFE_PermissionUser.assignPermissions({
				targetAccountIds: [stringToUniqueId<DatabaseDef_Account['dbKey']>(selectedUserId)],
				permissionRoleIds: editingRoleIds,
			});
			this.setState({selectedUserId: undefined, editingRoleIds: undefined, saving: false});
		} catch (e: any) {
			this.setState({saving: false, error: e.message ?? 'Failed to assign permissions'});
		}
	};

	private readonly onCancel = () => {
		this.setState({selectedUserId: undefined, editingRoleIds: undefined, error: undefined});
	};

	private renderRoleEditor(scopes: ScopeDescriptor[]) {
		const {editingRoleIds, saving} = this.state;
		if (!editingRoleIds)
			return null;

		const assignedRoles = filterInstances(editingRoleIds.map(id => ModuleFE_PermissionRole.cache.unique(id)));
		const editingRoleIdSet = new Set(editingRoleIds as string[]);
		const SelectableDropDown = DropDown_PermissionRole.selectable;

		return <tr className={'scope-editor__editor-row'}>
			<td colSpan={2 + scopes.length}>
				<div className={'scope-editor__editor-panel'}>
					<LL_H_C className={'scope-editor__role-chips'}>
						{assignedRoles.map(role => (
							<span key={role._id} className={'scope-editor__role-chip'}>
								{role.label}
								{!saving && <button
									className={'scope-editor__chip-remove'}
									onClick={() => this.onRemoveRole(role._id)}
								>x</button>}
							</span>
						))}
					</LL_H_C>

					{!saving && <div className={'scope-editor__add-role'}>
						<SelectableDropDown
							onSelected={this.onAddRole}
							placeholder={'Add role...'}
							itemResolver={() => ModuleFE_PermissionRole.cache.all().filter(r => r.type === 'assignable' && !editingRoleIdSet.has(r._id as string))}
						/>
					</div>}

					{this.state.error && <div className={'scope-editor__error'}>{this.state.error}</div>}

					<LL_H_C className={'scope-editor__editor-actions'}>
						<button
							className={'scope-editor__btn scope-editor__btn--save'}
							onClick={this.onSave}
							disabled={saving}
						>{saving ? 'Saving...' : 'Save'}</button>
						<button
							className={'scope-editor__btn scope-editor__btn--cancel'}
							onClick={this.onCancel}
							disabled={saving}
						>Cancel</button>
					</LL_H_C>
				</div>
			</td>
		</tr>;
	}

	private renderUserRow = (user: DB_PermissionUser, scopes: ScopeDescriptor[]) => {
		const account = ModuleFE_Account.cache.unique(user._id);
		const email = account?.email ?? 'Unknown';
		const effectiveScopes = this.resolveUserEffectiveScopes(user, scopes);
		const roleNames = user.roles
			.map(r => ModuleFE_PermissionRole.cache.unique(r.roleId)?.label)
			.filter((n): n is string => !!n);

		const isSelected = this.state.selectedUserId === user._id;
		const canEdit = this.canEdit();
		const rowClassName = [
			'scope-editor__user-row',
			canEdit && 'scope-editor__user-row--editable',
			isSelected && 'scope-editor__user-row--selected',
		].filter(Boolean).join(' ');

		return <React.Fragment key={user._id}>
			<tr className={rowClassName} onClick={() => this.onRowClick(user)}>
				<td>{email}</td>
				<td>{roleNames.join(', ') || 'None'}</td>
				{scopes.map(scope => (
					<td key={scope.key} className={effectiveScopes[scope.key] ? 'scope-editor__has-access' : 'scope-editor__no-access'}>
						{effectiveScopes[scope.key] ?? '—'}
					</td>
				))}
			</tr>
			{isSelected && this.renderRoleEditor(scopes)}
		</React.Fragment>;
	};

	private renderUsersTable(scopes: ScopeDescriptor[]) {
		const users = sortArray(
			ModuleFE_PermissionUser.cache.allMutable(),
			user => ModuleFE_Account.cache.unique(user._id)?.email ?? ''
		);

		return <table className={'scope-editor__table'}>
			<thead>
				<tr>
					<th>User</th>
					<th>Roles</th>
					{scopes.map(scope => <th key={scope.key}>{scope.key}</th>)}
				</tr>
			</thead>
			<tbody>
				{users.map(user => this.renderUserRow(user, scopes))}
			</tbody>
		</table>;
	}

	render() {
		const scopes = this.deriveScopeStructure();

		return <div className={'scope-editor'}>
			{this.renderScopeHeader(scopes)}
			{this.renderUsersTable(scopes)}
		</div>;
	}
}
