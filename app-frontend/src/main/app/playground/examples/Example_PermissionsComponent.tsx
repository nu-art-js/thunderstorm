import * as React from 'react';
import {PermissionsComponent} from "@nu-art/permissions/app-frontend/modules/PermissionsComponent";

export class Example_PermissionsComponent extends React.Component {

	render() {
		return <PermissionsComponent url={"v1/blat/query"}
		                      fallback={() => <div>not allowed</div>}>
			<div>Example_PermissionsComponent</div>
		</PermissionsComponent>
	}

}
