/*
 * Reusable scope-list editor: renders all scope keys with value pickers.
 * Self-contained — reads scope metadata from ModuleFE_PermissionScope cache.
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {ApiCallerEventType} from '@nu-art/db-api-shared';
import type {DB_PermissionScope, DatabaseDef_PermissionScope} from '@nu-art/permissions-shared';
import {permissionScopeId} from '@nu-art/permissions-shared';
import {ComponentSync, LL_V_L} from '@nu-art/thunder-widgets';
import type {OnPermissionScopeUpdated} from '../../_entity.js';
import {ModuleFE_PermissionScope} from '../../_entity.js';
import {deriveScopeStructure, resolveScopeSelections} from './scope-utils.js';
import {Component_ScopeEditor} from './Component_ScopeEditor.js';


export type Props_ScopeListEditor = {
	scopeEntries: DatabaseDef_PermissionScope['id'][];
	onChanged: (entries: DatabaseDef_PermissionScope['id'][]) => void;
	disabled?: boolean;
};

type State = {
	scopeEntries: DatabaseDef_PermissionScope['id'][];
	disabled: boolean;
};

export class Component_ScopeListEditor
	extends ComponentSync<Props_ScopeListEditor, State>
	implements OnPermissionScopeUpdated {

	__onPermissionScopeUpdated(..._params: ApiCallerEventType<DB_PermissionScope>) {
		this.forceUpdate();
	}

	protected deriveStateFromProps(nextProps: Props_ScopeListEditor): State {
		return {
			scopeEntries: nextProps.scopeEntries,
			disabled: nextProps.disabled ?? false,
		};
	}

	private readonly onScopeChanged = (scopeKey: string, value?: string) => {
		const scopeEntities = ModuleFE_PermissionScope.cache.all();
		const idsForThisKey = new Set(
			scopeEntities.filter(e => e.key === scopeKey).map(e => e._id as string)
		);
		const otherEntries = this.state.scopeEntries.filter(id => !idsForThisKey.has(id as string));

		if (!value) {
			this.props.onChanged(otherEntries as DatabaseDef_PermissionScope['id'][]);
			return;
		}

		const newEntry = permissionScopeId(scopeKey as any, value as any);
		this.props.onChanged([...otherEntries, newEntry] as DatabaseDef_PermissionScope['id'][]);
	};

	render() {
		const scopes = deriveScopeStructure();
		const selections = resolveScopeSelections(this.state.scopeEntries, scopes);

		return <LL_V_L className={'scope-editor'}>
			{scopes.map(scope => (
				<Component_ScopeEditor
					key={scope.key}
					scopeKey={scope.key}
					values={scope.values}
					selected={selections[scope.key]}
					onChanged={this.onScopeChanged}
					disabled={this.state.disabled}
				/>
			))}
		</LL_V_L>;
	}
}
