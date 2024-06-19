import {Widgets} from 'blessed';
import {PhaseRunner_OnPhaseChange, PhaseRunner_OnUnitsChange, PhaseRunner_OnUnitStatusChange} from '../phase-runner/PhaseRunnerDispatcher';
import {Phase} from '../phase';
import {BaseUnit} from '../unit/core';
import {BAIScreen} from './BAIScreen';
import {MemKey_PhaseRunner} from '../phase-runner/consts';
import {PhaseRunner} from '../phase-runner/PhaseRunner';
import {RuntimeParams} from '../../core/params/params';


type State = {
	currentPhaseName?: string;
	selectedUnit?: BaseUnit;
};

export class BAIScreen_UnitList
	extends BAIScreen<State>
	implements PhaseRunner_OnPhaseChange,
						 PhaseRunner_OnUnitStatusChange,
						 PhaseRunner_OnUnitsChange {

	//######################### Properties #########################

	private units: BaseUnit[] = [];

	//Widgets
	private logWidget!: Widgets.Log;
	private phaseWidget!: Widgets.TextElement;
	private unitWrapperWidget!: Widgets.ListElement;
	private unitWidgets: [
		Widgets.BoxElement, //Containing Box
		Widgets.TextElement, //Unit Label
		Widgets.TextElement //Unit Status
	][] = [];

	//######################### Lifecycle #########################

	constructor() {
		super('bai-unit-list');
	}

	__onPhaseChange(phase: Phase<string>) {
		this.setState({currentPhaseName: phase.name});
	}

	__onUnitStatusChange(unit: BaseUnit) {
		this.renderUnitList();
		this.container.screen.render();
	}

	__onUnitsChange(data: BaseUnit[]) {
		this.destroyUnitListWidget();
		this.createUnitListWidget();
		this.renderUnitList();
	}

	protected onLogUpdated = () => {
		this.renderLogs();
	};

	protected scrollLog(direction: number) {
		// const focusedWidget = this.getFocusedWidget();
		// @ts-ignore
		// console.log(`ZEVEL ${focusedWidget.type}`);
		// if (focusedWidget !== this.logWidget)
		// 	return;

		this.logWidget.scroll(direction);
	}

	//######################### Content Destruction #########################

	protected destroyContent() {
		this.destroyPhaseWidget();
		this.destroyUnitListWidget();
		this.destroyLogWidget();
	}

	private destroyPhaseWidget() {
		this.phaseWidget?.destroy();
	}

	private destroyUnitListWidget() {
		this.unitWrapperWidget?.destroy();
		this.unitWidgets?.forEach(group => group.forEach(widget => widget.destroy()));
	}

	private destroyLogWidget() {
		this.logWidget?.destroy();
	}

	//######################### Content Creation #########################

	protected createContent() {
		//Create widgets
		this.createPhaseWidget();
		this.createUnitListWidget();
		this.createLogWidget();
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
			label: 'phase',
		};
		this.phaseWidget = this.createWidget('text', props);
		this.phaseWidget.on('mouse', (event) => {
			if (event.button === 'left' && event.action === 'mousedown') {
				RuntimeParams.continue = true;
				PhaseRunner.instance.execute().then(() => this.logInfo('Completed')).catch((e) => {
					this.logError('Error: ', e);
				});
			}
		});
	}

	private createUnitListWidget() {
		this.units = MemKey_PhaseRunner.get().getUnits();
		this.destroyUnitListWidget();
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
		this.unitWrapperWidget = this.createWidget('list', props);
		this.units.forEach((unit, i) => this.createUnitItemWidget(unit, i));
	}

	private createUnitItemWidget(unit: BaseUnit, index: number) {
		const containerProps: Widgets.BoxOptions = {
			top: (this.unitWrapperWidget.top as number + 1) + index,
			width: '30%-3',
			left: 2,
			height: 1,
		};

		const labelProps: Widgets.TextOptions = {
			width: '50%',
			height: '100%',
			left: 0,
			align: 'left',
			style: {
				fg: 'blue',
			},
		};

		const statusProps: Widgets.TextOptions = {
			width: '50%',
			height: '100%',
			right: 0,
			align: 'right',
			style: {
				fg: 'blue',
			},
		};

		const containerWidget = this.createWidget('box', containerProps);
		const labelWidget = this.createWidget('text', labelProps);
		const statusWidget = this.createWidget('text', statusProps);

		containerWidget.on('mousedown', () => this.onUnitSelect(unit, index));
		containerWidget.append(labelWidget);
		containerWidget.append(statusWidget);
		this.unitWrapperWidget.pushItem(containerWidget);
		this.unitWidgets.push([containerWidget, labelWidget, statusWidget]);
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
			scrollbar: {
				ch: ' ',
				track: {
					bg: 'grey',
				},
				style: {
					inverse: true,
				},
			},
			interactive: true // This is typically required for focus management
		};
		this.logWidget = this.createWidget('log', props);
	}

	//######################### Render #########################

	protected render() {
		this.renderPhase();
		this.renderUnitList();
		this.renderLogs();
	}

	private renderPhase() {
		this.phaseWidget.setContent(this.state.currentPhaseName ?? 'Initializing');
	}

	private renderUnitList() {
		this.units.forEach((unit, index) => {
			const selected = unit === this.state.selectedUnit;
			const widgets = this.unitWidgets[index];

			widgets[1].setText(unit.config.label);
			widgets[2].setText(unit.getStatus() ?? 'N/A');
			widgets[1].style.bg = selected ? 'blue' : undefined;
			widgets[1].style.fg = selected ? 'white' : 'blue';
			widgets[2].style.bg = selected ? 'blue' : undefined;
			widgets[2].style.fg = selected ? 'white' : 'blue';
		});
	}

	private renderLogs() {
		const content = this.state.selectedUnit ? this.state.selectedUnit.getLogs() : this.getLogs();
		this.logWidget.setLabel(` ${this.state.selectedUnit?.config.label ?? 'All Logs'} `);
		this.logWidget.setContent(content);
	}

	//######################### Events #########################

	private onUnitSelect(unit: BaseUnit, index: number) {
		this.state.selectedUnit = unit === this.state.selectedUnit ? undefined : unit;
		this.renderUnitList();
		this.renderLogs();
		this.container.screen.render();
	}
}

// /Users/tacb0ss/.nvm/versions/node/v18.15.0/bin/ts-node -P /Users/tacb0ss/dev/quai/test/quai-web/_thunderstorm/commando/src/test/tsconfig.json /Users/tacb0ss/dev/quai/test/quai-web/_thunderstorm/commando/src/test/console/controlled-scroll/run.ts
