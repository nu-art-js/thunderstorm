import * as React from 'react';
import {PermissionsComponent, Props_PermissionComponent} from './PermissionsComponent';
import {_className} from '@nu-art/thunderstorm/frontend';
import {ResolvableContent, resolveContent} from '@nu-art/ts-common';

type Props = Props_PermissionComponent & {
	forceLock?: boolean;
	value?: ResolvableContent<React.ReactNode>;
	className?: string;
	style?: React.CSSProperties;
};

type State = {
	forceLock?: boolean;
};

export class PermissionsEditableComponent
	extends PermissionsComponent<Props, State> {

	protected deriveStateFromProps(nextProps: Props, state: State) {
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