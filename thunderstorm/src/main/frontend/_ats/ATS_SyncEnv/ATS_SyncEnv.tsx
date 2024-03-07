import * as React from 'react';
import './ATS_SyncEnv.scss';
import {_keys, filterKeys, RuntimeModules, tsValidateResult, tsValidateUniqueId, TypedMap} from '@nu-art/ts-common';
import {AppToolsScreen, ATS_Fullstack, TS_AppTools} from '../../components/TS_AppTools';
import {genericNotificationAction} from '../../components/TS_Notifications';
import {ModuleFE_SyncEnvV2} from '../../modules/sync-env/ModuleFE_SyncEnvV2';
import {ModuleFE_BaseDB} from '../../modules/db-api-gen/ModuleFE_BaseDB';
import {LL_H_C, LL_V_L} from '../../components/Layouts';
import {TS_Checkbox} from '../../components/TS_Checkbox';
import {TS_Input} from '../../components/TS_Input';
import {DBModuleType, Response_FetchBackupMetadata} from '../../../shared';
import {ComponentSync} from '../../core/ComponentSync';
import {Thunder} from '../../core/Thunder';
import {TS_PropRenderer} from '../../components/TS_PropRenderer';
import {SimpleListAdapter} from '../../components/adapter/Adapter';
import {TS_BusyButton} from '../../components/TS_BusyButton';
import {TS_DropDown} from '../../components/TS_Dropdown';
import {_className} from '../../utils/tools';
import {TS_Loader} from '../../components/TS_Loader';
import {ModuleFE_BaseApi} from '../../modules/db-api-gen/ModuleFE_BaseApi';
import {StorageKey} from '../../modules/ModuleFE_LocalStorage';


type Env = 'prod' | 'staging' | 'dev' | 'local';

type ModuleMetadata = {
	local?: boolean
	remote?: boolean // Need to return existing modules from remote to show this boolean
	backup?: boolean
}

type State = {
	envList: Env[];
	selectedEnv?: Env;
	backupId?: string;
	selectedModules: Set<string>;
	moduleList: TypedMap<ModuleMetadata> //name, origin data like local-only, remote-only, from backup-only
	searchFilter: string;
	restoreTime?: string;
	backingUpInProgress?: boolean;
	fetchMetadataInProgress?: boolean;
	metadata?: Response_FetchBackupMetadata;
	selectAll: boolean
	selectedChunkSize: 2000 | 1000 | 500 | 200 | 100 | 50
}
const StorageKey_BackupId = new StorageKey<string>('sync-env--backup-id');

