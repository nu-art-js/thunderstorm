import {ConsoleContainer} from '@nu-art/commando/console/ConsoleContainer';
import {Widgets} from 'blessed';
import {
	dispatcher_PhaseChange,
	dispatcher_UnitStatusChange,
	PhaseRunnerEventListener
} from '../phase-runner/PhaseRunnerDispatcher';
import {Phase} from '../phase';
import {BaseUnit} from '../unit/core';
import {
	_logger_finalDate,
	_logger_getPrefix,
	_logger_timezoneOffset,
	AsyncVoidFunction,
	BeLogged,
	LogClient_MemBuffer,
	LogClient_Terminal,
	LogLevel
} from '@nu-art/ts-common';

type ScreenKeyBinding = {
	keys: string[];
	callback: VoidFunction;
};

type State = {
	currentPhaseName?: string;
	selectedUnit?: BaseUnit;
};

export class BAI_ListScreen
	extends ConsoleContainer<'screen', State>
	implements PhaseRunnerEventListener {

	private units: BaseUnit[];
	private logClient!: LogClient_MemBuffer;
	private onKillCB?: AsyncVoidFunction;

	//Widgets
	private unitWrapperWidget!: Widgets.ListElement;
	private unitWidgets: [
		Widgets.BoxElement, //Containing Box
		Widgets.TextElement, //Unit Label
		Widgets.TextElement //Unit Status
	][] = [];
	private logWidget!: Widgets.Log;
	private phaseWidget!: Widgets.TextElement;

	//######################### Lifecycle #########################

	__onPhaseChange(phase: Phase<string>) {
		this.setState({currentPhaseName: phase.name});
	}

	__onUnitStatusChange(unit: BaseUnit) {
		this.renderUnitList();
		this.container.screen.render();
	}

	/**
	 * Creates an instance of ConsoleScreen.
	 *
	 * @param units - The units this screen should keep track of
	 * @param {Widgets.IScreenOptions} [props] - The properties to apply to the screen widget.
	 * @param {ScreenKeyBinding[]} [keyBinding] - An array of key bindings for the screen widget.
	 */
	constructor(units: BaseUnit[], props?: Widgets.IScreenOptions, keyBinding: ScreenKeyBinding[] = []) {
		super(
			'screen',
			{smartCSR: true, title: 'Build and Install'},
			[{
				keys: ['escape', 'q', 'C-c'],
				callback: async () => {
					this.logInfo('Kill command received');
					await this.onKillCB?.();
					this.logInfo('Killed!');
					return process.exit(1);
				}
			}]
		);
		this.units = units;
	}

	private initLogger() {
		this.logClient = new LogClient_MemBuffer('log-out.txt');
		BeLogged.removeConsole(LogClient_Terminal);
		BeLogged.addClient(this.logClient);
		this.logClient.setComposer((tag: string, level: LogLevel): string => {
			_logger_finalDate.setTime(Date.now() - _logger_timezoneOffset);
			const date = _logger_finalDate.toISOString().replace(/T/, '_').replace(/Z/, '').substring(0, 23).split('_')[1];
			return `  ${date} ${_logger_getPrefix(level)} ${tag}:  `;
		});

		this.logClient.setLogAppendedListener(() => {
			this.renderLogs();
		});
	}

	//######################### Content Creation #########################

	public create() {
		if (!this.logClient)
			this.initLogger();
		super.create();
		return this;
	}

	protected createContent() {
		this.createPhaseWidget();
		this.createUnitListWidget();
		this.createLogWidget();
		dispatcher_UnitStatusChange.addListener(this);
		dispatcher_PhaseChange.addListener(this);
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
			styles: {
				border: {fg: 'blue'},
				fg: 'blue',
			},
			align: 'center',
		};
		this.phaseWidget = this.createWidget('text', props);
	}

	private createUnitListWidget() {
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
			valign: 'top',
			align: 'left',
			mouse: true,
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
		const scrollPosition = this.logWidget.getScroll();
		const content = this.state.selectedUnit ? this.state.selectedUnit.getLogs() : this.logClient.buffers[0];
		this.logWidget.setContent(content);
		this.logWidget.setScroll(scrollPosition);
	}

	//######################### Kill #########################

	public setKillCB(cb: AsyncVoidFunction) {
		this.onKillCB = cb;
		// Remove all listeners to the process kill event
		// process.listeners('SIGINT').forEach(listener => process.removeListener('SIGINT', listener));
		//Register a new listener for process kill event
		// process.on('SIGINT', async () => {
		// 	await cb();
		// 	this.dispose();
		// 	process.exit(0);
		// });
	}

	//######################### Events #########################

	private onUnitSelect(unit: BaseUnit, index: number) {
		this.state.selectedUnit = unit === this.state.selectedUnit ? undefined : unit;
		this.renderUnitList();
		this.renderLogs();
		this.container.screen.render();
	}
}