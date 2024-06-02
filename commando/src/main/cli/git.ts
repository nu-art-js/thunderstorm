import {Cli_Programming} from './programming';
import {Cli_Basic} from './basic';
import {MergeClass} from '../shell/core/class-merger';
import {BaseCommando} from '../shell/core/BaseCommando';


const Super = MergeClass(BaseCommando, Cli_Programming, Cli_Basic);

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

export class Cli_Git
	extends Super {

	git = {
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

	git_clone(url: string, options?: GitCloneParams): this {
		// return new Promise<this>((resolve, reject) => {
		// 	const branch = `${options?.branch ? ` -b ${options?.branch}` : ''}`;
		// 	const recursive = `${options?.recursive ? ` --recursive` : ''}`;
		// 	const outputFolder = `${options?.outputFolder ? ` ${options.outputFolder}` : ''}`;
		// 	const command = `git clone${recursive}${branch} ${url}${outputFolder}`;
		// 	this.echo(command);
		// 	this.append(command)
		// 		.execute((stdout: string, stderr: string, exitCode: number) => {
		// 			if (exitCode === 0)
		// 				return resolve(this);
		//
		// 			if (exitCode === 128)
		// 				return reject(new Error(`No access to repo: ${url}`));
		//
		// 			return reject(new Error(`Got unexpected exit code(${exitCode}) while cloning: ${url}`));
		// 		});
		// });
		const branch = `${options?.branch ? ` -b ${options?.branch}` : ''}`;
		const recursive = `${options?.recursive ? ` --recursive` : ''}`;
		const outputFolder = `${options?.outputFolder ? ` ${options.outputFolder}` : ''}`;
		const command = `git clone${recursive}${branch} ${url}${outputFolder}`;
		this.append(command);
		return this;
	}

	private git_checkout(branch: string): this {
		this.append(`git checkout ${branch}`);
		return this;
	}

	private git_createTag(tagName: string): this {
		this.append(`git tag -f ${tagName}`);
		return this;
	}

	private git_gitCommit(commitMessage: string): this {
		this.append(`git commit -m "${commitMessage}"`);
		return this;

	}

	private git_add(file: string): this {
		this.append(`git add "${file}"`);
		return this;

	}

	private git_addAll(): this {
		this.append(`git add .`);
		return this;

	}

	private git_addAndCommit(commitMessage: string): this {
		this.append(`git commit -am "${commitMessage}"`);
		return this;

	}

	private git_push(options?: GitPushParams): this {
		this.append(`git push ${options?.remote} ${options?.branch}`);
		return this;
	}

	private git_pushTags(): this {
		this.append('git push --tags --force');
		return this;
	}

	private git_fetch(): this {
		this.append('git fetch');
		return this;

	}

	private git_resetHard(tag = ''): this {
		this.append('git reset --hard ${tag}');
		return this;
	}

	private git_getCurrentBranch(): this {
		this.append('git status | grep "On branch" | sed -E "s');
		return this;
	}

	private git_pull(params: string): this {
		this.append('git pull ${params}');
		return this;
	}

	private git_merge(mergeFrom: string): this {
		this.append(`git merge ${mergeFrom}`);
		return this;
	}

	private git_createBranch(branch: string): this {
		this.append(`git checkout - b ${branch}`);
		this.append(`git push-- set -upstream origin ${branch}`);
		return this;
	}

	private git_gsui(modules = ''): this {
		this.append('git submodule update --recursive --init ${modules}');
		return this;
	}

	private git_status(): this {
		this.append('git status');
		return this;
	}

}