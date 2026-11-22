/*
 * @nu-art/action-processor-frontend - Dev Tools action list
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {actionTitle, type DevToolsGroup} from './dev-tools-model.js';

type Props = {
	total: number;
	query: string;
	destructiveOnly: boolean;
	groups: DevToolsGroup[];
	selectedKey?: string;
	onQuery: (value: string) => void;
	onDestructiveOnly: (value: boolean) => void;
	onSelect: (key: string) => void;
};

export function DevToolsActionList(props: Props) {
	const emptyLabel = props.total === 0 ? 'No actions are registered.' : 'No actions match.';

	return (
		<section className="dev-tools__list" aria-label="Actions">
			<div className="dev-tools__list-head">
				<label className="dev-tools__search">
					<SearchIcon/>
					<input
						className="dev-tools__search-input"
						type="search"
						value={props.query}
						placeholder={`Search ${props.total} actions`}
						aria-label="Search actions"
						onChange={event => props.onQuery(event.target.value)}
					/>
				</label>
				<div className="dev-tools__switch-row">
					<span id="dev-tools-destructive-only">Destructive only</span>
					<button
						type="button"
						role="switch"
						className={props.destructiveOnly ? 'dev-tools__switch dev-tools__switch--on' : 'dev-tools__switch'}
						aria-checked={props.destructiveOnly}
						aria-labelledby="dev-tools-destructive-only"
						onClick={() => props.onDestructiveOnly(!props.destructiveOnly)}
					>
						<span className="dev-tools__switch-knob"/>
					</button>
				</div>
			</div>
			<div className="dev-tools__rows">
				{props.groups.length === 0 && <p className="dev-tools__empty">{emptyLabel}</p>}
				{props.groups.map(group => (
					<div key={group.name} className="dev-tools__group-block">
						<div className="dev-tools__group">{group.name}</div>
						{group.items.map(action => {
							const title = actionTitle(action);
							const selected = action.key === props.selectedKey;
							return (
								<button
									key={action.key}
									type="button"
									className={selected ? 'dev-tools__action dev-tools__action--selected' : 'dev-tools__action'}
									aria-current={selected ? 'true' : undefined}
									onClick={() => props.onSelect(action.key)}
								>
									<span className="dev-tools__action-name">{title}</span>
									{action.destructive && <WarningIcon/>}
								</button>
							);
						})}
					</div>
				))}
			</div>
		</section>
	);
}

function SearchIcon() {
	return (
		<svg className="dev-tools__search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
			<circle cx="11" cy="11" r="7"/>
			<path d="M20 20l-3.5-3.5"/>
		</svg>
	);
}

function WarningIcon() {
	return (
		<svg className="dev-tools__warn" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="Destructive">
			<path d="M12 4l9 16H3z"/>
			<path d="M12 10v4M12 17v.5"/>
		</svg>
	);
}
