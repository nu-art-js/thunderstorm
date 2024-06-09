import {Widgets} from 'blessed';
import {PhaseRunner_OnPhaseChange} from '../phase-runner/PhaseRunnerDispatcher';
import {Phase} from '../phase';
import {BaseUnit} from '../unit/core';
import {BAIScreenV2} from './BAIScreenV2';
import {TypedMap} from '@nu-art/ts-common';
import {BlessedComponent_BufferLogs} from '../blessed/components/BlessedComponent_BufferLogs';
import {BlessedComponent_TextBox} from '../blessed/components/BlessedComponent_TextBox';
import {BlessedComponent_UnitList, UnitList_Props} from '../blessed/components/BlessedComponent_UnitList';
import {MemKey_PhaseRunner} from '../phase-runner/consts';

type State = {
	unitStatusMap: TypedMap<string>;
	currentPhaseName?: string;
	selectedUnitKey?: string;
	logs: string;
};

export class BAIScreenV2_UnitList
	extends BAIScreenV2<State>
	implements PhaseRunner_OnPhaseChange {

	//######################### Lifecycle #########################

	constructor() {
		super('bai-unit-list');
	}

	__onPhaseChange(phase: Phase<string>) {
		this.setState({currentPhaseName: phase.name});
	}

	protected onLogUpdated = () => {
		this.setState({logs: this.getLogs()});
	};

	//######################### Logic #########################

	private onUnitSelected = (unit?: BaseUnit) => {
		const key = unit?.config.key;
		console.log(key);
		this.setState({selectedUnitKey: key, logs: this.getLogs(key)});
	};

	private getLogs = (unitKey: string | undefined = this.state.selectedUnitKey) => {
		if (!unitKey)
			return this.getLogClient().buffers[0];
		else {
			const selectedUnit = MemKey_PhaseRunner.get().getUnits().find(unit => unit.config.key === this.state.selectedUnitKey);
			return selectedUnit?.getLogs() ?? `Could not get logs for unit with key ${this.state.selectedUnitKey}`;
		}
	};

	protected renderSelf() {
		console.log('Render Screen');
	}

	//######################### Content Creation #########################

	protected createChildren() {
		this.createPhaseWidget();
		this.createLogWidget();
		this.createUnitList();
	}

	private createPhaseWidget() {
		const props: Widgets.TextOptions = {
			top: 0,
			left: 0,
			height: 3,
			width: '30%',
			content: 'phases',
			border: {type: 'line'},
			tags: true,
			style: {
				border: {fg: 'blue'},
				fg: 'blue',
			},
			align: 'center',
		};
		this.registerChild(
			new BlessedComponent_TextBox(props),
			state => {
				return {text: `Running Phase: ${state.currentPhaseName ?? 'Initializing'}`};
			}
		);
	}

	private createLogWidget() {
		const props: Widgets.LogOptions = {
			top: 0,
			right: 0,
			bottom: 0,
			width: '70%',
			border: {type: 'line'},
			style: {
				border: {fg: 'blue'}
			},
			valign: 'top',
			align: 'left',
			mouse: true,
		};

		this.registerChild(
			new BlessedComponent_BufferLogs(props),
			state => {
				return {logs: state.logs};
			});
	}

	private createUnitList() {
		const props: Widgets.ListOptions<any> = {
			top: 3,
			left: 0,
			bottom: 0,
			width: '30%',
			border: {type: 'line'},
			align: 'left',
			style: {
				border: {fg: 'blue'},
			},
		};

		const initialProps = {
			onUnitSelected: unit => this.onUnitSelected(unit),
		} as UnitList_Props;

		this.registerChild(
			new BlessedComponent_UnitList(props, initialProps),
			state => {
				return {
					onUnitSelected: unit => this.onUnitSelected(unit),
					selectedUnitKey: state.selectedUnitKey
				};
			}
		);
	}
}