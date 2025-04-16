import {DebugFlag, LogLevel, RelativePath} from '@nu-art/ts-common';
import {RuntimeParams} from './core/params/params';
import {PhaseRunner} from './v2/phase-runner/PhaseRunner';


DebugFlag.DefaultLogLevel = RuntimeParams.debug ? LogLevel.Debug : LogLevel.Info;

const runner = new PhaseRunner('./.config/project-config2.ts' as RelativePath);

runner
	.execute()
	.then(() => {
		process.on('SIGINT', () => {
			console.log('completed');
			return process.exit(0);
		});
	})
	.catch(err => {
		process.on('SIGINT', () => {
			console.log('Failed with error: ', err);
			return process.exit(1);
		});
	});