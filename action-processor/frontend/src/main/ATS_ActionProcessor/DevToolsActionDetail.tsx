/*
 * @nu-art/action-processor-frontend - Dev Tools action detail
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {useEffect, useState} from 'react';
import {actionTitle, lastRunLabel, type DevToolsAction} from './dev-tools-model.js';

export type DevToolsLogLine = {
	time: string;
	ok: boolean;
	name: string;
	took: string;
	detail?: string;
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
				<p className="dev-tools__empty dev-tools__detail-empty">{props.emptyLabel}</p>
			</section>
		);
	}

	const action = props.action;
	const title = actionTitle(action);
	const runLabel = props.running ? 'Running' : 'Run';
	const runClass = action.destructive
		? 'dev-tools__run dev-tools__run--danger'
		: 'dev-tools__run';

	return (
		<div className="dev-tools__detail-column">
			<section className="dev-tools__detail" aria-labelledby="dev-tools-action-title">
				<div className="dev-tools__detail-body">
					<div className="dev-tools__meta">
						<span className="dev-tools__group-name">{action.group}</span>
						{action.destructive && (
							<span className="dev-tools__pill">
								<WarningIcon/>
								Modifies or removes data
							</span>
						)}
					</div>
					<div className="dev-tools__title-row">
						<h2 id="dev-tools-action-title" className="dev-tools__name">{title}</h2>
						<CopyNameButton title={title}/>
					</div>
					<p className="dev-tools__description">{action.description}</p>
					<dl className="dev-tools__facts">
						<div className="dev-tools__fact">
							<dt className="dev-tools__fact-label">Environment</dt>
							<dd className="dev-tools__fact-value dev-tools__mono">{props.environment}</dd>
						</div>
						<div className="dev-tools__fact">
							<dt className="dev-tools__fact-label">Last run</dt>
							<dd className="dev-tools__fact-value">{lastRunLabel(props.lastRun)}</dd>
						</div>
					</dl>
				</div>
				<form
					className="dev-tools__form"
					onSubmit={event => {
						event.preventDefault();
						if (props.runIsEnabled)
							props.onRun();
					}}
				>
					{action.destructive && (
						<label className="dev-tools__confirm-label" htmlFor="dev-tools-confirm">
							Paste or type <code className="dev-tools__code">{title}</code> to confirm
						</label>
					)}
					<div className="dev-tools__run-row">
						{action.destructive && (
							<input
								id="dev-tools-confirm"
								className="dev-tools__confirm-input"
								value={props.confirm}
								autoComplete="off"
								placeholder={title}
								onChange={event => props.onConfirm(event.target.value)}
							/>
						)}
						<button type="submit" className={runClass} disabled={!props.runIsEnabled}>
							<PlayIcon/>
							{runLabel}
						</button>
					</div>
					{!props.canRun && <p className="dev-tools__note">Running an action requires developer:run-actions.</p>}
				</form>
			</section>
			<section className="dev-tools__log" aria-label="Run log">
				<div className="dev-tools__log-head">
					<h3 className="dev-tools__log-title">Run log</h3>
					{props.log.length > 0 && (
						<button type="button" className="dev-tools__icon-button" aria-label="Clear run log" title="Clear" onClick={props.onClearLog}>
							<TrashIcon/>
						</button>
					)}
				</div>
				<div className="dev-tools__log-body">
					{props.log.length === 0 && <div className="dev-tools__log-empty">No runs in this session.</div>}
					{props.log.map((line, index) => (
						<div key={`${line.time}-${line.name}-${index}`} className="dev-tools__log-line">
							<span className="dev-tools__log-time">{line.time}</span>
							<span className={line.ok ? 'dev-tools__log-ok' : 'dev-tools__log-fail'}>{line.ok ? 'OK' : 'Failed'}</span>
							<span className="dev-tools__log-name">{line.name}</span>
							{line.detail && <span className="dev-tools__log-detail">{line.detail}</span>}
							<span className="dev-tools__log-took">{line.took}</span>
						</div>
					))}
				</div>
			</section>
		</div>
	);
}

function CopyNameButton(props: {title: string}) {
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		setCopied(false);
	}, [props.title]);

	useEffect(() => {
		if (!copied)
			return undefined;

		const timer = window.setTimeout(() => setCopied(false), 1500);
		return () => window.clearTimeout(timer);
	}, [copied]);

	const onCopy = () => {
		const write = navigator.clipboard?.writeText(props.title);
		if (!write)
			return;

		void write.then(() => setCopied(true)).catch(() => setCopied(false));
	};

	return (
		<>
			<button
				type="button"
				className={copied ? 'dev-tools__copy dev-tools__copy--done' : 'dev-tools__copy'}
				aria-label={`Copy action name ${props.title}`}
				title={copied ? 'Copied' : 'Copy name'}
				onClick={onCopy}
			>
				{copied ? <CheckIcon/> : <CopyIcon/>}
			</button>
			{copied && <span className="dev-tools__copied" role="status">Copied</span>}
		</>
	);
}

function PlayIcon() {
	return (
		<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
			<path d="M7 5v14l12-7z"/>
		</svg>
	);
}

function WarningIcon() {
	return (
		<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<path d="M12 4l9 16H3z"/>
			<path d="M12 10v4"/>
		</svg>
	);
}

function CopyIcon() {
	return (
		<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<rect x="9" y="9" width="11" height="11" rx="2"/>
			<path d="M5 15V5a1 1 0 011-1h10"/>
		</svg>
	);
}

function CheckIcon() {
	return (
		<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<path d="M5 12l5 5L20 7"/>
		</svg>
	);
}

function TrashIcon() {
	return (
		<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3"/>
		</svg>
	);
}
