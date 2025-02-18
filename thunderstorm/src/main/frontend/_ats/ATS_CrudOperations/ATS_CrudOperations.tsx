import * as React from 'react';
import {filterDuplicates, RuntimeModules, sortArray} from '@nu-art/ts-common';
import './ATS_CrudOperations.scss';
import {AppToolsScreen, ATS_Backend} from '../../components/TS_AppTools';
import {ModuleFE_BaseApi} from '../../modules/db-api-gen/ModuleFE_BaseApi';
import {ModuleFE_BaseDB} from '../../modules/db-api-gen/ModuleFE_BaseDB';
import {ComponentSync} from '../../core/ComponentSync';


type State = {
    dbModuleToRequest: ModuleFE_BaseApi<any, any>[];
};

export class ATS_CrudOperations
    extends ComponentSync<{}, State> {

    static screen: AppToolsScreen = {
        name: 'Crud Operations',
        key: 'crud-operations',
        renderer: this,
        group: ATS_Backend,
    };

    protected deriveStateFromProps(nextProps: {}, state: State) {
        state.dbModuleToRequest ??= sortArray(filterDuplicates(RuntimeModules().filter((module: ModuleFE_BaseApi<any>) => {
            return !!module.getCollectionName;
        }), (module: ModuleFE_BaseApi<any>) => module.getCollectionName()), item => item.getCollectionName());

        return state;
    }

    __onSyncStatusChanged(module: ModuleFE_BaseDB<any, any>) {
        this.forceUpdate();
    }


    render() {
        return <div></div>;
    }
}