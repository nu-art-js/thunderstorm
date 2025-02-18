import * as React from 'react';
import './ATS_CrudOperations.scss';
import {AppToolsScreen, ATS_Backend} from '../../components/TS_AppTools';
import {ModuleFE_BaseApi} from '../../modules/db-api-gen/ModuleFE_BaseApi';
import {ModuleFE_BaseDB} from '../../modules/db-api-gen/ModuleFE_BaseDB';
import {ComponentSync} from '../../core/ComponentSync';
import {LL_H_C, LL_V_L} from "../../components/Layouts";
import {DropDown_DBModules} from "./ui-components";
import {TS_DropDown} from "../../components/TS_Dropdown";
import {SimpleListAdapter} from "../../components/adapter/Adapter";
import {FirestoreQuery} from '@nu-art/firebase';
import {DB_BaseObject} from "@nu-art/ts-common";
import {TS_TextArea} from "../../components/TS_Input";
import {Button} from "../../components/Button/Button";
import { ModuleFE_Toaster } from '../../component-modules/ModuleFE_Toaster';

type Action = {
    label: string;
    action: (dbModule:  ModuleFE_BaseApi<any, any>, input: string) => void;
}

const ACTIONS: Action[] = [
    {
        label: 'upsert',
        action: (dbModule, input) => dbModule.v1.upsert(input).execute()
    },
    {
        label: 'query',
        action: (dbModule, input) => dbModule.v1.query(input as unknown as FirestoreQuery<any>).execute()
    },
    {
        label: 'delete',
        action: (dbModule, input) => dbModule.v1.delete(input as unknown as DB_BaseObject).execute()
    }
];

type State = {
    dbModuleToRequest?: ModuleFE_BaseApi<any, any>;
    selectedAction?: Action;
    input?: string;
    result?: string;
};

export class ATS_CrudOperations
    extends ComponentSync<{}, State> {
    //######################### Life Cycle #########################

    static Screen: AppToolsScreen = {
        name: 'Crud Operations',
        key: 'crud-operations',
        renderer: this,
        group: ATS_Backend,
    };

    protected deriveStateFromProps(nextProps: {}, state: State) {
        return state;
    }

    __onSyncStatusChanged(module: ModuleFE_BaseDB<any, any>) {
        this.forceUpdate();
    }

    //######################### Logic #########################
    private onDBModuleSelected = (module: ModuleFE_BaseApi<any, any>) => {
        this.setState({dbModuleToRequest: module, selectedAction: undefined});
    }

    private onDBActionSelected = (action: Action) => {
        this.setState({selectedAction: action});
    }

    private onChangeInput = (value: string) => {
        this.setState({input: value});
    }

    private onClickExecute = () => {
        const {selectedAction, input, dbModuleToRequest} = this.state;
        if (!dbModuleToRequest || !selectedAction || !input) {
            return ModuleFE_Toaster.toastError('Cannot Execute without all fields');
        }

        const response = selectedAction.action(dbModuleToRequest, JSON.parse(input));
        console.log(response);
        this.setState({result: JSON.stringify(response)})
    }

    //######################### Render #########################
    render() {
        const {dbModuleToRequest, selectedAction, input, result} = this.state;

        return <LL_H_C className={'ats-crud-operations-container'}>
            <LL_V_L className={'ats-crud-operations-container__selection'}>
                <DropDown_DBModules.selectable selected={dbModuleToRequest} onSelected={this.onDBModuleSelected} />
                <TS_DropDown
                    adapter={SimpleListAdapter(ACTIONS, action => <>{action.item.label}</>)}
                    selected={selectedAction}
                    placeholder={'Select Action'}
                    onSelected={this.onDBActionSelected}
                />
                <TS_TextArea
                    type={'text'}
                    placeholder={'Enter input'}
                    disabled={false}
                    value={input}
                    onChange={this.onChangeInput}
                    className={'ats-crud-operations-container__selection__input'}
                />
                <Button
                    className={'ats-crud-operations-container__selection__execute'}
                    disabled={!(dbModuleToRequest && selectedAction && input)}
                    onClick={this.onClickExecute}
                    variant={'primary'}>Execute</Button>
            </LL_V_L>
            <TS_TextArea
                className={'ats-crud-operations-container__results'}
                type={'text'}
                value={result}
                placeholder={'Results'}
                disabled
            />
        </LL_H_C>
    }
}