import * as React from 'react';
import {ComponentSync} from '../../core/ComponentSync';
import {DB_Object, exists, ResolvableContent, resolveContent} from '@nu-art/ts-common';
import {ModuleFE_BaseDB} from '../../modules/db-api-gen/ModuleFE_BaseDB';
import {OnSyncStatusChangedListener} from '../../core/db-api-gen/types';
import {DataStatus} from '../../core/db-api-gen/consts';
import './AwaitModules.scss';
import {Thunder} from '../../core/Thunder';
import {ModuleFE_v3_BaseDB} from '../../modules/db-api-gen/ModuleFE_v3_BaseDB';


type Props = React.PropsWithChildren<{
	modules: ResolvableContent<(ModuleFE_BaseDB<any> | ModuleFE_v3_BaseDB<any>)[]>;
	customLoader?: ResolvableContent<React.ReactNode>;
}>;

type State = {
	awaiting: boolean;
};

export class AwaitModules
	extends ComponentSync<Props, State>
	implements OnSyncStatusChangedListener<DB_Object> {

	shouldComponentUpdate(): boolean {
		return true;
	}

	constructor(props: Props) {
		super(props);
		const missingModules = resolveContent(this.props.modules).filter(module => !Thunder.getInstance().modules.includes(module));
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
		const modules = resolveContent(nextProps.modules).filter(module => Thunder.getInstance().modules.includes(module) && exists(module.dbDef));
		if (modules.every(module => module.getDataStatus() === DataStatus.ContainsData))
			state.awaiting = false;

		return state;
	}

	render() {
		if (!this.state.awaiting)
			return this.props.children;

		if (this.props.customLoader)
			return resolveContent(this.props.customLoader);

		return <div className={'ts-await-modules-loader'} onClick={() => {
			this.logWarning(`Waiting for modules: ${resolveContent(this.props.modules).filter(module => module.getDataStatus() !== DataStatus.ContainsData)
				.map(module => module.getName())}`);
		}}/>;
	}
}