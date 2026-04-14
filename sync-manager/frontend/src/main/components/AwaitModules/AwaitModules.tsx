import * as React from 'react';
import {exists, ResolvableContent, resolveContent, RuntimeModules} from '@nu-art/ts-common';
import './AwaitModules.scss';
import {ComponentSync, LL_H_C, LL_V_L, TS_ProgressBar} from '@nu-art/thunder-widgets';
import {DataStatus, ModuleFE_BaseDB, RuntimeFE_ModulesAPI} from '@nu-art/db-api-frontend';
import {type OnSyncStatusChanged, type QueryAwaitedModules} from './dispatchers.js';
import {ModuleFE_SyncManager} from '../../modules/ModuleFE_SyncManager.js';

type Props = React.PropsWithChildren<{
	modules: ResolvableContent<(ModuleFE_BaseDB<any>)[]>;
	customLoader?: ResolvableContent<React.ReactNode, [
		AwaitModule_LoaderProps
	]>;
}>;

type State = {
	validModules: (ModuleFE_BaseDB<any>)[];
	readyModules: (ModuleFE_BaseDB<any>)[];
	ready: boolean;
};

export type AwaitModule_LoaderProps = {
	validModules: (ModuleFE_BaseDB<any>)[];
	readyModules: (ModuleFE_BaseDB<any>)[];
	awaitedModules: (ModuleFE_BaseDB<any>)[];
	onClick: VoidFunction;
};

export {dispatch_QueryAwaitedModules} from './dispatchers.js';

export class AwaitModules
	extends ComponentSync<Props, State>
	implements OnSyncStatusChanged, QueryAwaitedModules {

	// ######################### Life Cycle #########################
	__onSyncStatusChanged(module: ModuleFE_BaseDB<any>): void {
		this.logVerbose(`__onSyncStatusChanged: ${module.getCollectionName()}`);
		if (this.state.validModules.includes(module))
			this.reDeriveState();
	}

	__queryAwaitedModule() {
		return resolveContent(this.props.modules);
	}

	constructor(props: Props) {
		super(props);
		const missingModules = resolveContent(this.props.modules).filter(module => !RuntimeModules().includes(module));
		if (missingModules.length)
			this.logWarning('Trying to await modules which are not in the module pack:', missingModules);
	}

	shouldComponentUpdate(): boolean {
		return true;
	}

	protected deriveStateFromProps(nextProps: Props, state: State) {
		//Collect modules that are awaitable
		state.validModules ??= resolveContent(nextProps.modules).filter(module => {
			const validModule = RuntimeModules().includes(module) && exists(module.isInstanceOf(ModuleFE_BaseDB));
			if (!validModule)
				this.logWarning(`AwaitModules awaits for module ${module.getName()}, but it isn't a collection module!`);
			return validModule;
		});
		//Collect ready modules
		state.readyModules = state.validModules.filter(module => {
			return module.getDataStatus() === DataStatus.ContainsData || state.ready && module.getDataStatus() === DataStatus.UpdatingData;
		});
		// Set awaiting true if not all valid modules are ready
		state.ready = state.validModules.length === state.readyModules.length;
		return state;
	}

	// ######################### Logic #########################
	protected getUnpreparedModules(): (ModuleFE_BaseDB<any>)[] {
		return this.state.validModules.filter(module => !this.state.readyModules.includes(module));
	}

	private getMissingPermissionModules = () => {
		const permissibleModules = ModuleFE_SyncManager.getPermissibleModuleNames();
		if (!permissibleModules.length)
			return [];
		const apiModuleKeys = new Set(RuntimeFE_ModulesAPI().map(m => m.config.dbKey));
		return this.state.validModules.filter(module => apiModuleKeys.has(module.config.dbKey) && !permissibleModules.includes(module.config.dbKey));
	};
	// ######################### Render #########################
	protected renderMissingPermissions = () => {
		const missingPermissionModules = this.getMissingPermissionModules();
		return <div className={'ts-await-modules'}>
			<LL_V_L className={'missing-permission-modules'}>
				<h1>Missing Permissions For The Following Databases</h1>
				<LL_H_C>
					{missingPermissionModules.map(module => <span key={module.config.dbKey}>{module.config.dbConfig.name}</span>)}
				</LL_H_C>
			</LL_V_L>
		</div>;
	};

	private renderLoader = () => {
		const awaitedModules = this.getUnpreparedModules();
		if (this.props.customLoader) {
			return resolveContent(this.props.customLoader, {
				validModules: this.state.validModules,
				readyModules: this.state.readyModules,
				awaitedModules,
				onClick: this.onLoaderClick
			});
		}

		//Calculate Ratios
		const relevantInProgressModules = ModuleFE_SyncManager.getCurrentlySyncingModules()
			.filter(module => this.state.validModules.includes(module as ModuleFE_BaseDB<any>));
		const readyAndInProgressModulesRatio = (relevantInProgressModules.length + this.state.readyModules.length) / this.state.validModules.length;
		const readyModulesRatio = this.state.readyModules.length / this.state.validModules.length;
		return <TS_ProgressBar className={'ts-await-modules'} type={'radial'} radius={10} ratios={[
			readyAndInProgressModulesRatio,
			readyModulesRatio
		]} onClick={this.onLoaderClick}/>;
	};
	private onLoaderClick = () => {
		const awaitedModules = this.getUnpreparedModules();
		if (!awaitedModules.length)
			this.logInfo('Not awaiting any modules');
		this.logInfo('Waiting for modules:', ...awaitedModules.map(module => module.getName()));
	};

	render() {
		if (this.getMissingPermissionModules().length)
			return this.renderMissingPermissions();
		if (!this.state.ready)
			return this.renderLoader();
		return this.props.children;
	}
}
