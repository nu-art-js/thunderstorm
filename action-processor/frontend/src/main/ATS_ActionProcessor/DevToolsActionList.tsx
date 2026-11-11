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
				<input
					className="dev-tools__search"
					type="search"
					value={props.query}
					placeholder={`Search ${props.total} actions`}
					aria-label="Search actions"
					onChange={event => props.onQuery(event.target.value)}
				/>
				<label className="dev-tools__check">
					<input
						type="checkbox"
						checked={props.destructiveOnly}
						onChange={event => props.onDestructiveOnly(event.target.checked)}
					/>
					Destructive only
				</label>
			</div>
			<div className="dev-tools__rows">
				{props.groups.length === 0 && <p className="dev-tools__empty">{emptyLabel}</p>}
				{props.groups.map(group => (
					<div key={group.name}>
						<div className="dev-tools__group">
							<span>{group.name}</span>
							<span>{group.items.length}</span>
						</div>
						{group.items.map(action => {
							const title = actionTitle(action);
							const selected = action.key === props.selectedKey;
							return (
								<button
									key={action.key}
									type="button"
									className={selected ? 'dev-tools__action dev-tools__action--selected' : 'dev-tools__action'}
									aria-pressed={selected}
									onClick={() => props.onSelect(action.key)}
								>
									<span>{title}</span>
									{action.destructive && <span className="dev-tools__pill">Destructive</span>}
								</button>
							);
						})}
					</div>
				))}
			</div>
		</section>
	);
}
