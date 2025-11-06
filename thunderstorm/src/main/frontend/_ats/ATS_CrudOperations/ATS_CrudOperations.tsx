import './ATS_CrudOperations.scss';
import {AppToolsScreen, ATS_Backend} from '../../components/TS_AppTools/index.js';
import {ModuleFE_BaseApi} from '../../modules/db-api-gen/ModuleFE_BaseApi.js';
import {ModuleFE_BaseDB} from '../../modules/db-api-gen/ModuleFE_BaseDB.js';
import {ComponentSync} from '../../core/ComponentSync.js';
import {LL_H_C, LL_V_L} from '../../components/Layouts/index.js';
import {DropDown_DBModules} from './ui-components.js';
import {TS_DropDown} from '../../components/TS_Dropdown/index.js';
import {SimpleListAdapter} from '../../components/adapter/Adapter.js';
import {FirestoreQuery} from '@nu-art/firebase';
import {DB_BaseObject} from '@nu-art/ts-common';
import {TS_TextArea} from '../../components/TS_Input/index.js';
import {Button} from '../../components/Button/Button.js';
import {ModuleFE_Toaster} from '../../component-modules/ModuleFE_Toaster.js';
import {BaseHttpRequest} from '../../../shared/index.js';
import {ModuleFE_Thunderstorm} from '../../modules/ModuleFE_Thunderstorm.js';
import {TS_Icons} from '@nu-art/ts-styles';

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
		label: 'upsert all',
		action: (dbModule, input) => dbModule.v1.upsertAll(JSON.parse(input))
	},
	{
		label: 'query',
		action: (dbModule, input) => dbModule.v1.query(input as unknown as FirestoreQuery<any>)

	},
	{
		label: 'delete',
		action: (dbModule, input) => dbModule.v1.delete(input as unknown as DB_BaseObject)
	},
	{
		label: 'delete query',
		action: (dbModule, input) => dbModule.v1.deleteQuery(input as unknown as FirestoreQuery<any>)
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
			const response = await selectedAction.action(dbModuleToRequest, JSON.parse(input)).executeSync();
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
				<DropDown_DBModules.selectable
					selected={dbModuleToRequest}
					onSelected={this.onDBModuleSelected}
				/>
				<TS_DropDown
					adapter={SimpleListAdapter(ACTIONS, action => <>{action.item.label}</>)}
					selected={selectedAction}
					placeholder={'Select Action'}
					onSelected={this.onDBActionSelected}
				/>
				<TS_TextArea
					key={'crud-operations-query'}
					className={'ats-crud-operations-container__selection__input'}
					type={'text'}
					placeholder={'Enter input'}
					disabled={false}
					value={input}
					onChange={this.onChangeInput}
					style={{fontFamily: 'monospace', fontSize: 15}}
				/>
				<LL_H_C className={'ats-crud-operations-container__selection__buttons'}>
					<Button
						className={'ats-crud-operations-container__selection__execute'}
						disabled={!(dbModuleToRequest && selectedAction && input)}
						onClick={this.onClickExecute}
						variant={'primary'}>Execute</Button>
					<TS_Icons.copy.component onClick={async () => {
						if (!result)
							return;
						const copyObject = JSON.stringify(result, null, 2);
						await ModuleFE_Thunderstorm.copyToClipboard(copyObject);
					}}/>
				</LL_H_C>

			</LL_V_L>
			{this.renderResults()}
		</LL_H_C>;
	}

	private renderResult = (item: any) =>
		(<TS_TextArea
			key={item?._id}
			className={'ats-crud-operations-container__result'}
			type={'text'}
			value={JSON.stringify(item, null, 2)}
			placeholder={'Results'}
			disabled
			style={{fontFamily: 'monospace', fontSize: 15}}
		/>);


	private renderResults = () => {
		const result = this.state.result;

		if (result && Array.isArray(result)) {
			return (
				<LL_V_L className={'ats-crud-operations-container__results'}>
					{result.map((item) => this.renderResult(item))}
				</LL_V_L>
			);
		}

		return this.renderResult(result);
	};
};