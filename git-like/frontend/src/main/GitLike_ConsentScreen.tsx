/*
 * @nu-art/git-like-frontend - Git-like branching of live collections
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

export type GitLike_ConsentRow = {
	docId: string;
	kind: 'replace' | 'add' | 'tombstone';
	label?: string;
};

export type GitLike_ConsentAfter = {
	_id: string;
	label: string;
};

export function GitLike_ConsentScreen(props: {
	branchLabel: string;
	changes: readonly GitLike_ConsentRow[];
	after: readonly GitLike_ConsentAfter[];
	onCreate: () => void;
	onBind: () => void;
	onReview: () => void;
	onMerge: () => void;
}) {
	return (
		<section data-testid="git-like-consent-screen" style={{
			fontFamily: 'Georgia, serif',
			background: '#f4f1ea',
			color: '#1c1915',
			padding: 24,
			width: 520,
		}}>
			<header style={{marginBottom: 16}}>
				<div style={{fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase'}}>Merge consent</div>
				<h1 style={{margin: '4px 0 0', fontSize: 28}}>{props.branchLabel}</h1>
			</header>
			<ul style={{listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8}}>
				{props.changes.map(change => (
					<li
						key={change.docId}
						data-testid={`change-${change.docId}`}
						style={{background: '#fff', border: '1px solid #d9d3c7', borderRadius: 8, padding: '12px 14px'}}
					>
						<div style={{fontSize: 12, letterSpacing: 0.8, textTransform: 'uppercase', color: '#6b645b'}}>{change.kind}</div>
						<div style={{fontSize: 12, color: '#6b645b'}}>{change.docId}</div>
						{change.label ? <div>{change.label}</div> : null}
					</li>
				))}
			</ul>
			<h2 style={{fontSize: 14, margin: '20px 0 8px'}}>On live after merge</h2>
			<ul style={{listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8}}>
				{props.after.map(row => (
					<li key={row._id} data-testid={`after-${row._id}`} style={{fontSize: 14}}>
						{row._id}: {row.label}
					</li>
				))}
			</ul>
			<div style={{display: 'flex', gap: 8, marginTop: 20}}>
				<button type="button" data-testid="button-create" onClick={props.onCreate}>Create</button>
				<button type="button" data-testid="button-bind" onClick={props.onBind}>Bind</button>
				<button type="button" data-testid="button-review" onClick={props.onReview}>Review</button>
				<button type="button" data-testid="button-merge" onClick={props.onMerge}>Merge</button>
			</div>
		</section>
	);
}
