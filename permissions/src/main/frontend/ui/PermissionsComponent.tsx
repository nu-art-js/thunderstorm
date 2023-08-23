import * as React from 'react';
import {OnPermissionsChanged, ModuleFE_Permissions} from '../modules/ModuleFE_Permissions';
import {SmartComponent} from '@nu-art/thunderstorm/frontend';
import {ModuleFE_PermissionsAccessLevel} from '../modules/manage/ModuleFE_PermissionsAccessLevel';
import {PermissionKey_FE} from '../PermissionKey_FE';


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

	__onPermissionsChanged() {
		this.forceUpdate();
	}

	render() {
		const permitted = ModuleFE_Permissions.canAccess(this.props.key);
		if (permitted === undefined)
			return this.props.loadingComponent ? <this.props.loadingComponent/> : null;

		if (permitted)
			return <>{this.props.children}</>;

		if (this.props.fallback)
			return <this.props.fallback/>;

		return null;
	}
}