import {
	asDispatchKey,
	GraphDispatcher,
	OnDispatch,
	type DispatchKey,
} from '../../main/core/graph-dispatcher.js';

export type TraceEvent = { event: 'start' | 'end'; key: string };
export type Trace = TraceEvent[];

export const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export const traced = (trace: Trace, key: DispatchKey, workMs = 8) =>
	async (): Promise<void> => {
		trace.push({event: 'start', key});
		await delay(workMs);
		trace.push({event: 'end', key});
	};

export const endedBeforeStarted = (trace: Trace, earlier: DispatchKey, later: DispatchKey): boolean => {
	const endAt = trace.findIndex(entry => entry.event === 'end' && entry.key === earlier);
	const startAt = trace.findIndex(entry => entry.event === 'start' && entry.key === later);
	return endAt !== -1 && startAt !== -1 && endAt < startAt;
};

export const endedKeys = (trace: Trace): string[] =>
	trace.filter(entry => entry.event === 'end').map(entry => entry.key);

export interface PerformProjectSetup {
	__performProjectSetup(): Promise<void>;
}

export interface OnOrganizationPurging {
	__onOrganizationPurging(organizationId: string): Promise<void>;
}

/*
 * SETUP — prerequisites first (runAfter)
 *
 *   Level 0 (parallel)                 Level 1
 *
 *   permissions ──────────┐
 *                         ├──► capability-groups
 *   org-bootstrap ────────┘
 *
 *   locales                            (no edges — same wave as permissions / org-bootstrap)
 */
export const Key_Permissions = asDispatchKey('permissions-groups');
export const Key_OrgBootstrap = asDispatchKey('org-permissions-bootstrap');
export const Key_CapabilityGroups = asDispatchKey('capability-groups-refresh');
export const Key_Locales = asDispatchKey('default-locales');

/*
 * DELETE — dependents first (runBefore)
 *
 *   Level 0                 Level 1 (parallel)
 *
 *   project-purge ──┬──► org-knowledge
 *                   └──► org-tags
 */
export const Key_ProjectPurge = asDispatchKey('delete.project-purge');
export const Key_OrgKnowledge = asDispatchKey('delete.org-knowledge');
export const Key_OrgTags = asDispatchKey('delete.org-tags');

export const newSetupGraph = () =>
	new GraphDispatcher<PerformProjectSetup, '__performProjectSetup'>('__performProjectSetup');

export const newDeleteGraph = () =>
	new GraphDispatcher<OnOrganizationPurging, '__onOrganizationPurging'>('__onOrganizationPurging');

/**
 * Dummy setup modules. Constructing them registers on the given graph.
 * Edges live on the decorator so the graph is readable next to the class.
 */
export const constructSetupDummies = (graph: GraphDispatcher<PerformProjectSetup, '__performProjectSetup'>, trace: Trace): void => {
	class ModuleBE_DummyPermissions_Class {
		@OnDispatch(graph, {key: Key_Permissions})
		async __performProjectSetup(): Promise<void> {
			await traced(trace, Key_Permissions)();
		}
	}

	class ModuleBE_DummyOrgBootstrap_Class {
		@OnDispatch(graph, {key: Key_OrgBootstrap})
		async __performProjectSetup(): Promise<void> {
			await traced(trace, Key_OrgBootstrap)();
		}
	}

	class ModuleBE_DummyLocales_Class {
		@OnDispatch(graph, {key: Key_Locales})
		async __performProjectSetup(): Promise<void> {
			await traced(trace, Key_Locales)();
		}
	}

	class ModuleBE_DummyCapabilityGroups_Class {
		@OnDispatch(graph, {
			key: Key_CapabilityGroups,
			runAfter: [Key_Permissions, Key_OrgBootstrap],
		})
		async __performProjectSetup(): Promise<void> {
			await traced(trace, Key_CapabilityGroups)();
		}
	}

	new ModuleBE_DummyPermissions_Class();
	new ModuleBE_DummyOrgBootstrap_Class();
	new ModuleBE_DummyLocales_Class();
	new ModuleBE_DummyCapabilityGroups_Class();
};

export const constructDeleteDummies_RunBefore = (
	graph: GraphDispatcher<OnOrganizationPurging, '__onOrganizationPurging'>,
	trace: Trace,
): void => {
	class ModuleBE_DummyProjectPurge_Class {
		@OnDispatch(graph, {
			key: Key_ProjectPurge,
			runBefore: [Key_OrgKnowledge, Key_OrgTags],
		})
		async __onOrganizationPurging(_organizationId: string): Promise<void> {
			await traced(trace, Key_ProjectPurge)();
		}
	}

	class ModuleBE_DummyOrgKnowledge_Class {
		@OnDispatch(graph, {key: Key_OrgKnowledge})
		async __onOrganizationPurging(_organizationId: string): Promise<void> {
			await traced(trace, Key_OrgKnowledge, 4)();
		}
	}

	class ModuleBE_DummyOrgTags_Class {
		@OnDispatch(graph, {key: Key_OrgTags})
		async __onOrganizationPurging(_organizationId: string): Promise<void> {
			await traced(trace, Key_OrgTags, 4)();
		}
	}

	new ModuleBE_DummyProjectPurge_Class();
	new ModuleBE_DummyOrgKnowledge_Class();
	new ModuleBE_DummyOrgTags_Class();
};

export const constructDeleteDummies_RunAfter = (
	graph: GraphDispatcher<OnOrganizationPurging, '__onOrganizationPurging'>,
	trace: Trace,
): void => {
	class ModuleBE_DummyProjectPurge_Class {
		@OnDispatch(graph, {key: Key_ProjectPurge})
		async __onOrganizationPurging(_organizationId: string): Promise<void> {
			await traced(trace, Key_ProjectPurge)();
		}
	}

	class ModuleBE_DummyOrgKnowledge_Class {
		@OnDispatch(graph, {key: Key_OrgKnowledge, runAfter: [Key_ProjectPurge]})
		async __onOrganizationPurging(_organizationId: string): Promise<void> {
			await traced(trace, Key_OrgKnowledge)();
		}
	}

	class ModuleBE_DummyOrgTags_Class {
		@OnDispatch(graph, {key: Key_OrgTags, runAfter: [Key_ProjectPurge]})
		async __onOrganizationPurging(_organizationId: string): Promise<void> {
			await traced(trace, Key_OrgTags)();
		}
	}

	new ModuleBE_DummyProjectPurge_Class();
	new ModuleBE_DummyOrgKnowledge_Class();
	new ModuleBE_DummyOrgTags_Class();
};
