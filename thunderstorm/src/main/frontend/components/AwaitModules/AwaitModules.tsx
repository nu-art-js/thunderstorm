import * as React from 'react';
import {ComponentSync} from '../../core/ComponentSync';
import {DB_Object, exists, ResolvableContent, resolveContent, RuntimeModules} from '@nu-art/ts-common';
import {ModuleFE_BaseDB} from '../../modules/db-api-gen/ModuleFE_BaseDB';
import {OnSyncStatusChangedListener} from '../../core/db-api-gen/types';
import {DataStatus} from '../../core/db-api-gen/consts';
import './AwaitModules.scss';
import {ModuleFE_v3_BaseDB} from '../../modules/db-api-gen/ModuleFE_v3_BaseDB';
import {ThunderDispatcher} from '../../core/thunder-dispatcher';


type Props = React.PropsWithChildren<{
	modules: ResolvableContent<(ModuleFE_BaseDB<any> | ModuleFE_v3_BaseDB<any>)[]>;
	customLoader?: ResolvableContent<React.ReactNode>;
}>;

type State = {
	awaiting: boolean;
};

interface QueryAwaitedModules {
	__queryAwaitedModule(): (ModuleFE_BaseDB<any> | ModuleFE_v3_BaseDB<any>)[];
}

export const dispatch_QueryAwaitedModules = new ThunderDispatcher<QueryAwaitedModules, '__queryAwaitedModule'>('__queryAwaitedModule');

export class AwaitModules
	extends ComponentSync<Props, State>
	implements OnSyncStatusChangedListener<DB_Object>, QueryAwaitedModules {

	shouldComponentUpdate(): boolean {
		return true;
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

	__onSyncStatusChanged(module: ModuleFE_BaseDB<DB_Object, any>): void {
		this.logVerbose(`__onSyncStatusChanged: ${module.getCollectionName()}`);
		const modules = resolveContent(this.props.modules);
		if (modules.includes(module))
			this.reDeriveState();
	}

	protected deriveStateFromProps(nextProps: Props, state: State) {
		state.awaiting ??= true;
		//Check if all modules have data
		const modules = resolveContent(nextProps.modules).filter(module => {
			const validModule = RuntimeModules().includes(module) && exists(module.dbDef);
			if (!validModule)
				this.logWarning(`AwaitModules awaits for module ${module.getName()}, but it isn't a collection module!`);

			return validModule;
		});

		// if there aren't non-ready modules, this component is ready to be shown
		if (!modules.some(module => module.getDataStatus() !== DataStatus.ContainsData))
			state.awaiting = false;

		return state;
	}

	protected getUnpreparedModules(): (ModuleFE_BaseDB<any> | ModuleFE_v3_BaseDB<any>)[] {
		const modules = resolveContent(this.props.modules);
		return modules?.filter(module => module.getDataStatus() !== DataStatus.ContainsData) || [];
	}

	render() {
		if (!this.state.awaiting)
			return this.props.children;

		if (this.props.customLoader)
			return resolveContent(this.props.customLoader);

		return <div className={'ts-await-modules-loader'} onClick={() => {
			const awaitedModules = this.getUnpreparedModules().map(module => module.getName());
			if (!awaitedModules.length)
				this.logInfo('Not awaiting any modules');
			this.logInfo('Waiting for modules:', ...awaitedModules);
		}}/>;
	}
}