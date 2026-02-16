import './ATS_CrudOperations.scss';
import {AppToolsScreen, ATS_Backend} from '../TS_AppTools/index.js';
import {
	Button,
	ComponentSync,
	LL_H_C,
	LL_V_L,
	ModuleFE_Clipboard,
	ModuleFE_Toaster,
	SimpleListAdapter,
	TS_DropDown,
	TS_TextArea
} from '@nu-art/thunder-widgets';
import {ModuleFE_BaseApi, ModuleFE_BaseDB} from '@nu-art/db-api-frontend';
import {DropDown_DBModules} from './ui-components.js';
import {TS_Icons} from '@nu-art/ts-styles';
import {FirestoreQuery} from '@nu-art/firebase-shared';

type Action = {
	label: string;
	action: (dbModule: ModuleFE_BaseApi<any>, parsed: unknown) => Promise<any>;
};
const ACTIONS: Action[] = [
	{
		label: 'upsert',
		action: (dbModule, parsed) => dbModule.upsert(parsed as any)
	},
	{
		label: 'upsert all',
		action: (dbModule, parsed) => dbModule.upsertAll(parsed as any[])
	},
	{
		label: 'query',
		action: (dbModule, parsed) => dbModule.query(parsed as FirestoreQuery<any>)
	},
	{
		label: 'delete',
		action: (dbModule, parsed) => dbModule.delete(parsed as any)
	},
	{
		label: 'delete query',
		action: (dbModule, parsed) => dbModule.deleteQuery(parsed as FirestoreQuery<any>)
	}
];
type State = {
	dbModuleToRequest?: ModuleFE_BaseApi<any>;
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

	__onSyncStatusChanged(module: ModuleFE_BaseDB<any>) {
		this.forceUpdate();
	}

	//######################### Logic #########################
	private onDBModuleSelected = (module: ModuleFE_BaseApi<any>) => {
		this.setState({dbModuleToRequest: module, selectedAction: undefined});
	};
	private onDBActionSelected = (action: Action) => {
		this.setState({selectedAction: action});
	};
	private onChangeInput = (value: string) => {
		this.setState({input: value});
	};
	private onClickExecute = async () => {
		const {selectedAction, input, dbModuleToRequest} = this.state;
		if (!dbModuleToRequest || !selectedAction || !input) {
			return ModuleFE_Toaster.toastError('Cannot Execute without all fields');
		}
		try {
			const response = await selectedAction.action(dbModuleToRequest, JSON.parse(input));
			this.setState({result: response});
		} catch (e: any) {
			this.setState({result: `error occurred: ${e.message}`});
		}
	};

	//######################### Render #########################
	render() {
		const {dbModuleToRequest, selectedAction, input, result} = this.state;
		return <LL_H_C className={'ats-crud-operations-container'}>
			<LL_V_L className={'ats-crud-operations-container__selection'}>
				<DropDown_DBModules.selectable selected={dbModuleToRequest} onSelected={this.onDBModuleSelected}/>
				<TS_DropDown adapter={SimpleListAdapter(ACTIONS, action => <>{action.item.label}</>)} selected={selectedAction} placeholder={'Select Action'}
										 onSelected={this.onDBActionSelected}/>
				<TS_TextArea key={'crud-operations-query'} className={'ats-crud-operations-container__selection__input'} type={'text'} placeholder={'Enter input'}
										 disabled={false} value={input} onChange={this.onChangeInput} style={{fontFamily: 'monospace', fontSize: 15}}/>
				<LL_H_C className={'ats-crud-operations-container__selection__buttons'}>
					<Button className={'ats-crud-operations-container__selection__execute'} disabled={!(dbModuleToRequest && selectedAction && input)}
									onClick={this.onClickExecute} variant={'primary'}>Execute</Button>
					<TS_Icons.copy.component onClick={async () => {
						if (!result)
							return;
						const copyObject = JSON.stringify(result, null, 2);
						await ModuleFE_Clipboard.copyToClipboard(copyObject);
					}}/>
				</LL_H_C>

			</LL_V_L>
			{this.renderResults()}
		</LL_H_C>;
	}

	private renderResult = (item: any) => (
		<TS_TextArea key={item?._id} className={'ats-crud-operations-container__result'} type={'text'} value={JSON.stringify(item, null, 2)} placeholder={'Results'}
								 disabled style={{fontFamily: 'monospace', fontSize: 15}}/>);
	private renderResults = () => {
		const result = this.state.result;
		if (result && Array.isArray(result)) {
			return (<LL_V_L className={'ats-crud-operations-container__results'}>
				{result.map((item) => this.renderResult(item))}
			</LL_V_L>);
		}
		return this.renderResult(result);
	};
}
