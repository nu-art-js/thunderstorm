import * as React from 'react';
import './ATS_SyncEnv.scss';
import {_keys, filterKeys, RuntimeModules, tsValidateResult, tsValidateUniqueId, TypedMap, UniqueId} from '@nu-art/ts-common';
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
import {ModuleFE_BaseApi} from '../../modules/db-api-gen/ModuleFE_BaseApi';
import {StorageKey} from '../../modules/ModuleFE_LocalStorage';

const Environments = ['prod', 'staging', 'dev', 'local'] as const;
type Env = typeof Environments[number];

const ChunkSizes = [2000, 1000, 500, 200, 100, 50] as const;
type ChunkSize = typeof ChunkSizes[number];

const StorageKey_BackupId = new StorageKey<UniqueId>('sync-env--backup-id');
const StorageKey_Env = new StorageKey<Env>('sync-env--env');
const StorageKey_ChunkSize = new StorageKey<ChunkSize>('sync-env--chunk-size');

type ModuleMetadata = {
	local?: boolean
	remote?: boolean // Need to return existing modules from remote to show this boolean
	backup?: boolean
}

type State = {
	selectedEnv?: Env;
	selectedChunkSize?: ChunkSize
	backupId?: string;
	selectedModules: Set<string>;

	moduleList: TypedMap<ModuleMetadata> //name, origin data like local-only, remote-only, from backup-only
	searchFilter: string;
	restoreTime?: string;
	backingUpInProgress?: boolean;
	fetchMetadataInProgress?: boolean;
	metadata?: Response_FetchBackupMetadata;
}


