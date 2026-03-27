/*
 * Permissions management system
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import * as React from 'react';
import {sortArray} from '@nu-art/ts-common';
import {ModuleFE_PermissionsAssert} from '../../modules/ModuleFE_PermissionsAssert.js';
import {ModuleFE_PermissionUser, ModuleFE_PermissionGroup} from '../../_entity.js';
import {ModuleFE_Account} from '@nu-art/user-account-frontend/index';
import type {RegisteredScope, DB_PermissionGroup, DB_PermissionUser} from '@nu-art/permissions-shared';
import {TS_Route} from '@nu-art/thunder-routing';


type State = {
	scopes: RegisteredScope[];
	loading: boolean;
	selectedUserId?: string;
};

export class ScopePermissionsEditor
	extends React.Component<{}, State> {

	static Route: TS_Route = {
		key: 'scope-permissions-editor',
		path: 'scope-permissions-editor',
		Component: ScopePermissionsEditor
	};

	state: State = {
		scopes: [],
		loading: true,
	};

	async componentDidMount() {
		try {
			const scopes = await ModuleFE_PermissionsAssert.getRegisteredScopes();
			this.setState({scopes, loading: false});
		} catch (e) {
			this.setState({loading: false});
		}
	}

	private renderScopeHeader() {
		return <div className={'scope-editor__header'}>
			<h2>Scope Permissions</h2>
			<div className={'scope-editor__scopes-summary'}>
				{this.state.scopes.map(scope => (
					<div key={scope.key} className={'scope-editor__scope-chip'}>
						<strong>{scope.key}</strong>: {scope.values.join(' < ')}
					</div>
				))}
			</div>
		</div>;
	}

	private resolveUserEffectiveScopes(user: DB_PermissionUser): Record<string, string> {
		const groups = user.groups
			.map(g => ModuleFE_PermissionGroup.cache.unique(g.groupId))
			.filter((g): g is DB_PermissionGroup => !!g);

		const effective: Record<string, string> = {};
		for (const scope of this.state.scopes) {
			let maxIdx = -1;
			for (const group of groups) {
				const entries = group.scopeEntries ?? [];
				const prefix = scope.key + ':';
				for (const entry of entries) {
					if (!entry.startsWith(prefix))
						continue;

					const value = entry.substring(prefix.length);
					const idx = scope.values.indexOf(value);
					if (idx > maxIdx)
						maxIdx = idx;
				}
			}

			if (maxIdx >= 0)
				effective[scope.key] = scope.values[maxIdx];
		}

		return effective;
	}

	private renderUserRow = (user: DB_PermissionUser) => {
		const account = ModuleFE_Account.cache.unique(user._id);
		const email = account?.email ?? 'Unknown';
		const effectiveScopes = this.resolveUserEffectiveScopes(user);
		const groupNames = user.groups
			.map(g => ModuleFE_PermissionGroup.cache.unique(g.groupId)?.label)
			.filter((n): n is string => !!n);

		return <tr key={user._id} className={'scope-editor__user-row'}>
			<td>{email}</td>
			<td>{groupNames.join(', ') || 'None'}</td>
			{this.state.scopes.map(scope => (
				<td key={scope.key} className={effectiveScopes[scope.key] ? 'scope-editor__has-access' : 'scope-editor__no-access'}>
					{effectiveScopes[scope.key] ?? '—'}
				</td>
			))}
		</tr>;
	};

	private renderUsersTable() {
		const users = sortArray(
			ModuleFE_PermissionUser.cache.allMutable(),
			user => ModuleFE_Account.cache.unique(user._id)?.email ?? ''
		);

		return <table className={'scope-editor__table'}>
			<thead>
				<tr>
					<th>User</th>
					<th>Groups</th>
					{this.state.scopes.map(scope => <th key={scope.key}>{scope.key}</th>)}
				</tr>
			</thead>
			<tbody>
				{users.map(this.renderUserRow)}
			</tbody>
		</table>;
	}

	render() {
		if (this.state.loading)
			return <div>Loading scopes...</div>;

		return <div className={'scope-editor'}>
			{this.renderScopeHeader()}
			{this.renderUsersTable()}
		</div>;
	}
}
