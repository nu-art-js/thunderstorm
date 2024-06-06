import {_logger_finalDate, _logger_getPrefix, _logger_timezoneOffset, AsyncVoidFunction, BeLogged, LogClient_MemBuffer, LogLevel} from '@nu-art/ts-common';
import {BlessedComponent} from '../blessed/components/BlessedComponent';

export abstract class BAIScreenV2<State extends {} = {}>
	extends BlessedComponent<'screen', {}, State> {

	private onKillCallback?: AsyncVoidFunction;
	private logClient!: LogClient_MemBuffer;

	constructor(logClientKey: string) {
		super('screen', {
			smartCSR: true,
			title: 'Build and Install',
		});
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

	protected getLogClient = () => this.logClient;

	protected abstract onLogUpdated: () => void;

	public create() {
		if (this.alive)
			return;

		super.create(false);
		//Set key handlers on the widget
		this.widget!.key(['escape', 'q', 'C-c'], async () => await this.onKill());
		//Add this log client to BeLogged
		BeLogged.addClient(this.logClient);
		this.alive = true;
	}

	public destroy() {
		if (!this.alive)
			return;

		//Remove this log client to BeLogged
		BeLogged.removeClient(this.logClient);
		super.destroy();
	}

	//######################### Kill Functionality #########################

	protected async onKill() {
		this.logInfo('Kill command received');
		await this.onKillCallback?.();
		this.logInfo('Killed!');
	}

	public setOnKillCallback = (cb: AsyncVoidFunction) => this.onKillCallback = cb;
}