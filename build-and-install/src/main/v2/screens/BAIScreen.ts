import {ConsoleContainer} from '@nu-art/commando/console/ConsoleContainer';
import {
	AsyncVoidFunction,
	BeLogged,
	LogClient_MemBuffer,
	LogClient_Terminal,
	LogLevel,
	_logger_finalDate,
	_logger_getPrefix,
	_logger_timezoneOffset
} from '@nu-art/ts-common';

export abstract class BAIScreen<State extends {} = {}>
	extends ConsoleContainer<'screen', State> {

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
	constructor() {
		super('screen',
			{smartCSR: true, title: 'Build and Install'},
			[{
				keys: ['escape', 'q', 'C-c'],
				callback: async () => await this.onKill(),
			}]);
		this.createLogClient();
	}

	private createLogClient() {
		//Create the log client
		this.logClient = new LogClient_MemBuffer('log-out.txt');
		//Set for terminal flag
		this.logClient.setForTerminal();
		//Set log composer to print logs with timestamps
		this.logClient.setComposer((tag: string, level: LogLevel): string => {
			_logger_finalDate.setTime(Date.now() - _logger_timezoneOffset);
			const date = _logger_finalDate.toISOString().replace(/T/, '_').replace(/Z/, '').substring(0, 23).split('_')[1];
			return `  ${date} ${_logger_getPrefix(level)} ${tag}:  `;
		});
		//Connect callback to listen when log is appended
		this.logClient.setLogAppendedListener(()=>{
			this.onLogUpdated()
		});
	}

	//######################### Log Client Interaction #########################

	public startLogClient = () => {
		//Remove terminal from BeLogged
		BeLogged.removeConsole(LogClient_Terminal);
		//Add this log client to BeLogged
		BeLogged.addClient(this.logClient);
	};

	public stopLogClient = () => {
		BeLogged.removeClient(this.logClient);
	};

	protected abstract onLogUpdated: () => void;

	protected getLogs = () => this.logClient.buffers[0];

	//######################### Kill Functionality #########################

	protected async onKill() {
		this.logInfo('Kill command received');
		await this.onKillCallback?.();
		this.logInfo('Killed!');
		return process.exit(1);
	}

	public setOnKillCallback = (cb: AsyncVoidFunction) => this.onKillCallback = cb;
}