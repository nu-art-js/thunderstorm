import './ATS_ActionProcessor.scss';
import {_keys, TypedMap} from '@nu-art/ts-common';
import {Dialog_ActionProcessorConfirmation} from '../dialogs/index.js';
import {ActionMetaData} from '@nu-art/thunderstorm-shared/action-processor/index';
import {ComponentAsync} from '../../core/ComponentAsync.js';
import {AppToolsScreen, ATS_Backend, TS_AppTools} from '../../components/TS_AppTools/index.js';
import {ModuleFE_ActionProcessor} from '../../modules/action-processor/ModuleFE_ActionProcessor.js';
import {genericNotificationAction} from '../../components/TS_Notifications/index.js';
import {LL_H_C, LL_V_L} from '../../components/Layouts/index.js';
import {Button} from '../../components/Button/Button.js';

type State = {
	actions: ActionMetaData[];
	actionsInProgress: string[];
};

export class ATS_ActionProcessor
	extends ComponentAsync<{}, State> {

	static screen: AppToolsScreen = {name: 'Refactoring Actions', key: 'refactoring-actions', renderer: this, group: ATS_Backend};

	
	protected async deriveStateFromProps(nextProps: {}) {
		const state: State = this.state ? {...this.state} : {} as State;
		state.actions = await ModuleFE_ActionProcessor.vv1.list({}).executeSync();
		state.actionsInProgress ??= [];
		return state;
	}

	
	private onButtonClick = async (action: ActionMetaData) => {
		return Dialog_ActionProcessorConfirmation.show(action, async () => {
			await genericNotificationAction(async () => {
				this.setState({actionsInProgress: [...this.state.actionsInProgress, action.key]});
				await ModuleFE_ActionProcessor.vv1.execute({key: action.key}).executeSync();
			}, {inProgress: `Executing ${action.key}`, success: `${action.key} - Success`, failed: `${action.key} - Failure`});
			this.setState({actionsInProgress: this.state.actionsInProgress.filter(i => i !== action.key)});
		});
	};

	
	private renderButtons(actionGroup: ActionMetaData[]) {
		return <LL_H_C className={'action-group__buttons'}>
			{actionGroup.map(action => {
				return <Button
					key={action.key}
					onClick={() => this.onButtonClick(action)}
					disabled={this.state.actionsInProgress.includes(action.key)}
				>
					{action.key.replace(/-/g, ' ')}
				</Button>;
			})}
		</LL_H_C>;
	}

	private renderButtonGroups() {
		const groups = this.state.actions?.reduce<TypedMap<ActionMetaData[]>>((acc, curr) => {
			if (!acc[curr.group])
				acc[curr.group] = [];
			acc[curr.group].push(curr);
			return acc;
		}, {});

		if (!groups)
			return '';

		return <LL_V_L className={'action-groups'}>
			{_keys(groups).map(key => {
				return <LL_V_L className={'action-group'} key={key}>
					<div className={'action-group__title'}>{key}</div>
					{this.renderButtons(groups[key])}
				</LL_V_L>;
			})}
		</LL_V_L>;
	}

	render() {
		return <div className={'refactoring-actions-page'}>
			{TS_AppTools.renderPageHeader('Refactoring Actions')}
			{this.renderButtonGroups()}
		</div>;
	}
}