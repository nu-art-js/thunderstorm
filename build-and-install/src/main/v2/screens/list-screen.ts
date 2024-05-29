import {ConsoleContainer} from '@nu-art/commando/console/ConsoleContainer';
import {Widgets} from 'blessed';
import {dispatcher_PhaseChange, dispatcher_UnitStatusChange, PhaseRunnerEventListener} from '../phase-runner/PhaseRunnerDispatcher';
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
	currentPhase?: Phase<string>;
};

export class BAI_ListScreen
	extends ConsoleContainer<'screen', State>
	implements PhaseRunnerEventListener {

	private units: BaseUnit[];
	private logClient: LogClient_MemBuffer;
	private onKillCB?: AsyncVoidFunction;

	//Widgets
	private unitTableWidget!: Widgets.ListTableElement;
	private logWidget!: Widgets.Log;
	private phaseWidget!: Widgets.TextElement;

	//######################### Lifecycle #########################

	__onPhaseChange(phase: Phase<string>) {
		this.setState({currentPhase: phase});
	}

	__onUnitStatusChange(unit: BaseUnit) {
		this.renderUnitList();
		//Render the UnitTableWidget specifically
		this.unitTableWidget.screen.render();
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
					await this.onKillCB?.();
					return process.exit(1);
				}
			}]
		);
		this.units = units;
		this.logClient = new LogClient_MemBuffer('log-out.txt');
		this.initLogger();
	}

	private initLogger() {
		BeLogged.removeConsole(LogClient_Terminal);
		BeLogged.addClient(this.logClient);
		this.logClient.setForTerminal();
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
			height: '30%',
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
		const props: Widgets.ListTableOptions = {
			top: 3,
			left: 0,
			width: '30%',
			height: '70%',
			key: true,
			border: {type: 'line'},
			align: 'left',
			tags: true,
			style: {
				border: {fg: 'blue'},
				header: {bold: true,},
				cell: {fg: 'blue', selected: {bg: 'blue', fg: 'white'}},
			},
			mouse: true,
			interactive: true,
		};
		this.unitTableWidget = this.createWidget('listTable', props);
	}

	private createLogWidget() {
		const props: Widgets.LogOptions = {
			top: 0,
			right: 0,
			width: '70%',
			height: '100%',
			mouse: true,
			tags: true,
			border: {type:'line'},
			style: {
				border: {fg: 'blue'}
			},
			valign: 'top',
			align: 'left'
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
		this.phaseWidget.setContent(this.state.currentPhase?.name ?? 'Initializing');
	}

	private renderUnitList() {
		const scrollPosition = this.unitTableWidget.getScroll();
		const rows = this.units.reduce((rows, unit) => {
			rows.push([unit.config.label, unit.getStatus() ?? 'N/A']);
			return rows;
		}, [['Unit Name', 'Status']]);
		this.unitTableWidget.setData(rows);
		this.unitTableWidget.setScroll(scrollPosition);
	}

	private renderLogs() {
		this.logWidget.setContent(this.logClient.buffers[0]);
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
}