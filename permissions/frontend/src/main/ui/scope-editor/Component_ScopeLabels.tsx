/*
 * Read-only scope labels display: resolves scope entries to key:value tags.
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import * as React from 'react';
import type {DatabaseDef_PermissionScope} from '@nu-art/permissions-shared';
import {deriveScopeStructure, resolveScopeSelections} from './scope-utils.js';


export type Props_ScopeLabels = {
	scopeEntries: DatabaseDef_PermissionScope['id'][];
	emptyMessage?: string;
};

export const Component_ScopeLabels = (props: Props_ScopeLabels) => {
	const scopes = deriveScopeStructure();
	const selections = resolveScopeSelections(props.scopeEntries, scopes);
	const labels = scopes
		.filter(s => selections[s.key])
		.map(s => ({key: s.key, value: selections[s.key]}));

	if (labels.length === 0)
		return <div className={'card-list__item-meta'}>{props.emptyMessage ?? 'No scopes'}</div>;

	return <div className={'tags'}>
		{labels.map(s => <span key={s.key} className={'tag'}>{s.key}: {s.value}</span>)}
	</div>;
};
