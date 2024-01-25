import {_keys} from '../../utils/object-tools';
import {_logger_finalDate, _logger_getPrefix, _logger_timezoneOffset, LogClient} from './LogClient';
import {LogLevel, LogParam} from './types';

const PrimitiveLogParams: LogParam[] = ['string', 'number', 'boolean'];

export type LoggerStyleObject = {
	color?: string;
	'background-color'?: string;
	'font-weight'?: 'bold' | 'normal';
	padding?: string;
	'border-radius'?: string;
}

class LogClient_BrowserGroups_Class
	extends LogClient {

	constructor() {
		super();
		this.setComposer(this.newComposer);
	}

	// ################## Class Methods - Logging ##################

	private newComposer(tag: string, level: LogLevel) {
		_logger_finalDate.setTime(Date.now() - _logger_timezoneOffset);
		const date = _logger_finalDate.toISOString().replace(/T/, '_').replace(/Z/, '').substring(0, 23);
		return `%c${_logger_getPrefix(level)}%c${date}%c${tag}`;
	}

	protected logMessage(level: LogLevel, bold: boolean, prefix: string, toLog: LogParam[]): void {
		if (!prefix.startsWith('%c'))
			prefix = `%c ${prefix}`;

		//If the first log param is a primitive combine it with the prefix
		if (PrimitiveLogParams.includes(typeof toLog[0])) {
			prefix += ` ${toLog[0]}`;
			toLog.shift();
		}

		//If no more items to log
		if (!toLog.length)
			return this.logSingle(level, bold, prefix);

		this.logGroup(level, bold, prefix, toLog);
	}

	private logSingle = (logLevel: LogLevel, bold: boolean, toLog: string) => {
		console.log(
			toLog,
			this.getLogLevelStyling(logLevel, bold),
			this.getTimestampStyling(bold, logLevel),
			this.getTagStyling(logLevel, bold)
		);
	};

	private logGroup = (logLevel: LogLevel, bold: boolean, prefix: string, toLog: LogParam[]) => {
		console.group(
			prefix,
			this.getLogLevelStyling(logLevel, bold),
			this.getTimestampStyling(bold, logLevel),
			this.getTagStyling(logLevel, bold)
		);
		toLog.forEach(logParam => console.log(logParam));
		console.groupEnd();
	};

	// ################## Class Methods - Styling ##################

	private getLogLevelColor = (logLevel: LogLevel): string => {
		switch (logLevel) {
			case LogLevel.Verbose:
				return '#444444';
			case LogLevel.Debug:
				return '#3066be';
			case LogLevel.Info:
				return '#52a447';
			case LogLevel.Warning:
				return '#ed820e';
			case LogLevel.Error:
				return '#d14348';
			default:
				return 'transparent';
		}
	};

	private composeStyleString = (styleObject: LoggerStyleObject): string => {
		const styleArr = _keys(styleObject).map(key => `${key}: ${styleObject[key]}`);
		return styleArr.join(';') + ';';
	};

	private getLogLevelStyling = (logLevel: LogLevel, bold: boolean): string => {
		return this.composeStyleString({
			color: '#ffffff',
			'background-color': this.getLogLevelColor(logLevel),
			'font-weight': bold ? 'bold' : 'normal',
			padding: '2px 5px',
			'border-radius': '4px 0 0 4px',
		});
	};

	private getTimestampStyling = (bold: boolean, logLevel: LogLevel): string => {
		return this.composeStyleString({
			color: '#ffffff',
			'background-color': this.getLogLevelColor(logLevel),
			'font-weight': bold ? 'bold' : 'normal',
			padding: '2px 5px',
			'border-radius': '0 4px 4px 0',
		});
	};

	private getTagStyling = (logLevel: LogLevel, bold: boolean): string => {
		return this.composeStyleString({
			color: this.getLogLevelColor(logLevel),
			'font-weight': bold ? 'bold' : 'normal',
			padding: '2px 5px',
		});
	};
}

export const LogClient_BrowserGroups = new LogClient_BrowserGroups_Class();