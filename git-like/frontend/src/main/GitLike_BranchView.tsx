/*
 * @nu-art/git-like-frontend - Git-like branching of live collections
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

export type GitLike_BranchRow = {
	_id: string;
	label: string;
};

export function GitLike_BranchView(props: {branchLabel: string; rows: readonly GitLike_BranchRow[]}) {
	return (
		<section data-testid="git-like-branch-view" style={{
			fontFamily: 'Georgia, serif',
			background: '#f4f1ea',
			color: '#1c1915',
			padding: 24,
			width: 480,
		}}>
			<header style={{marginBottom: 16}}>
				<div style={{fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase'}}>Branch</div>
				<h1 style={{margin: '4px 0 0', fontSize: 28}}>{props.branchLabel}</h1>
			</header>
			<ul style={{listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8}}>
				{props.rows.map(row => (
					<li
						key={row._id}
						data-testid={`row-${row._id}`}
						style={{background: '#fff', border: '1px solid #d9d3c7', borderRadius: 8, padding: '12px 14px'}}
					>
						<div style={{fontSize: 12, color: '#6b645b'}}>{row._id}</div>
						<div>{row.label}</div>
					</li>
				))}
			</ul>
		</section>
	);
}
