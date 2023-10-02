import * as React from 'react';
import {Props_SmartComponent, SmartComponent, State_SmartComponent} from '@nu-art/thunderstorm/frontend';
import {ModuleFE_PermissionsAccessLevel} from '../modules/manage/ModuleFE_PermissionsAccessLevel';
import {PermissionKey_FE} from '../PermissionKey_FE';
import {AccessLevel, OnPermissionsChanged} from '../modules/ModuleFE_PermissionsAssert';


export type Props_PermissionComponent = React.PropsWithChildren<{
	permissionKey: PermissionKey_FE
	loadingComponent?: React.ComponentType
	fallback?: React.ComponentType
}> & Props_SmartComponent;

export type State_PermissionComponent = State_SmartComponent

export class PermissionsComponent<P extends Props_PermissionComponent = Props_PermissionComponent, S extends State_PermissionComponent = State_PermissionComponent>
	extends SmartComponent<P>
	implements OnPermissionsChanged {

	static defaultProps = {
		modules: [ModuleFE_PermissionsAccessLevel]
	};

	shouldComponentUpdate(nextProps: Readonly<Props_SmartComponent & P>, nextState: Readonly<State_SmartComponent>, nextContext: any): boolean {
		return true;
	}

	protected async deriveStateFromProps(nextProps: Props_PermissionComponent, state: State_PermissionComponent) {
		return state;
	}

	protected renderLoader = () => {
		return <></>;
	};

	__onPermissionsChanged() {
		this.forceUpdate();
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
		if (Fallback)
			return <Fallback/>;

		return null;
	};

	render() {
		const permitted = this.props.permissionKey.getAccessLevel();
		if (permitted === AccessLevel.Undefined) {
			this.logError(`${this.props.permissionKey.key} access undefined`);
			return this.renderWaitingOnPermissions();
		}
		if (permitted === AccessLevel.HasAccess) {
			this.logError(`${this.props.permissionKey.key} access granted`);
			return this.renderPermitted();
		}
		this.logError(`${this.props.permissionKey.key} access denied`);

		return this.renderFallback();
	}
}

export const RoutePermissions = (permissionKey: PermissionKey_FE<any>) => () => permissionKey.getAccessLevel() === AccessLevel.HasAccess;