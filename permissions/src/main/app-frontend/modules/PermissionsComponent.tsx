import * as React from "react";
import {BaseComponent} from "@nu-art/thunderstorm/frontend";
import {
	OnPermissionsChanged,
	PermissionsFE
} from "./PermissionsModuleFE";

type Props = {
	url: string
	fallback?: React.ComponentType
}

type State = {
	hasPermissions: false
}

export class PermissionsComponent
	extends BaseComponent<Props, State>
	implements OnPermissionsChanged {

	__onPermissionsChanged() {
		this.forceUpdate();
	}

	render() {
		const {url} = this.props;
		if (PermissionsFE.doesUserHavePermissions(url))
			return <>{this.props.children}</>;

		if(this.props.fallback)
			return <this.props.fallback />

		return null;
	}
}