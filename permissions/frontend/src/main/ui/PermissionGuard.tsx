/*
 * Permissions management system
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import * as React from 'react';
import {ComponentSync} from '@nu-art/thunder-widgets';
import {ModuleFE_PermissionsAssert} from '../modules/ModuleFE_PermissionsAssert.js';
import type {PermissionScope} from '@nu-art/permissions-shared';
import {type OnUserPermissionsUpdated} from '../_entity/user-permissions/ModuleFE_UserPermissions.js';

type Props = {
	scope: PermissionScope;
	value: string;
	fallback?: React.ReactNode;
	children: React.ReactNode;
};

/**
 * Conditionally renders children based on the current user's materialized scope permissions.
 * Re-renders when UserPermissions sync or fetchMyPermissions completes.
 *
 * Usage:
 *   <PermissionGuard scope={PermissionScope_MyConcept} value="write">
 *     <MyProtectedComponent />
 *   </PermissionGuard>
 */
export class PermissionGuard
	extends ComponentSync<Props>
	implements OnUserPermissionsUpdated {

	__onUserPermissionsUpdated = () => this.forceUpdate();

	render() {
		if (!ModuleFE_PermissionsAssert.hasScopeAccess(this.props.scope, this.props.value))
			return <>{this.props.fallback ?? null}</>;

		return <>{this.props.children}</>;
	}
}
