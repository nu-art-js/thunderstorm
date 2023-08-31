import * as React from 'react';
import {Props_SmartComponent, SmartComponent, State_SmartComponent} from '@nu-art/thunderstorm/frontend';
import {ModuleFE_PermissionsAccessLevel} from '../modules/manage/ModuleFE_PermissionsAccessLevel';
import {PermissionKey_FE} from '../PermissionKey_FE';
import {AccessLevel, ModuleFE_PermissionsAssert, OnPermissionsChanged} from '../modules/ModuleFE_PermissionsAssert';


export type Props_PermissionComponent = React.PropsWithChildren<{
	permissionKey: PermissionKey_FE
	loadingComponent?: React.ComponentType
	fallback?: React.ComponentType
}> & Props_SmartComponent;

type State = State_SmartComponent

export class PermissionsComponent<P extends Props_PermissionComponent = Props_PermissionComponent>
	extends SmartComponent<P>
	implements OnPermissionsChanged {

	static defaultProps = {
		modules: [ModuleFE_PermissionsAccessLevel]
	};

	protected async deriveStateFromProps(nextProps: Props_PermissionComponent, state: State) {
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
		const permitted = ModuleFE_PermissionsAssert.canAccess(this.props.permissionKey);
		if (permitted === AccessLevel.Undefined)
			return this.renderWaitingOnPermissions();

		if (permitted === AccessLevel.HasAccess)
			return this.renderPermitted();

		return this.renderFallback();
	}
}