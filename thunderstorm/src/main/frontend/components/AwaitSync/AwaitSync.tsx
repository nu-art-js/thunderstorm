import * as React from 'react';
import {ComponentSync} from '../../core/ComponentSync';
import {ResolvableContent, resolveContent} from '@nu-art/ts-common';
import {ModuleFE_SyncManagerV2, PermissibleModulesUpdated} from '../../modules/sync-manager/ModuleFE_SyncManagerV2';
import './AwaitSync.scss';

type Props = React.PropsWithChildren<{ customLoader?: ResolvableContent<React.ReactNode>; }>;

type State = {
	awaiting: boolean;
};

export class AwaitSync
	extends ComponentSync<Props, State>
	implements PermissibleModulesUpdated {

	__onPermissibleModulesUpdated = () => this.reDeriveState();

	shouldComponentUpdate(): boolean {
		return true;
	}

	protected deriveStateFromProps(nextProps: Props, state: State) {
		state.awaiting = !ModuleFE_SyncManagerV2.getPermissibleModuleNames();
		return state;
	}

	render() {
		if (!this.state.awaiting)
			return this.props.children;

		if (this.props.customLoader)
			return resolveContent(this.props.customLoader);

		return <div className={'ts-await-sync-loader'}/>;
	}
}