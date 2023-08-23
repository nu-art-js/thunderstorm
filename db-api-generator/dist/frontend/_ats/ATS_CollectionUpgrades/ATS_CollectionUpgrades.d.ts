/// <reference types="react" />
import { AppToolsScreen } from '@nu-art/thunderstorm/frontend';
import './ATS_CollectionUpgrades.scss';
import { ModuleFE_BaseApi } from '../../modules/ModuleFE_BaseApi';
import { SmartComponent, State_SmartComponent } from '../../components/SmartComponent';
type State = {
    upgradableModules: ModuleFE_BaseApi<any, any>[];
};
export declare class ATS_CollectionUpgrades extends SmartComponent<{}, State> {
    static defaultProps: {
        modules: () => unknown[];
    };
    static screen: AppToolsScreen;
    protected deriveStateFromProps(nextProps: {}, state: State & State_SmartComponent): Promise<State & State_SmartComponent>;
    private upgradeCollection;
    render(): JSX.Element;
}
export {};
