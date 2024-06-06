import {Widgets} from 'blessed';
import {PhaseRunner_OnPhaseChange} from '../phase-runner/PhaseRunnerDispatcher';
import {Phase} from '../phase';
import {BaseUnit} from '../unit/core';
import {BAIScreenV2} from './BAIScreenV2';
import {TypedMap} from '@nu-art/ts-common';
import {BlessedComponent_BufferLogs} from '../blessed/components/BlessedComponent_BufferLogs';
import {BlessedComponent_TextBox} from '../blessed/components/BlessedComponent_TextBox';
import {BlessedComponent_UnitList} from '../blessed/components/BlessedComponent_UnitList';

type State = {
	unitStatusMap: TypedMap<string>;
	currentPhaseName?: string;
	selectedUnit?: BaseUnit;
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
		const logs = this.state.selectedUnit ? this.state.selectedUnit.getLogs() : this.getLogClient().buffers[0];
		this.setState({logs});
	};

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
		this.registerChild(
			new BlessedComponent_UnitList(props),
		);
	}

	//######################### Render #########################

	protected render() {
	}
}