/// <reference types="react" />
import { AppToolsScreen, ComponentSync } from '@nu-art/thunderstorm/frontend';
import './ATS_SyncEnv.scss';
type Env = 'prod' | 'staging' | 'dev' | 'local';
type State = {
    envList: Env[];
    selectedEnv?: Env;
    backupId?: string;
    onlyModules: Set<string>;
    excludedModules: Set<string>;
};
export declare class ATS_SyncEnvironment extends ComponentSync<{}, State> {
    static screen: AppToolsScreen;
    protected deriveStateFromProps(nextProps: {}, state: State): State;
    private syncEnv;
    private canSync;
    private getCollectionModuleList;
    private renderOnlyModulesSelection;
    private renderExcludedModulesSelection;
    render(): JSX.Element;
}
export {};
