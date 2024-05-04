import * as React from 'react';
import {ComponentSync} from '../../core/ComponentSync';
import {exists, ResolvableContent, resolveContent, RuntimeModules} from '@nu-art/ts-common';
import {DataStatus} from '../../core/db-api-gen/consts';
import './AwaitModules.scss';
import {ModuleFE_BaseDB} from '../../modules/db-api-gen/ModuleFE_BaseDB';
import {ThunderDispatcher} from '../../core/thunder-dispatcher';
import {ModuleFE_SyncManager} from '../../modules/sync-manager/ModuleFE_SyncManager';
import {LL_H_C, LL_V_L} from '../Layouts/Layouts';
import {TS_ProgressBar} from '../TS_ProgressBar/TS_ProgressBar';
import {OnSyncStatusChangedListener} from '../../core/db-api-gen/types';
import {ModuleSyncType} from '../../modules/db-api-gen/types';


type Props = React.PropsWithChildren<{
	modules: ResolvableContent<(ModuleFE_BaseDB<any>)[]>;
	customLoader?: ResolvableContent<React.ReactNode, [AwaitModule_LoaderProps]>;
}>;

type State = {
	validModules: (ModuleFE_BaseDB<any>)[];
	readyModules: (ModuleFE_BaseDB<any>)[];
	awaiting: boolean;
};

export type AwaitModule_LoaderProps = {
	validModules: (ModuleFE_BaseDB<any>)[];
	readyModules: (ModuleFE_BaseDB<any>)[];
	awaitedModules: (ModuleFE_BaseDB<any>)[];
}

interface QueryAwaitedModules {
	__queryAwaitedModule(): (ModuleFE_BaseDB<any>)[];
}

export const dispatch_QueryAwaitedModules = new ThunderDispatcher<QueryAwaitedModules, '__queryAwaitedModule'>('__queryAwaitedModule');

export class AwaitModules
	extends ComponentSync<Props, State>
	implements OnSyncStatusChangedListener<any>, QueryAwaitedModules {

	// ######################### Life Cycle #########################

	__onSyncStatusChanged(module: ModuleFE_BaseDB<any, any>): void {
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
			const validModule = RuntimeModules().includes(module) && exists(module.dbDef);
			if (!validModule)
				this.logWarning(`AwaitModules awaits for module ${module.getName()}, but it isn't a collection module!`);

			return validModule;
		});

		//Collect ready modules
		state.readyModules = state.validModules.filter(module => module.getDataStatus() === DataStatus.ContainsData);

		// Set awaiting true if not all valid modules are ready
		state.awaiting = state.validModules.length !== state.readyModules.length;
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

		return this.state.validModules.filter(module => module.syncType === ModuleSyncType.APISync && !permissibleModules.includes(module.dbDef.dbKey));
	};

	// ######################### Render #########################

	protected renderMissingPermissions = () => {
		const missingPermissionModules = this.getMissingPermissionModules();
		return <div className={'ts-await-modules'}>
			<LL_V_L className={'missing-permission-modules'}>
				<h1>Missing Permissions For The Following Databases</h1>
				<LL_H_C>
					{missingPermissionModules.map(module => <span key={module.dbDef.dbKey}>{module.dbDef.entityName}</span>)}
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
				awaitedModules
			});
		}

		//Calculate Ratios
		const relevantInProgressModules = ModuleFE_SyncManager.getCurrentlySyncingModules()
			.filter(module => this.state.validModules.includes(module as ModuleFE_BaseDB<any>));
		const readyAndInProgressModulesRatio = (relevantInProgressModules.length + this.state.readyModules.length) / this.state.validModules.length;
		const readyModulesRatio = this.state.readyModules.length / this.state.validModules.length;

		return <TS_ProgressBar
			className={'ts-await-modules'}
			type={'radial'}
			radius={10}
			ratios={[
				readyAndInProgressModulesRatio,
				readyModulesRatio
			]}
			onClick={() => {
				if (!awaitedModules.length)
					this.logInfo('Not awaiting any modules');
				this.logInfo('Waiting for modules:', ...awaitedModules.map(module => module.getName()));
			}}
		/>;
	};

	render() {
		if (this.getMissingPermissionModules().length)
			return this.renderMissingPermissions();

		if (this.state.awaiting)
			return this.renderLoader();

		return this.props.children;
	}
}