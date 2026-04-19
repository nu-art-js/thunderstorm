/*
 * Filterable multi-select scope list for assigning scopes to access groups.
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {ApiCallerEventType} from '@nu-art/db-api-shared';
import type {DB_PermissionScope, DatabaseDef_PermissionScope} from '@nu-art/permissions-shared';
import {sortArray} from '@nu-art/ts-common';
import {ComponentSync, LL_H_C, LL_V_L, TS_Input} from '@nu-art/thunder-widgets';
import {ModuleFE_PermissionScope, type OnPermissionScopeUpdated} from '../../_entity/permission-scope/ModuleFE_PermissionScope.js';
import './Component_ScopeMultiSelect.scss';


export type Props_ScopeMultiSelect = {
	scopeEntries: DatabaseDef_PermissionScope['id'][];
	onChanged: (entries: DatabaseDef_PermissionScope['id'][]) => void;
	disabled?: boolean;
};

type ScopeRow = {
	entity: Readonly<DB_PermissionScope>;
	label: string;
	domain: string;
};

type State = {
	pickerOpen: boolean;
	searchText: string;
	activeDomains: Set<string>;
};

function firstSegment(s: string): string {
	const idx = s.indexOf('-');
	return idx >= 0 ? s.slice(0, idx) : s;
}

function commonPrefixLength(a: string, b: string): number {
	let i = 0;
	while (i < a.length && i < b.length && a[i] === b[i]) i++;
	return i;
}

function deriveDomain(key: string, uiDomains: string[]): string {
	const keyFirstSeg = firstSegment(key);
	let bestDomainSeg = '';
	let bestLen = 0;

	for (const domain of uiDomains) {
		const domainFirstSeg = firstSegment(domain);
		const prefixLen = commonPrefixLength(key, domain);
		const threshold = Math.min(keyFirstSeg.length, domainFirstSeg.length);
		if (prefixLen >= threshold && threshold >= 3 && prefixLen > bestLen) {
			bestLen = prefixLen;
			bestDomainSeg = domainFirstSeg;
		}
	}

	return bestDomainSeg || 'other';
}

function buildScopeRows(entities: readonly Readonly<DB_PermissionScope>[]): ScopeRow[] {
	const uiDomains = entities
		.filter(e => e.key.endsWith('-ui'))
		.map(e => e.key.slice(0, -3));

	return sortArray(entities.map(entity => ({
		entity,
		label: `${entity.key}:${entity.value}`,
		domain: deriveDomain(entity.key, uiDomains),
	})), row => row.label);
}

export class Component_ScopeMultiSelect
	extends ComponentSync<Props_ScopeMultiSelect, State>
	implements OnPermissionScopeUpdated {

	__onPermissionScopeUpdated(..._params: ApiCallerEventType<DB_PermissionScope>) {
		this.forceUpdate();
	}

	protected deriveStateFromProps(_nextProps: Props_ScopeMultiSelect, state: State): State {
		return {
			pickerOpen: state?.pickerOpen ?? false,
			searchText: state?.searchText ?? '',
			activeDomains: state?.activeDomains ?? new Set(),
		};
	}

	private readonly removeScope = (id: string) => {
		if (this.props.disabled)
			return;

		const next = this.props.scopeEntries.filter(e => (e as string) !== id);
		this.props.onChanged(next);
	};

	private readonly addScope = (entity: Readonly<DB_PermissionScope>) => {
		if (this.props.disabled)
			return;

		const selectedSet = new Set(this.props.scopeEntries as string[]);
		if (selectedSet.has(entity._id as string))
			return;

		this.props.onChanged([...this.props.scopeEntries, entity._id as DatabaseDef_PermissionScope['id']]);
	};

	private readonly toggleDomain = (domain: string) => {
		const next = new Set(this.state.activeDomains);
		if (next.has(domain))
			next.delete(domain);
		else
			next.add(domain);

		this.setState({activeDomains: next});
	};

	render() {
		const entities = ModuleFE_PermissionScope.cache.all();
		const allRows = buildScopeRows(entities);
		const selectedSet = new Set(this.props.scopeEntries as string[]);
		const selectedRows = allRows.filter(r => selectedSet.has(r.entity._id as string));

		return <LL_V_L className={'scope-multiselect'}>
			{this.renderSelectedChips(selectedRows)}
			{this.state.pickerOpen
				? this.renderPicker(allRows, selectedSet)
				: <button
					className={'btn btn--secondary btn--sm scope-multiselect__add-btn'}
					onClick={() => this.setState({pickerOpen: true})}
				>+ Add scopes</button>
			}
		</LL_V_L>;
	}

	private renderSelectedChips(selectedRows: ScopeRow[]) {
		if (selectedRows.length === 0)
			return <span className={'card-list__item-meta'}>No scopes assigned</span>;

		return <div className={'scope-multiselect__chips'}>
			{selectedRows.map(row => (
				<span key={row.entity._id} className={'scope-multiselect__chip'}>
					<span className={'scope-multiselect__chip-label'}>{row.entity.key}:{row.entity.value}</span>
					{!this.props.disabled && <button
						className={'scope-multiselect__chip-remove'}
						onClick={() => this.removeScope(row.entity._id as string)}
					>&times;</button>}
				</span>
			))}
		</div>;
	}

	private renderPicker(allRows: ScopeRow[], selectedSet: Set<string>) {
		const domains = sortArray([...new Set(allRows.map(r => r.domain))], d => d);
		const availableRows = allRows.filter(row => {
			if (selectedSet.has(row.entity._id as string))
				return false;

			if (this.state.activeDomains.size > 0 && !this.state.activeDomains.has(row.domain))
				return false;

			if (this.state.searchText) {
				const needle = this.state.searchText.toLowerCase();
				if (!row.label.toLowerCase().includes(needle))
					return false;
			}

			return true;
		});

		return <LL_V_L className={'scope-multiselect__picker'}>
			<LL_H_C className={'scope-multiselect__picker-header'}>
				<TS_Input
					type={'text'}
					value={this.state.searchText}
					placeholder={'Search scopes to add...'}
					saveEvent={['change']}
					onChange={value => this.setState({searchText: value})}
					focus={true}
				/>
				<button
					className={'btn btn--ghost btn--sm'}
					onClick={() => this.setState({pickerOpen: false, searchText: '', activeDomains: new Set()})}
				>Done</button>
			</LL_H_C>

			<LL_H_C className={'scope-multiselect__domain-bar'}>
				{domains.map(domain => {
					const isActive = this.state.activeDomains.has(domain);
					return <button
						key={domain}
						className={`scope-multiselect__domain-pill ${isActive ? 'scope-multiselect__domain-pill--active' : ''}`}
						onClick={() => this.toggleDomain(domain)}
					>{domain}</button>;
				})}
			</LL_H_C>

			<LL_V_L className={'scope-multiselect__picker-list'}>
				{availableRows.length === 0
					? <span className={'scope-multiselect__picker-empty'}>No matching scopes</span>
					: availableRows.map(row => (
						<LL_H_C
							key={row.entity._id}
							className={'scope-multiselect__picker-row'}
							onClick={() => this.addScope(row.entity)}
						>
							<span className={'scope-multiselect__picker-row-key'}>{row.entity.key}</span>
							<span className={'scope-multiselect__picker-row-sep'}>:</span>
							<span className={'scope-multiselect__picker-row-value'}>{row.entity.value}</span>
							<span className={'badge badge--info scope-multiselect__picker-row-domain'}>{row.domain}</span>
						</LL_H_C>
					))
				}
			</LL_V_L>
		</LL_V_L>;
	}
}
