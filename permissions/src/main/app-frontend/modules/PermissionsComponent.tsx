import * as React from "react";
import {BaseComponent} from "@nu-art/thunderstorm/frontend";
import {
	OnPermissionsChanged,
	PermissionsFE
} from "./PermissionsModuleFE";

type Props = {
	url: string
	loadingComponent: React.ComponentType
	fallback?: React.ComponentType
}

type State = {
	loaded: boolean
}

export class PermissionsComponent
	extends BaseComponent<Props, State>
	implements OnPermissionsChanged {

	static defaultProps = {
		loadingComponent: () => <>Loading</>
	};

	constructor(props: Props) {
		super(props);
		this.state = {
			loaded: false
		};
	}

	__onPermissionsChanged() {
		this.setState({loaded: true});
	}

	render() {
		if (!this.state.loaded)
			return <this.props.loadingComponent/>;

		const {url} = this.props;
		if (PermissionsFE.doesUserHavePermissions(url))
			return <>{this.props.children}</>;

		if (this.props.fallback)
			return <this.props.fallback/>;

		return null;
	}

}