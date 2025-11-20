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

export class Commando_Git
	extends Super {

	git() {
		return {
			clone: this.git_clone,
			checkout: this.git_checkout,
			createTag: this.git_createTag,
			gitCommit: this.git_gitCommit,
			add: this.git_add,
			addAll: this.git_addAll,
			addAndCommit: this.git_addAndCommit,
			push: this.git_push,
			pushTags: this.git_pushTags,
			fetch: this.git_fetch,
			resetHard: this.git_resetHard,
			getCurrentBranch: this.git_getCurrentBranch,
			pull: this.git_pull,
			merge: this.git_merge,
			createBranch: this.git_createBranch,
			gsui: this.git_gsui,
			status: this.git_status,
		};
	};

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

	git_checkout(branch: string): this {
		return this.append(`git checkout ${branch}`);
	}

	git_createTag(tagName: string): this {
		return this.append(`git tag -f ${tagName}`);
	}

	git_gitCommit(commitMessage: string): this {
		return this.append(`git commit -m "${commitMessage}"`);

	}

	git_add(file: string): this {
		return this.append(`git add "${file}"`);

	}

	git_addAll(): this {
		return this.append(`git add .`);

	}

	git_addAndCommit(commitMessage: string): this {
		return this.append(`git commit -am "${commitMessage}"`);
	}

	git_push(options?: GitPushParams): this {
		return this.append(`git push ${options?.remote ?? ''} ${options?.branch ?? ''}`);
	}

	git_pushTags(): this {
		return this.append('git push --tags --force');
	}

	git_fetch(): this {
		return this.append('git fetch');
	}

	git_resetHard(tag = ''): this {
		return this.append('git reset --hard ${tag}');
	}

	git_getCurrentBranch(): this {
		return this.append('git status | grep "On branch" | sed -E "s');
	}

	git_pull(params: string): this {
		return this.append('git pull ${params}');
	}

	git_merge(mergeFrom: string): this {
		return this.append(`git merge ${mergeFrom}`);
	}

	git_createBranch(branch: string): this {
		return this.append(`git checkout - b ${branch}`)
			.append(`git push-- set -upstream origin ${branch}`);
	}

	git_gsui(modules = ''): this {
		return this.append('git submodule update --recursive --init ${modules}');
	}

	git_status(): this {
		return this.append('git status');
	}

}