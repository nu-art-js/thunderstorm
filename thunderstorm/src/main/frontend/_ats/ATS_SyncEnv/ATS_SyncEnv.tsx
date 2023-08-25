import * as React from 'react';
import './ATS_SyncEnv.scss';
import {filterKeys} from '@nu-art/ts-common';
import {ComponentSync, Thunder} from '../../core';
import {AppToolsScreen, TS_AppTools} from '../../components/TS_AppTools';
import {genericNotificationAction} from '../../components/TS_Notifications';
import {ModuleFE_SyncEnv} from '../../modules/sync-env/ModuleFE_SyncEnv';
import {ModuleFE_BaseDB} from '../../modules/db-api-gen/ModuleFE_BaseDB';
import {LL_H_C, LL_V_L} from '../../components/Layouts';
import {TS_Checkbox} from '../../components/TS_Checkbox';
import {SimpleListAdapter} from '../../components/adapter/Adapter';
import {TS_PropRenderer} from '../../components/TS_PropRenderer';
import {TS_DropDown} from '../../components/TS_Dropdown';
import {TS_Input} from '../../components/TS_Input';
import {TS_BusyButton} from '../../components/TS_BusyButton';
import {TS_CollapsableContainer} from '../../components/TS_CollapsableContainer';

type Env = 'prod' | 'staging' | 'dev' | 'local';

type State = {
	envList: Env[];
	selectedEnv?: Env;
	backupId?: string;
	onlyModules: Set<string>;
	excludedModules: Set<string>;
}

export class ATS_SyncEnvironment
	extends ComponentSync<{}, State> {

	static screen: AppToolsScreen = {
		name: 'Sync Environment',
		key: 'sync-environment',
		renderer: this,
		group: 'TS Dev Tools'
	};

	protected deriveStateFromProps(nextProps: {}, state: State) {
		state ??= this.state ? {...this.state} : {} as State;
		state.envList ??= ['prod', 'staging', 'dev', 'local'];
		if (!state.excludedModules) {
			state.excludedModules = new Set<string>();
			['user-account--accounts', 'user-account--sessions'].forEach(name => state.excludedModules.add(name));
		}
		if (!state.onlyModules)
			state.onlyModules = new Set<string>();
		return state;
	}

	private syncEnv = async () => {
		if (!this.canSync())
			return;
		await genericNotificationAction(async () => {
			await ModuleFE_SyncEnv.vv1.fetchFromEnv(filterKeys({
				env: this.state.selectedEnv!,
				backupId: this.state.backupId!,
				onlyModules: (this.state.onlyModules.size > 0 && Array.from(this.state.onlyModules)) || undefined,
				excludedModules: Array.from(this.state.excludedModules),
			}, 'onlyModules')).executeSync();
		}, 'Syncing Env');
	};

	private canSync = () => {
		return !!this.state.selectedEnv && !!this.state.backupId;
	};

	private getCollectionModuleList = (): string[] => {
		return (Thunder.getInstance().filterModules((module) => {
			//the moduleKey in ModuleBE_BaseDB's config is taken from collection's name.
			return module instanceof ModuleFE_BaseDB && (module as ModuleFE_BaseDB<any>).getCollectionName() !== undefined;
		}) as ModuleFE_BaseDB<any>[]).map(module => module.getCollectionName()).sort();
	};

	private renderOnlyModulesSelection = () => {
		const moduleNames: string[] = this.getCollectionModuleList();

		return <>
			<LL_H_C className={'sync-env_modules-list'}>
				{moduleNames.map(name => <TS_Checkbox
					key={name}
					checked={this.state.onlyModules?.has(name)}
					onCheck={() => {
						if (this.state.onlyModules.has(name))
							this.state.onlyModules.delete(name);
						else
							this.state.onlyModules.add(name);
						this.forceUpdate();
					}}>{name}</TS_Checkbox>)}

			</LL_H_C>
		</>;
	};

	private renderExcludedModulesSelection = () => {
		const moduleNames: string[] = this.getCollectionModuleList();

		return <>
			<LL_H_C className={'sync-env_modules-list'}>
				{moduleNames.map(name => <TS_Checkbox
					key={name}
					checked={this.state.excludedModules.has(name)}
					onCheck={() => {
						if (this.state.excludedModules.has(name))
							this.state.excludedModules.delete(name);
						else
							this.state.excludedModules.add(name);
						this.forceUpdate();
					}}>{name}</TS_Checkbox>)}

			</LL_H_C>
		</>;
	};

	render() {
		const envAdapter = SimpleListAdapter(this.state.envList, item => <div
			className={'node-data'}>{item.item}</div>);
		return <LL_V_L className={'sync-env-page'}>
			{TS_AppTools.renderPageHeader('Sync Environment')}
			<LL_H_C className={'sync-env-page__main'}>
				<TS_PropRenderer.Vertical label={'Environment'}>
					<TS_DropDown
						placeholder={'Select Environment'}
						className={'fancy'}
						adapter={envAdapter}
						onSelected={env => this.setState({selectedEnv: env})}
						selected={this.state.selectedEnv}
						canUnselect={true}
					/>
				</TS_PropRenderer.Vertical>

				<TS_PropRenderer.Vertical label={'Backup ID'}>
					<TS_Input type={'text'} value={this.state.backupId}
							  onChange={val => this.setState({backupId: val})}/>
				</TS_PropRenderer.Vertical>

				<TS_BusyButton
					onClick={this.syncEnv}
					disabled={!this.canSync()}
				>Sync</TS_BusyButton>
			</LL_H_C>
			<TS_CollapsableContainer headerRenderer={TS_AppTools.renderPageHeader('Only Included Modules')}
									 containerRenderer={this.renderOnlyModulesSelection}/>
			<TS_CollapsableContainer headerRenderer={TS_AppTools.renderPageHeader('Excluded Modules')}
									 containerRenderer={this.renderExcludedModulesSelection}/>
		</LL_V_L>;
	}
}