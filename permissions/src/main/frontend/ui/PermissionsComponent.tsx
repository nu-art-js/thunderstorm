import * as React from 'react';
import {Props_SmartComponent, SmartComponent, State_SmartComponent} from '@nu-art/thunderstorm/frontend';
import {ModuleFE_PermissionsAccessLevel} from '../modules/manage/ModuleFE_PermissionsAccessLevel';
import {PermissionKey_FE} from '../PermissionKey_FE';
import {ModuleFE_PermissionsAssert, OnPermissionsChanged} from '../modules/ModuleFE_PermissionsAssert';


type Props = React.PropsWithChildren<{
	key: PermissionKey_FE<string>
	loadingComponent?: React.ComponentType
	fallback?: React.ComponentType
}>;

export class PermissionsComponent
	extends SmartComponent<Props>
	implements OnPermissionsChanged {

	static defaultProps = {
		modules: [ModuleFE_PermissionsAccessLevel]
	};

	protected async deriveStateFromProps(nextProps: Props_SmartComponent & Props, state: State_SmartComponent) {
		return state;
	}

	__onPermissionsChanged() {
		this.forceUpdate();
	}

	render() {
		const permitted = ModuleFE_PermissionsAssert.canAccess(this.props.key);
		if (permitted === undefined)
			return this.props.loadingComponent ? <this.props.loadingComponent/> : null;

		if (permitted)
			return <>{this.props.children}</>;

		if (this.props.fallback)
			return <this.props.fallback/>;

		return null;
	}
}