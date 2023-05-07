import {
	AppToolsScreen,
	ComponentSync,
	genericNotificationAction,
	LL_H_C,
	SimpleListAdapter,
	TS_AppTools,
	TS_BusyButton,
	TS_DropDown,
	TS_Input,
	TS_PropRenderer
} from '@nu-art/thunderstorm/frontend';
import * as React from 'react';
import './ATS_SyncEnv.scss';
import {ModuleFE_SyncEnv} from '../../modules/ModuleFE_SyncEnv';

type Env = 'prod' | 'staging' | 'dev';

type State = {
	envList: Env[];
	selectedEnv?: Env;
	backupId?: string;
	onlyModules?: string[];
	excludedModules?: string[];
}

export class ATS_SyncEnvironment
	extends ComponentSync<{}, State> {

	static screen: AppToolsScreen = {name: 'Sync Environment', key: 'sync-environment', renderer: this, group: 'TS Dev Tools'};

	protected deriveStateFromProps(nextProps: {}, state: State) {
		state ??= this.state ? {...this.state} : {} as State;
		state.envList ??= ['prod', 'staging', 'dev'];
		state.excludedModules ??= ['users', 'user-account--accounts', 'user-account--sessions'];
		return state;
	}

	private syncEnv = async () => {
		if (!this.canSync())
			return;
		genericNotificationAction(async () => {
			await ModuleFE_SyncEnv.vv1.fetchFromEnv({
				env: this.state.selectedEnv!,
				backupId: this.state.backupId!,
				onlyModules: this.state.onlyModules,
				excludedModules: this.state.excludedModules,
			}).executeSync();
		}, 'Syncing Env');
	};

	private canSync = () => {
		return !!this.state.selectedEnv && !!this.state.backupId;
	};

	render() {
		const envAdapter = SimpleListAdapter(this.state.envList, item => <div className={'node-data'}>{item.item}</div>);
		return <div className={'sync-env-page'}>
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
					<TS_Input type={'text'} value={this.state.backupId} onChange={val => this.setState({backupId: val})}/>
				</TS_PropRenderer.Vertical>

				<TS_BusyButton
					onClick={this.syncEnv}
					disabled={!this.canSync()}
				>Sync</TS_BusyButton>
			</LL_H_C>
		</div>;
	}
}