// BaseComponent.MinLogLevel = LogLevel.Debug;
import {LogClient_MemBuffer, LogLevel} from '@nu-art/ts-common';


type OverrideConsoleMethods = 'log' | 'debug' | 'info' | 'warn' | 'error' | 'trace'

export class LogClient_ConsoleInterceptor
	extends LogClient_MemBuffer {

	constructor(name: string, maxBuffers = 10, maxBufferSize = 1024 * 1024) {
		super(name, maxBuffers, maxBufferSize);

		this.overrideConsole();
	}

	private overrideConsole() {
		const originConsole = {...window.console};

		const overrideLog = (logLevel: LogLevel, method: OverrideConsoleMethods) => {
			const logToBuffer = (...args: any[]) => {
				const message = args[0];
				if (!message || typeof message !== 'string') {
					return this.logMessage(logLevel, false, '', args);
				}

				args.shift();
				const formatRegex = /(%[sidfoOc])/g;
				let formatted = '';
				let i = 0;

				let match;
				while ((match = formatRegex.exec(message)) !== null) {
					formatted += message.substring(i, match.index);

					const specifier = match[1];
					const arg = args.shift();
					switch (specifier) {
						case '%c':
							break;
						case '%s':
							formatted += arg;
							break;
						case '%d':
						case '%i':
							formatted += Number.parseInt(arg).toLocaleString();
							break;
						case '%f':
							formatted += Number.parseFloat(arg).toLocaleString();
							break;
						case '%O':
						case '%o':
							formatted += JSON.stringify(arg, null, 2);
							break;
						default:
							formatted += specifier;
					}

					i = formatRegex.lastIndex; // exclude the format specifier
				}

				formatted += message.substring(i);
				this.logMessage(logLevel, false, '', [formatted]);
			};

			return (...args: any[]) => {
				try {
					logToBuffer(...args);
				} catch (e) {
					originConsole['error']('error logging console message with args: ', ...args);
				}

				originConsole[method](...args);
			};
		};

		window.console = {
			...window.console,
			log: overrideLog(LogLevel.Verbose, 'log'),
			debug: overrideLog(LogLevel.Debug, 'debug'),
			info: overrideLog(LogLevel.Info, 'info'),
			warn: overrideLog(LogLevel.Warning, 'warn'),
			error: overrideLog(LogLevel.Error, 'error'),
			trace: overrideLog(LogLevel.Error, 'trace'),
		};
	}
}