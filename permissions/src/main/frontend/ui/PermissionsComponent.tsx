import * as React from 'react';
import {AwaitModules, ComponentSync, ModuleFE_AppConfig, ModuleFE_BaseDB} from '@nu-art/thunderstorm/frontend';
import {PermissionKey_FE} from '../PermissionKey_FE';
import {AccessLevel} from '../modules/ModuleFE_PermissionsAssert';

export const RoutePermissions = (permissionKey: PermissionKey_FE<any>) => () => permissionKey.getAccessLevel() === AccessLevel.HasAccess;

export type Props_PermissionComponent = React.PropsWithChildren<{
	permissionKey: PermissionKey_FE
	loadingComponent?: React.ComponentType
	fallback?: React.ComponentType
}>;

export class PermissionsComponent<P extends Props_PermissionComponent = Props_PermissionComponent, S extends {} = {}>
	extends ComponentSync<P, S> {

	// ######################## Static ########################

	static defaultProps = {
		modules: [ModuleFE_AppConfig]
	};

	// ######################## Lifecycle ########################

	shouldComponentUpdate(nextProps: Readonly<P>, nextState: Readonly<S>, nextContext: any): boolean {
		return true;
	}

	// ######################## Render ########################

	protected renderLoader = () => {
		return <></>;
	};

	protected renderWaitingOnPermissions = () => {
		const Loader = this.props.loadingComponent as React.ComponentType;
		return Loader ? <Loader/> : null;
	};

	protected renderPermitted = () => {
		return <>{this.props.children}</>;
	};

	protected renderFallback = () => {
		const Fallback = this.props.fallback as React.ComponentType;
		if (Fallback)
			return <Fallback/>;

		return null;
	};

	private renderImpl = () => {
		const permitted = this.props.permissionKey.getAccessLevel();
		if (permitted === AccessLevel.Undefined)
			return this.renderWaitingOnPermissions();

		if (permitted === AccessLevel.HasAccess)
			return this.renderPermitted();

		return this.renderFallback();
	};

	render() {
		return <AwaitModules modules={[ModuleFE_AppConfig] as ModuleFE_BaseDB<any>[]}>
			{this.renderImpl()}
		</AwaitModules>;
	}
}

