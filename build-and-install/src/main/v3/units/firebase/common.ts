import {LogTypes} from '@nu-art/commando/shell/types';
import {LogLevel} from '@nu-art/ts-common';

const warn = ['missing required API'];
const info = ['=== Deploying', 'functions: Successfully deployed function'];
const infoStartsWith = ['✔ ', 'i '];

export const deployLogFilter = (log: string, std: LogTypes) => {
	if (log.startsWith('⚠ ') || warn.find(str => log.includes(str)))
		return LogLevel.Warning;

	if (infoStartsWith.find(str => log.startsWith(str)) || info.find(str => log.includes(str)))
		return LogLevel.Info;

	if (log.includes('Error:'))
		return LogLevel.Error;

	return LogLevel.Debug;
};
