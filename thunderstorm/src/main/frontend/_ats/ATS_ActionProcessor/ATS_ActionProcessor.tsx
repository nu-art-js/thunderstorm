import * as React from 'react';
import './ATS_ActionProcessor.scss';
import {_keys, TypedMap} from '@nu-art/ts-common';
import {Dialog_ActionProcessorConfirmation} from '../dialogs';
import {ActionMetaData} from '../../../shared/action-processor';
import {ComponentAsync} from '../../core/ComponentAsync';
import {AppToolsScreen, TS_AppTools} from '../../components/TS_AppTools';
import {ModuleFE_ActionProcessor} from '../../modules/action-processor/ModuleFE_ActionProcessor';
import {genericNotificationAction} from '../../components/TS_Notifications';
import {LL_H_C, LL_V_L} from '../../components/Layouts';
import {TS_BusyButton} from '../../components/TS_BusyButton';


type State = {
	actions: ActionMetaData[];
	actionsInProgress: string[];
};

export class ATS_ActionProcessor
	extends ComponentAsync<{}, State> {

	static screen: AppToolsScreen = {name: 'Refactoring Actions', key: 'refactoring-actions', renderer: this, group: 'TS Dev Tools'};

	// ######################### Life Cycle #########################

	protected async deriveStateFromProps(nextProps: {}) {
		const state: State = this.state ? {...this.state} : {} as State;
		state.actions = await ModuleFE_ActionProcessor.vv1.list({}).executeSync();
		state.actionsInProgress ??= [];
		return state;
	}

	// ######################### Logic #########################

	private onButtonClick = async (action: ActionMetaData) => {
		return Dialog_ActionProcessorConfirmation.show(action, async () => {
			await genericNotificationAction(async () => {
				this.setState({actionsInProgress: [...this.state.actionsInProgress, action.key]});
				await ModuleFE_ActionProcessor.vv1.execute({key: action.key}).executeSync();
			}, {inProgress: `Executing ${action.key}`, success: `${action.key} - Success`, failed: `${action.key} - Failure`});
			this.setState({actionsInProgress: this.state.actionsInProgress.filter(i => i !== action.key)});
		});
	};

	// ######################### Render #########################

	private renderButtons(actionGroup: ActionMetaData[]) {
		return <LL_H_C className={'action-group__buttons'}>
			{actionGroup.map(action => {
				return <TS_BusyButton
					key={action.key}
					onClick={() => this.onButtonClick(action)}
					disabled={this.state.actionsInProgress.includes(action.key)}
				>
					{action.key.replace(/-/g, ' ')}
				</TS_BusyButton>;
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