import {expect} from 'chai';
import {BadImplementationException} from '../../main/core/exceptions/exceptions.js';
import {Dispatcher} from '../../main/core/dispatcher.js';
import {OnDispatch} from '../../main/core/graph-dispatcher.js';
import {
	constructDeleteDummies_RunAfter,
	constructDeleteDummies_RunBefore,
	constructSetupDummies,
	endedBeforeStarted,
	endedKeys,
	Key_CapabilityGroups,
	Key_Locales,
	Key_OrgBootstrap,
	Key_OrgKnowledge,
	Key_OrgTags,
	Key_Permissions,
	Key_ProjectPurge,
	newDeleteGraph,
	newSetupGraph,
	traced,
	type PerformProjectSetup,
	type Trace,
} from './dummy-modules.js';

describe('GraphDispatcher', () => {

	describe('setup diamond — dummy modules, runAfter', () => {
		it('permissions + org-bootstrap + locales (wave 0) finish before capability-groups', async () => {
			const graph = newSetupGraph();
			const trace: Trace = [];
			constructSetupDummies(graph, trace);

			await graph.dispatch();

			expect(endedKeys(trace)).to.have.members([
				Key_Permissions,
				Key_OrgBootstrap,
				Key_Locales,
				Key_CapabilityGroups,
			]);
			expect(endedBeforeStarted(trace, Key_Permissions, Key_CapabilityGroups)).to.equal(true);
			expect(endedBeforeStarted(trace, Key_OrgBootstrap, Key_CapabilityGroups)).to.equal(true);
			expect(endedBeforeStarted(trace, Key_Locales, Key_CapabilityGroups)).to.equal(true);
		});
	});

	describe('delete children — dummy modules, runBefore', () => {
		it('project-purge finishes before org-knowledge and org-tags; those two may overlap', async () => {
			const graph = newDeleteGraph();
			const trace: Trace = [];
			constructDeleteDummies_RunBefore(graph, trace);

			await graph.dispatch('org-1');

			expect(endedBeforeStarted(trace, Key_ProjectPurge, Key_OrgKnowledge)).to.equal(true);
			expect(endedBeforeStarted(trace, Key_ProjectPurge, Key_OrgTags)).to.equal(true);
		});

		it('runAfter on the consumers is the same clock as runBefore on the child', async () => {
			const graph = newDeleteGraph();
			const trace: Trace = [];
			constructDeleteDummies_RunAfter(graph, trace);

			await graph.dispatch('org-1');

			expect(endedBeforeStarted(trace, Key_ProjectPurge, Key_OrgKnowledge)).to.equal(true);
			expect(endedBeforeStarted(trace, Key_ProjectPurge, Key_OrgTags)).to.equal(true);
		});
	});

	describe('diamond A → B,C → D', () => {
		it('runs B and C in one wave after A, and D after both', async () => {
			const graph = newSetupGraph();
			const trace: Trace = [];
			const Key_A = Key_Permissions;
			const Key_B = Key_OrgBootstrap;
			const Key_C = Key_Locales;
			const Key_D = Key_CapabilityGroups;

			graph.register({key: Key_A, run: traced(trace, Key_A)});
			graph.register({key: Key_B, runAfter: [Key_A], run: traced(trace, Key_B, 12)});
			graph.register({key: Key_C, runAfter: [Key_A], run: traced(trace, Key_C, 12)});
			graph.register({key: Key_D, runAfter: [Key_B, Key_C], run: traced(trace, Key_D)});

			await graph.dispatch();

			expect(endedBeforeStarted(trace, Key_A, Key_B)).to.equal(true);
			expect(endedBeforeStarted(trace, Key_A, Key_C)).to.equal(true);
			expect(endedBeforeStarted(trace, Key_B, Key_D)).to.equal(true);
			expect(endedBeforeStarted(trace, Key_C, Key_D)).to.equal(true);
			const bStart = trace.findIndex(entry => entry.event === 'start' && entry.key === Key_B);
			const cEnd = trace.findIndex(entry => entry.event === 'end' && entry.key === Key_C);
			expect(bStart).to.be.lessThan(cEnd);
		});
	});

	describe('empty and errors', () => {
		it('empty graph dispatch is a no-op', async () => {
			await newSetupGraph().dispatch();
		});

		it('duplicate key throws', () => {
			const graph = newSetupGraph();
			graph.register({key: Key_Permissions, run: async () => undefined});
			expect(() => graph.register({key: Key_Permissions, run: async () => undefined}))
				.to.throw(BadImplementationException, /Duplicate DispatchKey/);
		});

		it('unknown runAfter key throws', async () => {
			const graph = newSetupGraph();
			graph.register({
				key: Key_CapabilityGroups,
				runAfter: [Key_Permissions],
				run: async () => undefined,
			});
			try {
				await graph.dispatch();
				expect.fail('expected unknown key');
			} catch (e) {
				expect(e).to.be.instanceOf(BadImplementationException);
				expect(String(e)).to.match(/unknown key/);
			}
		});

		it('cycle throws', async () => {
			const graph = newSetupGraph();
			graph.register({key: Key_Permissions, runAfter: [Key_CapabilityGroups], run: async () => undefined});
			graph.register({key: Key_CapabilityGroups, runAfter: [Key_Permissions], run: async () => undefined});
			try {
				await graph.dispatch();
				expect.fail('expected cycle');
			} catch (e) {
				expect(e).to.be.instanceOf(BadImplementationException);
				expect(String(e)).to.match(/Cycle/);
			}
		});
	});

	describe('@OnDispatch', () => {
		it('registers the bound __xxxxx method and passes dispatch args', async () => {
			const graph = newDeleteGraph();
			const seen: string[] = [];

			class ModuleBE_DummyProject_Class {
				@OnDispatch(graph, {key: Key_ProjectPurge})
				async __onOrganizationPurging(organizationId: string): Promise<void> {
					seen.push(organizationId);
				}
			}

			new ModuleBE_DummyProject_Class();
			await graph.dispatch('org-42');
			expect(seen).to.deep.equal(['org-42']);
		});

		it('throws when the method name is not the graph __xxxxx', () => {
			const graph = newSetupGraph();

			expect(() => {
				class ModuleBE_WrongName_Class {
					@OnDispatch(graph, {key: Key_Permissions})
					async refreshAll(): Promise<void> {
					}
				}

				void ModuleBE_WrongName_Class;
			}).to.throw(BadImplementationException, /must be named __performProjectSetup/);
		});
	});

	describe('separate stacks', () => {
		it('graph.dispatch does not run a legacy module that only exists on Dispatcher', async () => {
			const graph = newSetupGraph();
			const graphRan: string[] = [];
			const legacyRan: string[] = [];

			graph.register({
				key: Key_Permissions,
				run: async () => {
					graphRan.push('graph');
				},
			});

			class ModuleBE_LegacySetup_Class {
				async __performProjectSetup(): Promise<void> {
					legacyRan.push('legacy');
				}
			}

			const legacyModule = new ModuleBE_LegacySetup_Class();
			const previousResolver = Dispatcher.modulesResolver;
			Dispatcher.modulesResolver = () => [legacyModule];

			try {
				await graph.dispatch();
				expect(graphRan).to.deep.equal(['graph']);
				expect(legacyRan).to.deep.equal([]);

				const legacy = new Dispatcher<PerformProjectSetup, '__performProjectSetup'>('__performProjectSetup');
				await legacy.dispatchModuleAsync();
				expect(legacyRan).to.deep.equal(['legacy']);
			} finally {
				Dispatcher.modulesResolver = previousResolver;
			}
		});
	});
});
