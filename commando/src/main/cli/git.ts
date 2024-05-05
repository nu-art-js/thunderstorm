import {Cli_Programming} from './programming';
import {MergeClass} from '../core/class-merger';
import {Cli_Basic} from './basic';


const Super = MergeClass(Cli_Programming, Cli_Basic);

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

	private git_clone(url: string, options?: GitCloneParams): Cli_Git {
		const branch = `${options?.branch ? ` -b ${options?.branch}` : ''}`;
		const recursive = `${options?.recursive ? ` --recursive` : ''}`;
		const outputFolder = `${options?.outputFolder ? ` ${options.outputFolder}` : ''}`;
		this.cli.append(`git clone${recursive}${branch} ${url}${outputFolder}`);
		return this;
	}

	private git_checkout(branch: string): Cli_Git {
		this.cli.append(`git checkout ${branch}`);
		return this;
	}

	private git_createTag(tagName: string): Cli_Git {
		this.cli.append(`git tag -f ${tagName}`);
		return this;
	}

	private git_gitCommit(commitMessage: string): Cli_Git {
		this.cli.append(`git commit -m "${commitMessage}"`);
		return this;

	}

	private git_add(file: string): Cli_Git {
		this.cli.append(`git add "${file}"`);
		return this;

	}

	private git_addAll(): Cli_Git {
		this.cli.append(`git add .`);
		return this;

	}

	private git_addAndCommit(commitMessage: string): Cli_Git {
		this.cli.append(`git commit -am "${commitMessage}"`);
		return this;

	}

	private git_push(options?: GitPushParams): Cli_Git {
		this.cli.append(`git push ${options?.remote} ${options?.branch}`);
		return this;
	}

	private git_pushTags(): Cli_Git {
		this.cli.append('git push --tags --force');
		return this;
	}

	private git_fetch(): Cli_Git {
		this.cli.append('git fetch');
		return this;

	}

	private git_resetHard(tag = ''): Cli_Git {
		this.cli.append('git reset --hard ${tag}');
		return this;
	}

	private git_getCurrentBranch(): Cli_Git {
		this.cli.append('git status | grep "On branch" | sed -E "s');
		return this;
	}

	private git_pull(params: string): Cli_Git {
		this.cli.append('git pull ${params}');
		return this;
	}

	private git_merge(mergeFrom: string): Cli_Git {
		this.cli.append(`git merge ${mergeFrom}`);
		return this;
	}

	private git_createBranch(branch: string): Cli_Git {
		this.cli.append(`git checkout - b ${branch}`);
		this.cli.append(`git push-- set -upstream origin ${branch}`);
		return this;
	}

	private git_gsui(modules = ''): Cli_Git {
		this.cli.append('git submodule update --recursive --init ${modules}');
		return this;
	}

	private git_status(): Cli_Git {
		this.cli.append('git status');
		return this;
	}

}