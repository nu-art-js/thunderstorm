import {_logger_finalDate, _logger_getPrefix, _logger_timezoneOffset, AsyncVoidFunction, BeLogged, LogClient_MemBuffer, LogLevel} from '@nu-art/ts-common';
import {dispatcher_PhaseChange, dispatcher_UnitChange, dispatcher_UnitStatusChange} from '../phase-runner/PhaseRunnerDispatcher';
import {ConsoleScreen} from '@nu-art/commando/console/ConsoleScreen';


export abstract class BAIScreen<State extends {} = {}>
	extends ConsoleScreen<State> {

	//######################### Class Properties #########################

	private onKillCallback?: AsyncVoidFunction;
	private logClient!: LogClient_MemBuffer;

	//######################### Initialization #########################

	/**
	 * Creates an instance of ConsoleScreen.
	 *
	 * @param {Widgets.IScreenOptions} [props] - The properties to apply to the screen widget.
	 * @param {ScreenKeyBinding[]} [keyBinding] - An array of key bindings for the screen widget.
	 */
	constructor(logClientKey: string) {
		super({smartCSR: true, title: 'Build and Install'},
			[
				{
					keys: ['escape', 'q', 'C-c'],
					callback: async () => await this.onKill(),
				},
				{
					keys: ['up'], // Scroll up on Control-U
					callback: () => {
						this.scrollLog(-1);
					},
				},
				{
					keys: ['down'], // Scroll down on Control-D
					callback: () => {
						this.scrollLog(1);
					},
				},

			]);
		this.scrollLog.bind(this);
		this.createLogClient(logClientKey);
	}

	private createLogClient(logClientKey: string) {
		//Create the log client
		this.logClient = new LogClient_MemBuffer(`${logClientKey}.txt`);
		//Set for terminal flag
		this.logClient.keepLogsNaturalColors();
		//Set log composer to print logs with timestamps
		this.logClient.setComposer((tag: string, level: LogLevel): string => {
			_logger_finalDate.setTime(Date.now() - _logger_timezoneOffset);
			const date = _logger_finalDate.toISOString().replace(/T/, '_').replace(/Z/, '').substring(0, 23).split('_')[1];
			return `  ${date} ${_logger_getPrefix(level)} ${tag}:  `;
		});
		//Connect callback to listen when log is appended
		this.logClient.setLogAppendedListener(() => {
			this.onLogUpdated();
		});
	}

	protected abstract scrollLog(direction: number): void

	//######################### Log Client Interaction #########################

	protected abstract onLogUpdated: () => void;

	protected getLogs = () => this.logClient.buffers[0];

	public startScreen = () => {
		//Start listening on dispatchers
		dispatcher_UnitStatusChange.addListener(this);
		dispatcher_PhaseChange.addListener(this);
		dispatcher_UnitChange.addListener(this);
		//Add this log client to BeLogged
		BeLogged.addClient(this.logClient);
		this.create();
	};

	public stopScreen = () => {
		//Stop listening on dispatchers
		dispatcher_UnitStatusChange.removeListener(this);
		dispatcher_PhaseChange.removeListener(this);
		dispatcher_UnitChange.removeListener(this);
		//Remove this log client to BeLogged
		BeLogged.removeClient(this.logClient);
		this.destroyContent();
		this.container.destroy();
	};

	protected abstract destroyContent(): void;

	//######################### Kill Functionality #########################

	protected async onKill() {
		this.logInfo('Kill command received');
		await this.onKillCallback?.();
		this.logInfo('Killed!');
	}

	public setOnKillCallback = (cb: AsyncVoidFunction) => this.onKillCallback = cb;
}