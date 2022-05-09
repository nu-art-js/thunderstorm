import * as React from 'react';
import {PermissionsComponent} from "@nu-art/permissions/frontend";

export class Example_PermissionsComponent_Renderer
	extends React.Component {

	render() {
		return <PermissionsComponent
			url={"/v1/test/api"}
			fallback={() => <div>not allowed</div>}
			loadingComponent={() => <>Its loading</>}
		>
			<div>Example_PermissionsComponent</div>
		</PermissionsComponent>;
	}
}

export const Example_PermissionsComponent = {renderer: Example_PermissionsComponent_Renderer, name: 'Permissions Component'};