import * as React from 'react';
import {ComponentSync} from '@nu-art/thunderstorm/frontend';
import {OnPermissionsChanged, PermissionsFE} from './PermissionsModuleFE';

type Props = {
	url: string
	loadingComponent?: React.ComponentType
	fallback?: React.ComponentType
}

export class PermissionsComponent
	extends ComponentSync<Props>
	implements OnPermissionsChanged {

	protected deriveStateFromProps(nextProps: Props) {
		return {...nextProps};
	}

	__onPermissionsChanged() {
		this.forceUpdate();
	}

	render() {
		const {url} = this.props;
		const permitted = PermissionsFE.doesUserHavePermissions(url);
		if (permitted === undefined)
			return this.props.loadingComponent ? <this.props.loadingComponent/> : null;

		if (permitted)
			return <>{this.props.children}</>;

		if (this.props.fallback)
			return <this.props.fallback/>;

		return null;
	}
}