export class ATS_SyncEnvironment
	extends ComponentSync<{}, State> {

	static screen: AppToolsScreen = {
		name: 'Sync Environment',
		key: 'sync-environment',
		renderer: this,
		group: ATS_Fullstack
	};

	// ######################## Life Cycle ########################

	protected deriveStateFromProps(nextProps: {}, state: State) {
		//Set Initials
		state.selectedModules ??= new Set<string>();
		state.selectedChunkSize ??= StorageKey_ChunkSize.get(100);
		state.selectedEnv ??= StorageKey_Env.get('prod');
		state.backupId ??= StorageKey_BackupId.get();

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

		return state;
	}

	// ######################## Logic ########################

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

	private allModulesSelected = () => {
		return this.state.selectedModules.size === _keys(this.state.moduleList).length;
	};

	// ######################## Set Data

	private setBackupId = (id: string) => {
		this.setState({backupId: id}, () => {
			if (!id)
				return StorageKey_BackupId.delete();

			StorageKey_BackupId.set(id);
			if (tsValidateResult(this.state.backupId, tsValidateUniqueId)) //Don't fetch metadata if id doesn't fit
				return;

			return this.fetchMetadata();
		});
	};

	private setEnv = (env?: Env) => {
		this.setState({selectedEnv: env}, () => {
			if (!env)
				return StorageKey_Env.delete();
			StorageKey_Env.set(env);
			this.fetchMetadata();
		});
	};

	private setChunkSize = (size?: ChunkSize) => {
		this.setState({selectedChunkSize: size});
		if (size)
			return this.fetchMetadata();
	};

	private toggleSelectAll = () => {
		const selectedLength = this.state.selectedModules.size;
		const allModules = _keys(this.state.moduleList) as string[];

		//All are selected, clear all modules
		if (selectedLength === allModules.length)
			return this.setState({selectedModules: new Set()});

		//Some or none of the modules are selected, select all
		this.setState({selectedModules: new Set(allModules)});
	};

	private toggleSelectedModule = (moduleName: string) => {
		if (this.state.selectedModules.has(moduleName))
			this.state.selectedModules.delete(moduleName);
		else
			this.state.selectedModules.add(moduleName);
		this.forceUpdate();
	};

	// ######################## Render ########################

	render() {
		return <LL_V_L className={'sync-env-page'}>
			{this.renderHeader()}
			{this.renderMenu()}
			{this.renderBackupModules()}
		</LL_V_L>;
	}

	private renderHeader = () => {
		return TS_AppTools.renderPageHeader('Sync Environment V2');
	};

	private renderMenu = () => {
		const envAdapter = SimpleListAdapter([...Environments], item => <div className={'node-data'}>{item.item}</div>);
		const chunkSizesAdapter = SimpleListAdapter([...ChunkSizes], item => <div className={'node-data'}>{item.item}</div>);
		return <LL_V_L className={'sync-env-page__menu'}>
			<LL_H_C className={'sync-env-page__menu__row'}>
				<TS_PropRenderer.Vertical label={'Environment'}>
					<TS_DropDown
						placeholder={'Select Environment'}
						className={'fancy'}
						adapter={envAdapter}
						onSelected={this.setEnv}
						selected={this.state.selectedEnv}
						canUnselect={true}
					/>
				</TS_PropRenderer.Vertical>
				<TS_PropRenderer.Vertical label={'Chunk Size'}>
					<TS_DropDown
						placeholder={'Chunk Size'}
						className={'fancy'}
						adapter={chunkSizesAdapter}
						onSelected={this.setChunkSize}
						selected={this.state.selectedChunkSize}
						canUnselect={true}
					/>
				</TS_PropRenderer.Vertical>
				{this.renderOperations()}
			</LL_H_C>
			<LL_H_C className={'sync-env-page__menu__row'}>
				<TS_PropRenderer.Vertical label={'Backup ID'}>
					<TS_Input
						className={_className(!tsValidateResult(this.state.backupId, tsValidateUniqueId) ? 'valid-id' : 'invalid-id')}
						type={'text'}
						value={this.state.backupId}
						onBlur={this.setBackupId}/>
				</TS_PropRenderer.Vertical>
				<TS_PropRenderer.Vertical label={'Collection Filter'}>
					<TS_Input
						onChange={val => this.setState({searchFilter: val})} type={'text'}
						placeholder={'search collection'}
					/>
				</TS_PropRenderer.Vertical>
				{this.renderStatus()}
				{this.state.restoreTime && <div>{this.state.restoreTime}</div>}
			</LL_H_C>
		</LL_V_L>;
	};

	private renderOperations = () => {
		return <TS_PropRenderer.Vertical label={'Operations'}>
			<LL_H_C className={'sync-env-page__operations'}>
				<TS_BusyButton onClick={this.createNewBackup}>Trigger Backup</TS_BusyButton>
				<TS_BusyButton onClick={this.syncEnv} disabled={!this.canSync()}>Sync Environment</TS_BusyButton>
				{Thunder.getInstance().getConfig().name?.toLowerCase() === this.state.selectedEnv && <TS_BusyButton
					onClick={this.syncFirebase}
					disabled={!this.canSync()}
					className={'deter-users-from-this-button'}
				>Restore Firebase To Older Backup</TS_BusyButton>}
			</LL_H_C>
		</TS_PropRenderer.Vertical>;
	};

	private renderStatus = () => {
		const style = {
			'--color': '#000',
			'--color-faded': '#0008',
		} as React.CSSProperties;

		if (this.state.fetchMetadataInProgress)
			return <LL_H_C className={'sync-env-page__status'}>
				Fetching Metadata
				<span style={style} className={'three-dot-loader'}><span/><span/><span/></span>
			</LL_H_C>;

		if (this.state.backingUpInProgress)
			return <LL_H_C className={'sync-env-page__status'}>
				Backup In Progress
				<span style={style} className={'three-dot-loader'}><span/><span/><span/></span>
			</LL_H_C>;
	};

	private renderBackupModules = () => {
		if (!this.canSync())
			return;

		return <>
			<LL_V_L className={'sync-env_modules-list-v2'}>
				<LL_H_C className={'utils'}>
					<TS_Checkbox
						checked={this.allModulesSelected()}
						onCheck={this.toggleSelectAll}
					>
						Select All
					</TS_Checkbox>
				</LL_H_C>
				{(_keys(this.state.moduleList) as string[]).map(this.renderModule)}
			</LL_V_L>
		</>;
	};

	private renderModule = (moduleName: string) => {
		const collectionMetadata = this.state.metadata?.collectionsData.find(collection => collection.collectionName === moduleName);

		if ((this.state.searchFilter && this.state.searchFilter.length) && !moduleName.includes(this.state.searchFilter))
			return;

		const relevantLocalModules: ModuleFE_BaseDB<any>[] = RuntimeModules().filter((module: ModuleFE_BaseApi<any>) => {
			return (!!module.getCollectionName && module.getCollectionName() == collectionMetadata?.collectionName);
		});

		const localCount = relevantLocalModules.length === 1 && relevantLocalModules[0] ? relevantLocalModules[0].cache._array.length : 0;
		const diffCount = collectionMetadata?.numOfDocs !== undefined ? collectionMetadata.numOfDocs - localCount : undefined;
		const diffShow = diffCount !== 0 ? diffCount : undefined;

		return <TS_PropRenderer.Horizontal
			key={moduleName}
			label={<LL_H_C className={'header'}>
				<TS_Checkbox
					checked={this.state.selectedModules.has(moduleName)}
					onCheck={() => this.toggleSelectedModule(moduleName)}
				/>
				<div>{moduleName}</div>
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
					style={{fontFamily: 'monospace'}}>{`${this.state.moduleList[moduleName].local ? 'L' : '-'}${this.state.moduleList[moduleName].remote ? 'R' : '-'}${this.state.moduleList[moduleName].backup ? 'B' : '-'}`}</div>
			</LL_H_C>
		</TS_PropRenderer.Horizontal>;
	};
}