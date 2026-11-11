/*
 * @nu-art/action-processor-frontend - Dev Tools action detail
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {actionTitle, type DevToolsAction} from './dev-tools-model.js';

export type DevToolsLogLine = {
	time: string;
	ok: boolean;
	text: string;
};

type Props = {
	action?: DevToolsAction;
	environment: string;
	lastRun?: string;
	canRun: boolean;
	running: boolean;
	confirm: string;
	runIsEnabled: boolean;
	log: DevToolsLogLine[];
	emptyLabel: string;
	onConfirm: (value: string) => void;
	onRun: () => void;
	onClearLog: () => void;
};

export function DevToolsActionDetail(props: Props) {
	if (!props.action) {
		return (
			<section className="dev-tools__detail" aria-label="Action">
				<p className="dev-tools__empty">{props.emptyLabel}</p>
			</section>
		);
	}

	const action = props.action;
	const title = actionTitle(action);
	const runLabel = props.running ? 'Running' : 'Run';

	return (
		<div className="dev-tools__detail-column">
			<section className="dev-tools__detail" aria-label="Action">
				<div className="dev-tools__detail-head">
					<div>
						<div className="dev-tools__kicker">{action.group}</div>
						<div className="dev-tools__name">{title}</div>
					</div>
					{action.destructive && <span className="dev-tools__pill">Modifies or removes data</span>}
				</div>
				<div>
					<div className="dev-tools__kicker">Description</div>
					<p className="dev-tools__description">{action.description}</p>
				</div>
				<div className="dev-tools__facts">
					<div className="dev-tools__fact">
						<div className="dev-tools__kicker">Environment</div>
						<div className="dev-tools__fact-value">{props.environment}</div>
					</div>
					<div className="dev-tools__fact">
						<div className="dev-tools__kicker">Last run</div>
						<div className="dev-tools__fact-value">{props.lastRun ?? 'Not run in this session.'}</div>
					</div>
				</div>
				{action.destructive && (
					<div className="dev-tools__confirm">
						<label className="dev-tools__confirm-label" htmlFor="dev-tools-confirm">
							Type <span className="dev-tools__mono">{title}</span> to confirm
						</label>
						<input
							id="dev-tools-confirm"
							className="dev-tools__confirm-input dev-tools__mono"
							value={props.confirm}
							onChange={event => props.onConfirm(event.target.value)}
							onKeyDown={event => {
								if (event.key === 'Enter' && props.runIsEnabled)
									props.onRun();
							}}
						/>
					</div>
				)}
				<div className="dev-tools__run-row">
					<button
						type="button"
						className="dev-tools__run"
						disabled={!props.runIsEnabled}
						onClick={props.onRun}
					>
						<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<path d="M7 4v16l13-8z"/>
						</svg>
						{runLabel}
					</button>
				</div>
				{!props.canRun && <p className="dev-tools__note">Running an action requires developer:run-actions.</p>}
			</section>
			<section className="dev-tools__log" aria-label="Run log">
				<div className="dev-tools__log-head">
					<span className="dev-tools__kicker">Run log</span>
					<button type="button" className="dev-tools__ghost" onClick={props.onClearLog}>Clear</button>
				</div>
				{props.log.length === 0 && <div className="dev-tools__mono dev-tools__log-empty">No runs in this session.</div>}
				{props.log.map((line, index) => (
					<div key={`${line.time}-${index}`} className="dev-tools__mono dev-tools__log-line">
						<span className="dev-tools__log-time">{line.time}</span>
						<span className={line.ok ? 'dev-tools__log-ok' : 'dev-tools__log-fail'}>{line.ok ? 'OK' : 'Failed'}</span>
						<span>{line.text}</span>
					</div>
				))}
			</section>
		</div>
	);
}
