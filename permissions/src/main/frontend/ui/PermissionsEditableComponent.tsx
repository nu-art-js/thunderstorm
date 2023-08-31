import * as React from 'react';
import {PermissionsComponent, Props_PermissionComponent, State_PermissionComponent} from './PermissionsComponent';

type Props = Props_PermissionComponent & {
	forceLock?: boolean;
	value: string | number
};

type State = State_PermissionComponent & {
	forceLock?: boolean;
};

export class PermissionsEditableComponent
	extends PermissionsComponent<Props, State> {

	protected async deriveStateFromProps(nextProps: Props, state: State): Promise<State_PermissionComponent> {
		state = await super.deriveStateFromProps(nextProps, state);
		state.forceLock = nextProps.forceLock;
		return state;
	}

	protected renderFallback = () => {
		return <div className={'permissions-editable__value'}>{this.props.value}</div>;
	};

	protected renderPermitted = () => {
		if (this.props.forceLock)
			return this.renderFallback();

		return <>{this.props.children}</>;
	};
}