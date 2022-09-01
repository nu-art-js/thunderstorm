import * as React from 'react';
import {OnPermissionsChanged, ModuleFE_Permissions} from './ModuleFE_Permissions';

type Props = {
	url: string
	loadingComponent?: React.ComponentType
	fallback?: React.ComponentType
}

export class PermissionsComponent
	extends React.Component<Props>
	implements OnPermissionsChanged {

	__onPermissionsChanged() {
		this.forceUpdate();
	}

	render() {
		const {url} = this.props;
		const permitted = ModuleFE_Permissions.doesUserHavePermissions(url);
		if (permitted === undefined)
			return this.props.loadingComponent ? <this.props.loadingComponent/> : null;

		if (permitted)
			return <>{this.props.children}</>;

		if (this.props.fallback)
			return <this.props.fallback/>;

		return null;
	}
}