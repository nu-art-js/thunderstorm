import {expect} from 'chai';
import {sleep} from '@nu-art/ts-common';
import {BaiParams, BaseUnit, Phase, PhaseManager, RunningStatusHandler, phase_Test, phaseKey_Test} from '../../_common.js';
import {PhaseAggregatedException} from '../../../main/exceptions/PhaseAggregatedException.js';

function packages(count: number, method: string, run: (index: number) => Promise<void>): BaseUnit[] {
	return Array.from({length: count}, (_, index) => {
		const unit: Record<string, unknown> = {
			config: {key: `unit-${index}`, label: `unit-${index}`},
		};
		unit[method] = () => run(index);
		return unit as unknown as BaseUnit;
	});
}

async function runPhase(phase: Phase<any>, units: BaseUnit[], params: Partial<BaiParams> = {}) {
	const keys = units.map(unit => unit.config.key);
	const status = new RunningStatusHandler('output-folder', params as BaiParams).isolate();
	const manager = new PhaseManager(status, [[phase]], [units], keys, keys);
	await manager.execute(await manager.calculateExecutionSteps());
}

describe('PhaseManager parallel cap', () => {
	it('the test phase allows 2 packages at once', () => {
		expect(phase_Test.parallel).to.equal(2);
		expect(phase_Test.key).to.equal(phaseKey_Test);
	});

	it('ten packages with parallel 2 stay at a peak of 2', async () => {
		let current = 0;
		let peak = 0;
		let done = 0;
		const phase: Phase<'work'> = {key: 'work', name: 'Work', method: 'work', parallel: 2};
		const units = packages(10, 'work', async () => {
			current++;
			peak = Math.max(peak, current);
			await sleep(30);
			current--;
			done++;
		});

		await runPhase(phase, units);

		expect(peak).to.equal(2);
		expect(done).to.equal(10);
		expect(current).to.equal(0);
	});

	it('ten packages with no parallel count all run at once', async () => {
		let current = 0;
		let peak = 0;
		let release: () => void = () => undefined;
		const opened = new Promise<void>(resolve => {
			release = resolve;
		});
		const phase: Phase<'work'> = {key: 'work', name: 'Work', method: 'work'};
		const units = packages(10, 'work', async () => {
			current++;
			peak = Math.max(peak, current);
			if (current === 10)
				release();
			await opened;
		});

		await runPhase(phase, units);

		expect(peak).to.equal(10);
		expect(current).to.equal(10);
	});

	it('a thrown package releases its slot and the other packages finish', async () => {
		let current = 0;
		let peak = 0;
		let done = 0;
		const phase: Phase<'runTests'> = {
			key: phaseKey_Test,
			name: 'Test',
			method: 'runTests',
			parallel: 2,
		};
		const units = packages(10, 'runTests', async (index) => {
			if (index === 0)
				throw new Error('package failed');

			current++;
			peak = Math.max(peak, current);
			await sleep(20);
			current--;
			done++;
		});

		try {
			await runPhase(phase, units, {keepGoing: true});
			expect.fail('the thrown package must fail the step');
		} catch (error) {
			expect(error).to.be.instanceOf(PhaseAggregatedException);
		}

		expect(peak).to.be.at.most(2);
		expect(done).to.equal(9);
		expect(current).to.equal(0);
	});
});
