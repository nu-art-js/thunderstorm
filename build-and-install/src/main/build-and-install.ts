import {DebugFlag, LogLevel, RelativePath} from '@thunder-storm/common';
import {RuntimeParams} from './core/params/params';
import {PhaseRunner} from './v2/phase-runner/PhaseRunner';
import {allTSUnits} from './v2/unit/thunderstorm';


DebugFlag.DefaultLogLevel = RuntimeParams.debug ? LogLevel.Debug : LogLevel.Info;

const runner = new PhaseRunner('./.config/project-config.ts' as RelativePath);

if (RuntimeParams.runWithThunderstorm)
	runner.registerUnits(allTSUnits);

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