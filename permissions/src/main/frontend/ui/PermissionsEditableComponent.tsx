import * as React from 'react';
import {PermissionsComponent, Props_PermissionComponent} from './PermissionsComponent';

type Props = Props_PermissionComponent & {
	forceLock?: boolean;
	value: string | number
};

export class PermissionsEditableComponent
	extends PermissionsComponent<Props> {

	protected renderFallback = () => {
		return <div className={'permissions-editable__value'}>{this.props.value}</div>;
	};

	protected renderPermitted = () => {
		if (this.props.forceLock)
			return this.renderFallback();

		return <>{this.props.children}</>;
	};
}