/// <reference types="react" />
import { AppToolsScreen, ComponentSync } from '@nu-art/thunderstorm/frontend';
import './ATS_SyncEnvV2.scss';
import { BackupMetaData } from '@nu-art/thunderstorm/backend/modules/backup/ModuleBE_v2_Backup';
type Env = 'prod' | 'staging' | 'dev' | 'local';
type State = {
    envList: Env[];
    selectedEnv?: Env;
    backupId?: string;
    selectedModules: Set<string>;
    moduleList: string[];
    searchFilter: string;
    restoreTime?: string;
    backingUpInProgress?: boolean;
    fetchMetadataInProgress?: boolean;
    metadata?: BackupMetaData;
    selectAll: boolean;
};
export declare class ATS_SyncEnvironmentV2 extends ComponentSync<{}, State> {
    static screen: AppToolsScreen;
    protected deriveStateFromProps(nextProps: {}, state: State): State;
    private fetchMetadata;
    private syncEnv;
    private syncFirebase;
    private createNewBackup;
    private canSync;
    private getCollectionModuleList;
    private renderBackupModules;
    render(): JSX.Element;
}
export {};
