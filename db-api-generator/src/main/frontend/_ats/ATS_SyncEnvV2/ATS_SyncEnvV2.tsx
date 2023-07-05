import {
	AppToolsScreen,
	ComponentSync,
	genericNotificationAction,
	LL_H_C,
	LL_V_L,
	SimpleListAdapter,
	Thunder,
	TS_AppTools,
	TS_BusyButton,
	TS_Checkbox,
	TS_CollapsableContainer,
	TS_DropDown,
	TS_Input,
	TS_PropRenderer
} from '@nu-art/thunderstorm/frontend';
import * as React from 'react';
import './ATS_SyncEnvV2.scss';
import {ModuleFE_BaseDB} from '../../modules/ModuleFE_BaseDB';
import {filterKeys} from '@nu-art/ts-common';
import {ModuleFE_SyncEnvV2} from '../../modules/ModuleFE_SyncEnvV2';


type Env = 'prod' | 'staging' | 'dev' | 'local';

type State = {
	envList: Env[];
	selectedEnv?: Env;
	backupId?: string;
	onlyModules: Set<string>;
	excludedModules: Set<string>;
	backingUpInProgress?: boolean
}

export class ATS_SyncEnvironmentV2
	extends ComponentSync<{}, State> {

	static screen: AppToolsScreen = {
		name: 'Sync Environment V2',
		key: 'sync-environment-v2',
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
			await ModuleFE_SyncEnvV2.vv1.fetchFromEnv(filterKeys({
				env: this.state.selectedEnv!,
				backupId: this.state.backupId!,
				onlyModules: (this.state.onlyModules.size > 0 && Array.from(this.state.onlyModules)) || undefined,
				excludedModules: Array.from(this.state.excludedModules),
			}, 'onlyModules')).executeSync();
		}, 'Syncing Env');
	};

	private createNewBackup = async () => {
		return genericNotificationAction(async () => {
			this.setState({backingUpInProgress: true}, async () => {
				const toRet = await ModuleFE_SyncEnvV2.vv1.createBackup({}).executeSync();
				this.setState({backingUpInProgress: false});
				return toRet;
			});
		}, 'Create Backup');
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
			<LL_H_C>{TS_AppTools.renderPageHeader('Sync Environment V2')}<TS_BusyButton onClick={this.createNewBackup}>Trigger Backup</TS_BusyButton></LL_H_C>
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