export class ATS_SyncEnvironment
	extends ComponentSync<{}, State> {

	static screen: AppToolsScreen = {
		name: 'Sync Environment',
		key: 'sync-environment',
		renderer: this,
		group: ATS_Fullstack
	};

	protected deriveStateFromProps(nextProps: {}, state: State) {
		state.envList ??= ['prod', 'staging', 'dev', 'local'];
		if (!state.selectedModules)
			state.selectedModules = new Set<string>();

		state.selectedChunkSize = 100;
		state.selectedEnv = 'prod';
		state.backupId = StorageKey_BackupId.get();
		//Add local module data
		state.moduleList = this.getCollectionModuleList().reduce<TypedMap<ModuleMetadata>>((toRet, name) => {
			toRet[name] = {local: true};
			return toRet;
		}, {});
		if (state.metadata) {
			state.metadata.collectionsData.forEach(moduleData => {
				state.moduleList[moduleData.collectionName] = {...state.moduleList[moduleData.collectionName], backup: true};
			});
			state.metadata.remoteCollectionNames.forEach(moduleName => {
				state.moduleList[moduleName] = {...state.moduleList[moduleName], remote: true};
			});
		}

		state.selectAll ??= true;

		if (state.selectAll) {
			(_keys(state.moduleList) as string[]).map(collectionName => state.selectedModules.add(collectionName));
		} else {
			(_keys(state.moduleList) as string[]).map(collectionName => state.selectedModules.delete(collectionName));
		}

		return state;
	}

	private fetchMetadata = async () => {
		if (!this.state.backupId?.length)
			return;

		if (!this.state.selectedEnv)
			return;

		this.setState({fetchMetadataInProgress: true});
		try {
			await genericNotificationAction(async () => {
				const metadata = await ModuleFE_SyncEnvV2.vv1.fetchBackupMetadata({
					env: this.state.selectedEnv!,
					backupId: this.state.backupId!,
				}).executeSync();

				this.reDeriveState({metadata: metadata});
			}, 'Fetching backup metadata');
		} catch (err: any) {
			this.logError(err);
		}
		this.setState({fetchMetadataInProgress: false});
	};

	private syncEnv = async () => {
		if (!this.canSync())
			return;

		const start = performance.now();
		await genericNotificationAction(async () => {
			await ModuleFE_SyncEnvV2.vv1.syncFromEnvBackup(filterKeys({
				env: this.state.selectedEnv!,
				backupId: this.state.backupId!,
				chunkSize: this.state.selectedChunkSize!,
				selectedModules: Array.from(this.state.selectedModules)
			}, 'selectedModules')).executeSync();
		}, 'Syncing Env');
		const end = performance.now();

		this.setState({restoreTime: `${((end - start) / 1000).toFixed(3)} seconds`});
	};

	private syncFirebase = async () => {
		if (!this.canSync())
			return;

		await genericNotificationAction(async () => {
			await ModuleFE_SyncEnvV2.vv1.syncFirebaseFromBackup({
				env: this.state.selectedEnv!,
				backupId: this.state.backupId!
			}).executeSync();
		}, 'Syncing Firebase');
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

	private getCollectionModuleList(): string[] {
		//the moduleKey in ModuleBE_BaseDB's config is taken from collection's name.
		return (RuntimeModules().filter<ModuleFE_BaseApi<any>>((module: DBModuleType) => !!module.dbDef?.dbKey)).map(_module => _module.dbDef.dbKey).sort();
	}

	private renderBackupModules = () => {
		return <>
			<LL_V_L className={'sync-env_modules-list-v2'}>
				<LL_H_C className={'utils'}>
					<TS_Checkbox
						checked={this.state.selectAll}
						onCheck={status => this.reDeriveState({selectAll: status})}
					>
						Select All
					</TS_Checkbox>
					<TS_Input onChange={val => this.setState({searchFilter: val})} type={'text'}
							  placeholder={'search collection'}/>
				</LL_H_C>
				{(_keys(this.state.moduleList) as string[]).map(name => {
					const collectionMetadata = this.state.metadata?.collectionsData.find(collection => collection.collectionName === name);

					if ((this.state.searchFilter && this.state.searchFilter.length) && !name.includes(this.state.searchFilter))
						return;

					const relevantLocalModules: ModuleFE_BaseDB<any>[] = RuntimeModules().filter((module: ModuleFE_BaseApi<any>) => {
						return (!!module.getCollectionName && module.getCollectionName() == collectionMetadata?.collectionName);
					});

					const localCount = relevantLocalModules.length === 1 && relevantLocalModules[0] ? relevantLocalModules[0].cache._array.length : 0;
					const diffCount = collectionMetadata?.numOfDocs !== undefined ? collectionMetadata.numOfDocs - localCount : undefined;
					const diffShow = diffCount !== 0 ? diffCount : undefined;

					return <TS_PropRenderer.Horizontal
						key={name}
						label={<LL_H_C className={'header'}>
							<TS_Checkbox
								checked={this.state.selectedModules.has(name)}
								onCheck={() => {
									if (this.state.selectedModules.has(name))
										this.state.selectedModules.delete(name);
									else
										this.state.selectedModules.add(name);

									let isAllSelected = true;
									if (this.state.selectedModules.size < _keys(this.state.moduleList).length)
										isAllSelected = false;

									this.setState({
										selectedModules: new Set<string>(Array.from(this.state.selectedModules)),
										selectAll: isAllSelected
									});
								}}
							/>
							<div>{name}</div>
						</LL_H_C>}>
						<LL_H_C className={'collection-row'}>
							<LL_H_C className={'backup-info'}>
								{diffShow !== undefined &&
                                    <div className={_className(diffShow > 0 ? 'higher' : 'lower')}>
										{`${diffShow > 0 ? '+' : ''}${diffShow}`}</div>}
								<div>{collectionMetadata?.numOfDocs !== undefined ? collectionMetadata?.numOfDocs : '--'}</div>
								|
								<div className={'left-row'}>{collectionMetadata?.version || '--'}</div>
							</LL_H_C>
							<div
								style={{fontFamily: 'monospace'}}>{`${this.state.moduleList[name].local ? 'L' : '-'}${this.state.moduleList[name].remote ? 'R' : '-'}${this.state.moduleList[name].backup ? 'B' : '-'}`}</div>
						</LL_H_C>
					</TS_PropRenderer.Horizontal>;
				})}

			</LL_V_L>
		</>;
	};

	render() {
		const envAdapter = SimpleListAdapter(this.state.envList, item => <div
			className={'node-data'}>{item.item}</div>);
		const chunkSizesAdapter = SimpleListAdapter([2000, 1000, 500, 200, 100, 50], item => <div
			className={'node-data'}>{item.item}</div>);
		return <LL_V_L className={'sync-env-page'}>
			<LL_H_C>{TS_AppTools.renderPageHeader('Sync Environment V2')}<TS_BusyButton onClick={this.createNewBackup}>Trigger
				Backup</TS_BusyButton></LL_H_C>
			<LL_H_C className={'sync-env-page__main'}>
				<TS_PropRenderer.Vertical label={'Environment'}>
					<TS_DropDown
						placeholder={'Select Environment'}
						className={'fancy'}
						adapter={envAdapter}
						onSelected={env => {
							this.setState({selectedEnv: env});
							return this.fetchMetadata();
						}}
						selected={this.state.selectedEnv}
						canUnselect={true}
					/>
					<TS_DropDown
						placeholder={'Chunk Size'}
						className={'fancy'}
						adapter={chunkSizesAdapter}
						onSelected={chunkSize => {
							this.setState({selectedChunkSize: chunkSize});
							return this.fetchMetadata();
						}}
						selected={this.state.selectedChunkSize}
						canUnselect={true}
					/>
				</TS_PropRenderer.Vertical>
				<TS_PropRenderer.Vertical label={'Backup ID'}>
					<TS_Input
						className={_className(!tsValidateResult(this.state.backupId, tsValidateUniqueId) ? 'valid-id' : 'invalid-id')}
						type={'text'}
						value={this.state.backupId}
						onBlur={val => {
							this.setState({backupId: val}, () => StorageKey_BackupId.set(val));
							if (tsValidateResult(this.state.backupId, tsValidateUniqueId)) //Don't fetch metadata if id doesn't fit
								return;

							return this.fetchMetadata();
						}}/>
				</TS_PropRenderer.Vertical>

				<div className={_className(!this.state.fetchMetadataInProgress && 'hidden')}><TS_Loader/></div>
				<LL_H_C className={'buttons_container'}>
					<TS_BusyButton
						onClick={this.syncEnv}
						disabled={!this.canSync()}
					>Sync Environment</TS_BusyButton>

					{Thunder.getInstance().getConfig().name === this.state.selectedEnv && <TS_BusyButton
                        onClick={this.syncFirebase}
                        disabled={!this.canSync()}
                        className={'deter-users-from-this-button'}
                    >Restore Firebase To Older Backup</TS_BusyButton>}
				</LL_H_C>

				{this.state.restoreTime && <div>{this.state.restoreTime}</div>}
			</LL_H_C>
			{this.canSync() && this.renderBackupModules()}
		</LL_V_L>;
	}
}