import * as React from 'react';
import {PermissionsComponent, Props_PermissionComponent, State_PermissionComponent} from './PermissionsComponent';
import {_className} from '@nu-art/thunderstorm/frontend';
import {ResolvableContent, resolveContent} from '@nu-art/ts-common';

type Props = Props_PermissionComponent & {
	forceLock?: boolean;
	value?: ResolvableContent<React.ReactNode>;
	className?: string;
	style?: React.CSSProperties;
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
		if (!this.props.value)
			return <></>;

		const className = _className('permissions-editable__value', this.props.className);
		return <div className={className} style={this.props.style}>
			{resolveContent(this.props.value)}
		</div>;
	};

	protected renderPermitted = () => {
		if (this.props.forceLock)
			return this.renderFallback();

		return <>{this.props.children}</>;
	};
}