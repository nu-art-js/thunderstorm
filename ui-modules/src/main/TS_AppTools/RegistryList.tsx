import * as React from 'react';
import {useLocation} from 'react-router';
import {TS_NavLink, TS_Route, ModuleFE_Routing} from '@nu-art/thunder-routing';
import {ThisShouldNotHappenException} from '@nu-art/ts-common';
import {AppToolsScreen} from './types.js';
import {
	filterRegistry,
	groupRegistry,
	registryEmptyLabel,
	type RegistryGroupBy,
	type RegistryItem,
	type RegistryScope,
} from './registry-model.js';

type Props = {
	screens: AppToolsScreen[];
	query: string;
	scope: RegistryScope;
	groupBy: RegistryGroupBy;
	pinned: string[];
	recent: string[];
	collapsed: Record<string, boolean>;
	searchRef: React.RefObject<HTMLInputElement>;
	onQuery: (value: string) => void;
	onScope: (scope: RegistryScope) => void;
	onGroupBy: (groupBy: RegistryGroupBy) => void;
	onToggleGroup: (name: string) => void;
	onTogglePin: (key: string) => void;
	onOpen: (key: string) => void;
	routeFor: (key: string) => TS_Route;
};

function toItems(screens: AppToolsScreen[]): RegistryItem[] {
	return screens.map(screen => ({
		key: screen.key || screen.name,
		name: screen.name,
		group: screen.group || 'Other',
		description: screen.description ?? '',
	}));
}

export function RegistryList(props: Props) {
	const items = toItems(props.screens);
	const visible = filterRegistry(items, props.query, props.scope, props.pinned, props.recent);
	const groups = groupRegistry(items, visible, props.groupBy, props.query, props.scope, props.pinned, props.recent, props.collapsed);
	const scopes: {id: RegistryScope; label: string}[] = [
		{id: 'all', label: 'All'},
		{id: 'pinned', label: `Pinned · ${props.pinned.length}`},
		{id: 'recent', label: 'Recent'},
	];

	return <div className="ts-app-tools__registry">
		<div className="ts-app-tools__registry__controls">
			<div className="ts-app-tools__registry__search">
				<SearchIcon/>
				<input
					ref={props.searchRef}
					id="tool-search"
					className="ts-app-tools__registry__search-input"
					placeholder="Search name, description, group"
					aria-label="Search tools"
					value={props.query}
					onChange={event => props.onQuery(event.target.value)}
				/>
				<span className="ts-app-tools__registry__kbd" aria-hidden="true">⌘K</span>
			</div>
			<div className="ts-app-tools__registry__scopes" role="group" aria-label="Tool filter">
				{scopes.map(scope => <button
					key={scope.id}
					type="button"
					className={props.scope === scope.id ? 'ts-app-tools__registry__chip on' : 'ts-app-tools__registry__chip'}
					aria-pressed={props.scope === scope.id}
					onClick={() => props.onScope(scope.id)}
				>{scope.label}</button>)}
			</div>
			<div className="ts-app-tools__registry__meta">
				<span>{visible.length} of {items.length} tools</span>
				<label className="ts-app-tools__registry__group-by">
					Group by
					<select id="group-by" aria-label="Group by" value={props.groupBy} onChange={event => props.onGroupBy(event.target.value as RegistryGroupBy)}>
						<option value="category">Category</option>
						<option value="az">Name A-Z</option>
						<option value="recent">Last used</option>
					</select>
				</label>
			</div>
		</div>
		<nav className="ts-app-tools__registry__nav" aria-label="Tools">
			{groups.length === 0 && <p className="ts-app-tools__registry__empty">{registryEmptyLabel(props.query, props.scope)}</p>}
			{groups.map(group => <section key={group.name}>
				<button type="button" className="ts-app-tools__registry__group" aria-expanded={group.open} onClick={() => props.onToggleGroup(group.name)}>
					<Chevron open={group.open}/>
					<span>{group.name}</span>
					<span className="ts-app-tools__registry__count">{group.items.length}</span>
				</button>
				{group.open && group.items.map(item => {
					const route = props.routeFor(item.key);
					const pinned = props.pinned.includes(item.key);
					return <div key={`${group.name}-${item.key}`} className="ts-app-tools__registry__row">
						<TS_NavLink
							route={route}
							onClick={() => props.onOpen(item.key)}
							className={({isActive}) => isActive ? 'ts-app-tools__registry__link selected' : 'ts-app-tools__registry__link'}
						>
							<span className="ts-app-tools__registry__name">{item.name}</span>
							{props.query.trim() && item.description && <span className="ts-app-tools__registry__desc">{item.description}</span>}
						</TS_NavLink>
						<button
							type="button"
							className={pinned ? 'ts-app-tools__registry__pin on' : 'ts-app-tools__registry__pin'}
							aria-label={pinned ? `Unpin ${item.name}` : `Pin ${item.name}`}
							onClick={event => {
								event.preventDefault();
								event.stopPropagation();
								props.onTogglePin(item.key);
							}}
						>
							<Star filled={pinned}/>
						</button>
					</div>;
				})}
			</section>)}
		</nav>
	</div>;
}

export function RegistryToolbar(props: {screens: AppToolsScreen[]; pinned: string[]; onTogglePin: (key: string) => void; routeFor: (key: string) => TS_Route}) {
	const location = useLocation();
	const [copied, setCopied] = React.useState(false);
	const screen = props.screens.find(item => {
		const key = item.key || item.name;
		try {
			return ModuleFE_Routing.getFullPath(props.routeFor(key).key) === location.pathname;
		} catch {
			return false;
		}
	});
	if (!screen)
		return null;
	const key = screen.key || screen.name;
	const pinned = props.pinned.includes(key);

	const copyLink = async () => {
		try {
			await navigator.clipboard.writeText(window.location.href);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1500);
		} catch {
			setCopied(false);
		}
	};

	return <div className="ts-app-tools__toolbar">
		<div className="ts-app-tools__toolbar__actions">
			<button type="button" className="ts-app-tools__toolbar__button" onClick={() => props.onTogglePin(key)}>
				<Star filled={pinned}/>
				{pinned ? 'Pinned' : 'Pin'}
			</button>
			<button type="button" className="ts-app-tools__toolbar__button" onClick={() => void copyLink()}>
				{copied ? 'Copied' : 'Copy link'}
			</button>
		</div>
	</div>;
}

export function routeForScreen(children: TS_Route[] | undefined, key: string): TS_Route {
	const route = children?.find(child => child.key === key);
	if (!route)
		throw new ThisShouldNotHappenException(`Couldn't find route for screen with key ${key}`);
	return route;
}

function SearchIcon() {
	return <svg className="ts-app-tools__registry__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
		<circle cx="11" cy="11" r="7"/>
		<path d="m20 20-3.5-3.5"/>
	</svg>;
}

function Chevron(props: {open: boolean}) {
	return <svg className={props.open ? 'ts-app-tools__registry__chev open' : 'ts-app-tools__registry__chev'} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
		<path d="m6 9 6 6 6-6"/>
	</svg>;
}

function Star(props: {filled: boolean}) {
	return <svg width="15" height="15" viewBox="0 0 24 24" fill={props.filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden="true">
		<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>
	</svg>;
}
