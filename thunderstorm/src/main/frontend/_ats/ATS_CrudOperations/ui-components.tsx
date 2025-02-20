import * as React from 'react';
import {filterDuplicates, ResolvableContent, RuntimeModules, sortArray} from '@nu-art/ts-common';
import {MandatoryProps_TS_DropDown, TS_DropDown} from '../../components/TS_Dropdown';
import {SimpleListAdapter} from "../../components/adapter/Adapter";
import {ModuleFE_BaseApi} from "../../modules/db-api-gen/ModuleFE_BaseApi";


export const Props_DBModulesDropDown: ResolvableContent<MandatoryProps_TS_DropDown<ModuleFE_BaseApi<any>>> = {
    adapter: () => SimpleListAdapter(
        sortArray(
            filterDuplicates(
                RuntimeModules().filter((module: ModuleFE_BaseApi<any>) => !!module.getCollectionName),
                (module: ModuleFE_BaseApi<any>) => module.getCollectionName()
            ),
            item => item.getCollectionName()
        ),
        module => (
            <div>
                <div style={{ fontSize: '1.25em', fontWeight: 'bold' }}>{module.item.getCollectionName()}</div>
                <div style={{ fontSize: '0.85em', color: '#666' }}>{module.item.getCollectionKey()}</div>
            </div>
        )
    ),
    placeholder: 'DB Module'
};


export const DropDown_DBModules = TS_DropDown.prepare(Props_DBModulesDropDown);