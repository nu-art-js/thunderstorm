import {DebugFlag, LogLevel, RelativePath, StaticLogger} from '@nu-art/ts-common';
import {RuntimeParams} from './core/params/params';
import {PhaseRunner} from './v2/phase-runner/PhaseRunner';
import {allTSUnits} from './v2/unit/thunderstorm';
import {BAIScreen_UnitList} from './v2/screens/BAIScreen_UnitList';

DebugFlag.DefaultLogLevel = RuntimeParams.debug ? LogLevel.Debug : LogLevel.Info;

const runner = new PhaseRunner('./.config/project-config-v2.ts' as RelativePath);
const screen = new BAIScreen_UnitList();
screen.setOnKillCallback(async () => await runner.killRunner());
runner.setScreen(screen);

if (RuntimeParams.runWithThunderstorm)
	runner.registerUnits(allTSUnits);

runner
	.execute()
	.then(() => {
		StaticLogger.logInfo('completed');
	})
	.catch(err => {
		StaticLogger.logError('Failed with error: ', err);
	});