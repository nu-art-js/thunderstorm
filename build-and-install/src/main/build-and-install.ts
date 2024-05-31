import {DebugFlag, LogLevel, StaticLogger} from '@nu-art/ts-common';
import {RuntimeParams} from './core/params/params';
import {PhaseRunner} from './v2/phase-runner/PhaseRunner';
import {allPhases} from './v2/phase';
import {BAI_ListScreen} from './v2/screens/list-screen';

DebugFlag.DefaultLogLevel = RuntimeParams.debug ? LogLevel.Debug : LogLevel.Info;

const runner = new PhaseRunner(allPhases)
	.registerProject('./.config/project-config-v2.ts');

runner
	.execute(async () => {
		const logger = new BAI_ListScreen(runner.getUnits());
		logger.create();
		logger.setKillCB(runner.killRunner);
	})
	.then(() => {
		StaticLogger.logInfo('completed');
	})
	.catch(err => {
		StaticLogger.logError('Failed with error: ', err);
	});