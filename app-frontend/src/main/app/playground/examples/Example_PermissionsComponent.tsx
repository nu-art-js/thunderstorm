import * as React from 'react';
import {PermissionsComponent} from "@intuitionrobotics/permissions/frontend";

export class Example_PermissionsComponent
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
