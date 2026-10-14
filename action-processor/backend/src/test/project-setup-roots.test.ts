import {expect} from 'chai';
import {asDispatchKey, Dispatcher, OnDispatch} from '@nu-art/ts-common';
import {graph_ProjectSetup, runProjectSetup, setProjectSetupRoots} from '../main/Action_SetupProject.js';

const Key_Low = asDispatchKey('test.low');
const Key_Mid = asDispatchKey('test.mid');
const Key_Unused = asDispatchKey('test.unused');
const Key_App = asDispatchKey('test.app');

describe('Project setup - demand-driven from the app root', () => {
	const calls: string[] = [];
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
		graph_ProjectSetup.clear();

		class Module_LowerPackage {
			@OnDispatch(graph_ProjectSetup, {key: Key_Low})
			async low() {
				calls.push('low');
			}

			@OnDispatch(graph_ProjectSetup, {key: Key_Unused, runAfter: [Key_Low]})
			async unused() {
				calls.push('unused');
			}
		}

		class Module_HigherPackage {
			@OnDispatch(graph_ProjectSetup, {key: Key_Mid, runAfter: [Key_Low]})
			async mid() {
				calls.push('mid');
			}
		}

		class Module_App {
			@OnDispatch(graph_ProjectSetup, {key: Key_App, runAfter: [Key_Mid]})
			async app() {
				calls.push('app');
			}
		}

		new Module_LowerPackage();
		new Module_HigherPackage();
		new Module_App();
	});

	afterEach(() => {
		setProjectSetupRoots();
		graph_ProjectSetup.clear();
	});

	it('runs the closure of the app root in dependency order; an unreferenced action does not run', async () => {
		setProjectSetupRoots(Key_App);
		await runProjectSetup();
		expect(calls).to.deep.equal(['low', 'mid', 'app']);
	});

	it('runs no action without an app root', async () => {
		await runProjectSetup();
		expect(calls).to.deep.equal([]);
	});
});
