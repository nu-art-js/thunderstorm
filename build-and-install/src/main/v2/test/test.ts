import {allPhases} from '../phase';
import {PhaseRunner} from '../phase-runner/PhaseRunner';

const runner = new PhaseRunner(allPhases);

// RuntimeParams.help = true;

runner.execute()
	.then(() => console.log('Completed'))
	.catch(err => {
		console.error(err);
	});