/*
 * @nu-art/action-processor-frontend - Dev Tools screen
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {useEffect, useState} from 'react';
import type {ActionMetaData} from '@nu-art/action-processor-shared';
import {ModuleFE_ActionProcessor} from '../ModuleFE_ActionProcessor.js';
import {DevToolsActionDetail, type DevToolsLogLine} from './DevToolsActionDetail.js';
import {DevToolsActionList} from './DevToolsActionList.js';
import {
	actionTitle,
	browserSelectionStore,
	clearStoredSelection,
	errorText,
	filterDevToolsActions,
	formatClock,
	formatDuration,
	groupDevToolsActions,
	readStoredSelection,
	resolveSelectedAction,
	runEnabled,
	writeStoredSelection,
	type DevToolsAction,
} from './dev-tools-model.js';
import './ATS_ActionProcessor.scss';

function readActions(rows: ActionMetaData[]): DevToolsAction[] {
	return rows.map(row => {
		const extra = row as DevToolsAction;
		return {
			key: row.key,
			description: row.description,
			group: row.group,
			label: extra.label,
			destructive: extra.destructive === true,
		};
	});
}

export function ATS_ActionProcessor(props: {canRun?: boolean}) {
	const canRun = props.canRun !== false;
	const [actions, setActions] = useState<DevToolsAction[]>([]);
	const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
	const [loadError, setLoadError] = useState<string | undefined>();
	const [query, setQuery] = useState('');
	const [destructiveOnly, setDestructiveOnly] = useState(false);
	const [selectedKey, setSelectedKey] = useState<string | undefined>(() => readStoredSelection(browserSelectionStore()));
	const [confirm, setConfirm] = useState('');
	const [runningKey, setRunningKey] = useState<string | undefined>();
	const [lastRuns, setLastRuns] = useState<Record<string, string>>({});
	const [log, setLog] = useState<DevToolsLogLine[]>([]);

	useEffect(() => {
		let live = true;
		ModuleFE_ActionProcessor.vv1.list({}).executeSync()
			.then(rows => {
				if (!live)
					return;

				if (!Array.isArray(rows))
					throw new Error('The action list response was not a list.');

				setActions(readActions(rows));
				setPhase('ready');
			})
			.catch((error: unknown) => {
				if (!live)
					return;

				setActions([]);
				setLoadError(errorText(error, 'The action list failed.'));
				setPhase('error');
			});
		return () => {
			live = false;
		};
	}, []);

	const visible = filterDevToolsActions(actions, query, destructiveOnly);
	const groups = groupDevToolsActions(visible);
	const selected = resolveSelectedAction(actions, visible, selectedKey);
	const running = selected !== undefined && runningKey === selected.key;
	const runIsEnabled = runEnabled({canRun, running, action: selected, confirm});
	const environment = typeof window === 'undefined' ? '' : window.location.host;

	useEffect(() => {
		setConfirm('');
	}, [selected?.key]);

	useEffect(() => {
		if (phase !== 'ready' || !selectedKey)
			return;

		if (actions.some(action => action.key === selectedKey))
			return;

		setSelectedKey(undefined);
		clearStoredSelection(browserSelectionStore());
	}, [phase, actions, selectedKey]);

	const onSelect = (key: string) => {
		setSelectedKey(key);
		writeStoredSelection(browserSelectionStore(), key);
	};

	const onRun = () => {
		if (!selected || !runEnabled({canRun, running, action: selected, confirm}))
			return;

		const action = selected;
		const key = action.key;
		const started = Date.now();
		setRunningKey(key);
		void ModuleFE_ActionProcessor.vv1.execute({key}).executeSync()
			.then(() => {
				const clock = formatClock(new Date());
				const took = formatDuration(Date.now() - started);
				setLastRuns(prev => ({...prev, [key]: clock}));
				setLog(prev => [{time: clock, ok: true, name: actionTitle(action), took}, ...prev]);
				setConfirm('');
			})
			.catch((error: unknown) => {
				const clock = formatClock(new Date());
				const took = formatDuration(Date.now() - started);
				setLog(prev => [{
					time: clock,
					ok: false,
					name: actionTitle(action),
					detail: errorText(error, 'The action failed.'),
					took,
				}, ...prev]);
			})
			.finally(() => {
				setRunningKey(current => current === key ? undefined : current);
			});
	};

	return (
		<div className="dev-tools" id="dev-tools">
			<header className="dev-tools__header">
				<span className="dev-tools__crumb">Backend</span>
				<h1 className="dev-tools__title">Refactoring Actions</h1>
				<p className="dev-tools__lede">Registered actions for this environment.</p>
			</header>
			{phase === 'loading' && <p className="dev-tools__empty">Loading actions.</p>}
			{phase === 'error' && <p className="dev-tools__empty" role="alert">{loadError}</p>}
			{phase === 'ready' && (
				<div className="dev-tools__body">
					<DevToolsActionList
						total={actions.length}
						query={query}
						destructiveOnly={destructiveOnly}
						groups={groups}
						selectedKey={selected?.key}
						onQuery={setQuery}
						onDestructiveOnly={setDestructiveOnly}
						onSelect={onSelect}
					/>
					<DevToolsActionDetail
						action={selected}
						environment={environment}
						lastRun={selected ? lastRuns[selected.key] : undefined}
						canRun={canRun}
						running={running}
						confirm={confirm}
						runIsEnabled={runIsEnabled}
						log={log}
						emptyLabel={actions.length === 0 ? 'The catalog is empty.' : 'No actions match this search.'}
						onConfirm={setConfirm}
						onRun={onRun}
						onClearLog={() => setLog([])}
					/>
				</div>
			)}
		</div>
	);
}
