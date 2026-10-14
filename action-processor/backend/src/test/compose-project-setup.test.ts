import {expect} from 'chai';
import {asDispatchKey, Dispatcher, GraphDispatcher, OnDispatch} from '@nu-art/ts-common';
import {composeProjectSetup, runProjectSetup} from '../main/Action_SetupProject.js';

interface OnTestSetup {
	__onTestSetup(): Promise<void>;
}

describe('composeProjectSetup', () => {
	const calls: string[] = [];
	const graph_A = new GraphDispatcher<OnTestSetup, '__onTestSetup'>('__onTestSetup', {bindByKey: true});
	const graph_B = new GraphDispatcher<OnTestSetup, '__onTestSetup'>('__onTestSetup', {bindByKey: true});
	const Key_A1 = asDispatchKey('test.a1');
	const Key_A2 = asDispatchKey('test.a2');
	const Key_B = asDispatchKey('test.b');

	let previousResolver: typeof Dispatcher.modulesResolver;
	before(() => {
		previousResolver = Dispatcher.modulesResolver;
		Dispatcher.modulesResolver = () => [];
	});
	after(() => {
		Dispatcher.modulesResolver = previousResolver;
	});

	beforeEach(() => {
		calls.length = 0;
		graph_A.clear();
		graph_B.clear();

		class Module_A {
			@OnDispatch(graph_A, {key: Key_A2, runAfter: [Key_A1]})
			async second() {
				calls.push('a2');
			}

			@OnDispatch(graph_A, {key: Key_A1})
			async first() {
				calls.push('a1');
			}
		}

		class Module_B {
			@OnDispatch(graph_B, {key: Key_B})
			async only() {
				calls.push('b');
			}
		}

		new Module_A();
		new Module_B();
	});

	afterEach(() => composeProjectSetup());

	it('runs only the graphs the app composed, in order, each in its own dependency order', async () => {
		composeProjectSetup(graph_B, graph_A);
		await runProjectSetup();
		expect(calls).to.deep.equal(['b', 'a1', 'a2']);
	});

	it('runs no graph when the app composed none', async () => {
		await runProjectSetup();
		expect(calls).to.deep.equal([]);
	});
});
