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
	errorText,
	filterDevToolsActions,
	formatClock,
	groupDevToolsActions,
	runEnabled,
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
	const [selectedKey, setSelectedKey] = useState<string | undefined>();
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
	const selected = visible.find(action => action.key === selectedKey) ?? visible[0];
	const running = selected !== undefined && runningKey === selected.key;
	const runIsEnabled = runEnabled({canRun, running, action: selected, confirm});
	const environment = typeof window === 'undefined' ? '' : window.location.host;

	useEffect(() => {
		setConfirm('');
	}, [selected?.key]);

	const onRun = () => {
		if (!selected || !runEnabled({canRun, running, action: selected, confirm}))
			return;

		const action = selected;
		const key = action.key;
		setRunningKey(key);
		void ModuleFE_ActionProcessor.vv1.execute({key}).executeSync()
			.then(() => {
				const clock = formatClock(new Date());
				setLastRuns(prev => ({...prev, [key]: `Executed at ${clock}`}));
				setLog(prev => [...prev, {time: clock, ok: true, text: `${actionTitle(action)} completed.`}]);
				setConfirm('');
			})
			.catch((error: unknown) => {
				const clock = formatClock(new Date());
				setLog(prev => [...prev, {time: clock, ok: false, text: errorText(error, 'The action failed.')}]);
			})
			.finally(() => {
				setRunningKey(current => current === key ? undefined : current);
			});
	};

	return (
		<div className="dev-tools" id="dev-tools">
			<header className="dev-tools__header">
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
						onSelect={setSelectedKey}
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
