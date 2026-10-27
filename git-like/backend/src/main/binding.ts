/*
 * @nu-art/git-like-backend - Git-like branching of live collections
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {DatabaseDef_GitLike_Branch} from '@nu-art/git-like-shared';

export type GitLike_Binding = {
	callerKey: string;
	branchId: DatabaseDef_GitLike_Branch['id'];
};

/**
 * App data: one opaque caller key points at one branch.
 * Many keys may point at the same branch. This is not a field on a chat session.
 */
export class GitLike_BindingStore {
	private readonly byCaller = new Map<string, DatabaseDef_GitLike_Branch['id']>();

	async read(callerKey: string): Promise<DatabaseDef_GitLike_Branch['id'] | undefined> {
		return this.byCaller.get(callerKey);
	}

	async save(callerKey: string, branchId: DatabaseDef_GitLike_Branch['id']): Promise<void> {
		this.byCaller.set(callerKey, branchId);
	}

	async list(branchId: DatabaseDef_GitLike_Branch['id']): Promise<GitLike_Binding[]> {
		return [...this.byCaller.entries()]
			.filter(([, id]) => id === branchId)
			.map(([callerKey, id]) => ({callerKey, branchId: id}));
	}
}
