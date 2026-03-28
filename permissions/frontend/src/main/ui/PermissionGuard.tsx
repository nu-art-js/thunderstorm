/*
 * Permissions management system
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import * as React from 'react';
import {ModuleFE_PermissionsAssert} from '../modules/ModuleFE_PermissionsAssert.js';
import type {PermissionScope} from '@nu-art/permissions-shared';

type Props = {
	scope: PermissionScope;
	value: string;
	fallback?: React.ReactNode;
	children: React.ReactNode;
};

/**
 * Conditionally renders children based on the current user's scope permissions.
 * Reads scopeEntries from the JWT session — same PermissionScope used on backend.
 *
 * Usage:
 *   <PermissionGuard scope={PermissionScope_Topics} value="write">
 *     <TopicEditor />
 *   </PermissionGuard>
 */
export const PermissionGuard: React.FC<Props> = ({scope, value, fallback, children}) => {
	if (!ModuleFE_PermissionsAssert.hasScopeAccess(scope, value))
		return <>{fallback ?? null}</>;

	return <>{children}</>;
};
