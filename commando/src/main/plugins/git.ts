/*
 * commando provides shell command execution framework with interactive sessions and plugin system
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Commando_Programming} from './programming.js';
import {Commando_Basic} from './basic.js';
import {MergeClass} from '../core/class-merger.js';
import {BaseCommando} from '../core/BaseCommando.js';


const Super = MergeClass(BaseCommando, Commando_Programming, Commando_Basic);

type GitCloneParams = {
	outputFolder?: string,
	branch?: string,
	recursive?: boolean
};

type GitPushParams = {
	remote: string,
	branch: string
	tags?: boolean
	force?: boolean
};

/**
 * Git operations plugin for Commando.
 * 
 * Provides Git command methods via a fluent API. Extends Commando_Programming
 * and Commando_Basic (merged via class-merger).
 * 
 * **Usage**: Access via `git()` method which returns an object with all
 * Git operations. Methods build commands but don't execute them until
 * `execute()` is called.
 * 
 * **Operations**:
 * - Repository operations: clone, fetch, pull, push
 * - Branch operations: checkout, create, merge, get current
 * - Commit operations: add, commit, addAndCommit
 * - Tag operations: create, push
 * - Utility: status, resetHard, gsui (git status UI)
 */
export class Commando_Git
	extends Super {

	/**
	 * Clones a Git repository.
	 * 
	 * @param url - Repository URL to clone
	 * @param options - Optional clone parameters (branch, recursive, output folder)
	 * @returns This instance for method chaining
	 */
	git_clone(url: string, options?: GitCloneParams): this {
		const branch = `${options?.branch ? ` -b ${options?.branch}` : ''}`;
		const recursive = `${options?.recursive ? ` --recursive` : ''}`;
		const outputFolder = `${options?.outputFolder ? ` ${options.outputFolder}` : ''}`;
		const command = `git clone${recursive}${branch} ${url}${outputFolder}`;
		return this.append(command);
	}

	// git_cloneAssert(url: string, options?: GitCloneParams) {
	// 	return new Promise<void>((resolve, reject) => {
	// 		const branch = `${options?.branch ? ` -b ${options?.branch}` : ''}`;
	// 		const recursive = `${options?.recursive ? ` --recursive` : ''}`;
	// 		const outputFolder = `${options?.outputFolder ? ` ${options.outputFolder}` : ''}`;
	// 		const command = `git clone${recursive}${branch} ${url}${outputFolder}`;
	// 		this.echo(command);
	// 		this.append(command)
	// 			.execute((stdout: string, stderr: string, exitCode: number) => {
	// 				if (exitCode === 0)
	// 					return resolve();
	//
	// 				if (exitCode === 128)
	// 					return reject(new Error(`No access to repo: ${url}`));
	//
	// 				return reject(new Error(`Got unexpected exit code(${exitCode}) while cloning: ${url}`));
	// 			});
	// 	});
	// }

	/**
	 * Checks out a branch.
	 * 
	 * @param branch - Branch name to checkout
	 * @returns This instance for method chaining
	 */
	git_checkout(branch: string): this {
		return this.append(`git checkout ${branch}`);
	}

	/**
	 * Creates or updates a tag (force).
	 * 
	 * @param tagName - Tag name to create/update
	 * @returns This instance for method chaining
	 */
	git_createTag(tagName: string): this {
		return this.append(`git tag -f ${tagName}`);
	}

	/**
	 * Commits changes with a message.
	 * 
	 * @param commitMessage - Commit message
	 * @returns This instance for method chaining
	 */
	git_gitCommit(commitMessage: string): this {
		return this.append(`git commit -m "${commitMessage}"`);

	}

	/**
	 * Stages a specific file.
	 * 
	 * @param file - File path to stage
	 * @returns This instance for method chaining
	 */
	git_add(file: string): this {
		return this.append(`git add "${file}"`);

	}

	/**
	 * Stages all files in the current directory.
	 * 
	 * @returns This instance for method chaining
	 */
	git_addAll(): this {
		return this.append(`git add .`);

	}

	/**
	 * Stages all files and commits with a message.
	 * 
	 * @param commitMessage - Commit message
	 * @returns This instance for method chaining
	 */
	git_addAndCommit(commitMessage: string): this {
		return this.append(`git commit -am "${commitMessage}"`);
	}

	/**
	 * Pushes to a remote branch.
	 * 
	 * @param options - Push parameters (remote, branch, tags, force)
	 * @returns This instance for method chaining
	 */
	git_push(options?: GitPushParams): this {
		return this.append(`git push ${options?.remote ?? ''} ${options?.branch ?? ''}`);
	}

	/**
	 * Pushes all tags to remote (force).
	 * 
	 * @returns This instance for method chaining
	 */
	git_pushTags(): this {
		return this.append('git push --tags --force');
	}

	/**
	 * Fetches from remote.
	 * 
	 * @returns This instance for method chaining
	 */
	git_fetch(): this {
		return this.append('git fetch');
	}

	/**
	 * Resets repository to a specific tag/commit (hard reset).
	 * 
	 * @param tag - Optional tag or commit hash (default: empty string)
	 * @returns This instance for method chaining
	 */
	git_resetHard(tag = ''): this {
		return this.append(`git reset --hard ${tag}`);
	}

	/**
	 * Gets the current branch name.
	 * 
	 * @returns This instance for method chaining
	 */
	git_getCurrentBranch(): this {
		return this.append(`git status | grep "On branch" | sed -E "s/On branch //"`);
	}

	/**
	 * Pulls from remote with optional parameters.
	 * 
	 * @param params - Optional pull parameters
	 * @returns This instance for method chaining
	 */
	git_pull(params: string): this {
		return this.append(`git pull ${params}`);
	}

	/**
	 * Merges a branch into the current branch.
	 * 
	 * @param mergeFrom - Branch to merge from
	 * @returns This instance for method chaining
	 */
	git_merge(mergeFrom: string): this {
		return this.append(`git merge ${mergeFrom}`);
	}

	/**
	 * Creates a new branch and sets upstream.
	 * 
	 * @param branch - Branch name to create
	 * @returns This instance for method chaining
	 */
	git_createBranch(branch: string): this {
		return this.append(`git checkout -b ${branch}`)
			.append(`git push --set-upstream origin ${branch}`);
	}

	/**
	 * Updates git submodules (recursive, init if needed).
	 * 
	 * @param modules - Optional module paths (default: empty string)
	 * @returns This instance for method chaining
	 */
	git_gsui(modules = ''): this {
		return this.append(`git submodule update --recursive --init ${modules}`);
	}

	/**
	 * Shows git status.
	 * 
	 * @returns This instance for method chaining
	 */
	git_status(): this {
		return this.append('git status');
	}

}