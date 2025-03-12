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
import {ModuleFE_Toaster} from '../../component-modules/ModuleFE_Toaster';
import {BaseHttpRequest} from "../../../shared";

type Action = {
    label: string;
    action: (dbModule: ModuleFE_BaseApi<any, any>, input: string) => BaseHttpRequest<any>;
}

const ACTIONS: Action[] = [
    {
        label: 'upsert',
        action: (dbModule, input) => dbModule.v1.upsert(input)
    },
    {
        label: 'query',
        action: (dbModule, input) => dbModule.v1.query(input as unknown as FirestoreQuery<any>)

    },
    {
        label: 'delete',
        action: (dbModule, input) => dbModule.v1.delete(input as unknown as DB_BaseObject)
    }
];

type State = {
    dbModuleToRequest?: ModuleFE_BaseApi<any, any>;
    selectedAction?: Action;
    input?: string;
    result?: string | Object | Object[];
};

export class ATS_CrudOperations
    extends ComponentSync<{}, State> {
    //######################### Life Cycle #########################

    static screen: AppToolsScreen = {
        name: 'Crud Operations',
        key: 'crud-operations',
        renderer: this,
        group: ATS_Backend,
    };

    protected deriveStateFromProps(nextProps: {}, state: State) {
        state.input = '{}';
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

    private onClickExecute = async () => {
        const {selectedAction, input, dbModuleToRequest} = this.state;
        if (!dbModuleToRequest || !selectedAction || !input) {
            return ModuleFE_Toaster.toastError('Cannot Execute without all fields');
        }

        try {
            const response = await selectedAction.action(dbModuleToRequest, JSON.parse(input)).executeSync();
            this.setState({result: response})
        } catch (e: any) {
            this.setState({result: `error occurred: ${e.message}`});
        }
    }

    //######################### Render #########################
    render() {
        const {dbModuleToRequest, selectedAction, input} = this.state;

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
                    className={'ats-crud-operations-container__selection__input'}
                    type={'text'}
                    placeholder={'Enter input'}
                    disabled={false}
                    value={input}
                    onChange={this.onChangeInput}
                    style={{fontFamily: 'monospace', fontSize: 15}}
                />
                <Button
                    className={'ats-crud-operations-container__selection__execute'}
                    disabled={!(dbModuleToRequest && selectedAction && input)}
                    onClick={this.onClickExecute}
                    variant={'primary'}>Execute</Button>
            </LL_V_L>
            {this.renderResults()}
        </LL_H_C>
    }

    private renderResult = (item: any) =>
        (<TS_TextArea
            className={'ats-crud-operations-container__result'}
            type={'text'}
            value={JSON.stringify(item, null, 2)}
            placeholder={'Results'}
            disabled
            style={{fontFamily: 'monospace', fontSize: 15}}
        />)


    private renderResults = () => {
        const result = this.state.result;

        if (result && Array.isArray(result)) {
            return (
                <LL_V_L className={'ats-crud-operations-container__results'}>
                    {result.map((item) => this.renderResult(item))}
                </LL_V_L>
            )
        }

        return this.renderResult(result);

    }
}