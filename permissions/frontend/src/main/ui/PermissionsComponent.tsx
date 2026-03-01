import * as React from 'react';
import {ComponentSync} from '@nu-art/thunder-widgets';
import {PermissionKey_FE} from '../PermissionKey_FE.js';
import {AccessLevel} from '../modules/ModuleFE_PermissionsAssert.js';

export const RoutePermissions = (permissionKey: PermissionKey_FE<any>) => () => permissionKey.getAccessLevel() === AccessLevel.HasAccess;

export type Props_PermissionComponent = React.PropsWithChildren<{
	permissionKey: PermissionKey_FE
	loadingComponent?: React.ComponentType
	fallback?: React.ComponentType
}>;

/** Await-modules is up-level; render content directly. */
export class PermissionsComponent<P extends Props_PermissionComponent = Props_PermissionComponent, S extends {} = {}>
	extends ComponentSync<P, S> {

	shouldComponentUpdate(_nextProps: Readonly<P>, _nextState: Readonly<S>, _nextContext: unknown): boolean {
		return true;
	}

	protected renderWaitingOnPermissions = () => {
		const Loader = this.props.loadingComponent as React.ComponentType;
		return Loader ? <Loader/> : null;
	};

	protected renderPermitted = () => {
		return <>{this.props.children}</>;
	};

	protected renderFallback = () => {
		const Fallback = this.props.fallback as React.ComponentType;
		return Fallback ? <Fallback/> : null;
	};

	render() {
		const permitted = this.props.permissionKey.getAccessLevel();
		if (permitted === AccessLevel.Undefined)
			return this.renderWaitingOnPermissions();
		if (permitted === AccessLevel.HasAccess)
			return this.renderPermitted();
		return this.renderFallback();
	}
}

