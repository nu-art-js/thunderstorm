import * as React from 'react';
import {ComponentSync} from '../../core';
import {DB_Object, ResolvableContent, resolveContent} from '@nu-art/ts-common';
import {ModuleFE_BaseDB} from '../../modules/db-api-gen/ModuleFE_BaseDB';
import {OnSyncStatusChangedListener} from '../../core/db-api-gen/types';
import {DataStatus} from '../../core/db-api-gen/consts';
import './AwaitModules.scss';

type Props = React.PropsWithChildren<{
	modules: ResolvableContent<ModuleFE_BaseDB<any>[]>;
	customLoader?: ResolvableContent<React.ReactNode>;
}>;

type State = {
	awaiting: boolean;
};

export class AwaitModules
	extends ComponentSync<Props, State>
	implements OnSyncStatusChangedListener<DB_Object> {

	shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>, nextContext: any): boolean {
		return true;
	}

	__onSyncStatusChanged(module: ModuleFE_BaseDB<DB_Object, any>): void {
		this.logVerbose(`__onSyncStatusChanged: ${module.getCollectionName()}`);
		const modules = resolveContent(this.props.modules);
		if (modules?.includes(module))
			this.reDeriveState();
	}

	protected deriveStateFromProps(nextProps: Props, state: State) {
		state ??= this.state ? {...this.state} : {} as State;
		state.awaiting ??= true;

		//Check if all modules have data
		const modules = resolveContent(nextProps.modules);
		if (modules.every(module => module.getDataStatus() === DataStatus.ContainsData))
			state.awaiting = false;

		return state;
	}

	render() {
		if (this.state.awaiting)
			return this.props.customLoader
				? resolveContent(this.props.customLoader)
				: <div className={'ts-await-modules-loader'}/>;

		return this.props.children;
	}
}