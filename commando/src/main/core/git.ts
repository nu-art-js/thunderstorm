import {MergeClass} from '../../../class-merger';
import {CliCore} from './basic-commands';
import {CliProgramming} from './programming';


const Super = MergeClass(CliProgramming, CliCore);

type GitRepo = {
	url: string
	outputFolder: string
}

type GitCloneParams = { branch?: string, recursive?: boolean };

type GitPushParams = {
	remote: string,
	branch: string
	tags?: boolean
	force?: boolean
};

export class CliGit
	extends Super {

	clone(repo: GitRepo, options: GitCloneParams) {
		const branch = `${options.branch ? `-b ${options.branch}` : ''}`;
		const recursive = `${options.recursive ? `--recursive` : ''}`;
		this.cli.append(`git clone ${recursive} ${branch} ${repo.url}`);
	}

	checkout(branch: string) {
		this.cli.append(`git checkout ${branch}`);
		return this;
	}

	createTag(tagName: string) {
		this.cli.append(`git tag -f ${tagName}`);
		return this;
	}

	gitCommit(commitMessage: string) {
		this.cli.append(`git commit -m "${commitMessage}"`);
		return this;

	}

	add(file: string) {
		this.cli.append(`git add "${file}"`);
		return this;

	}

	addAll() {
		this.cli.append(`git add .`);
		return this;

	}

	addAndCommit(commitMessage: string) {
		this.cli.append(`git commit -am "${commitMessage}"`);
		return this;

	}

	push(options?: GitPushParams) {
		this.cli.append(`git push ${options.remote} ${options.branch}`);
		return this;
	}

	pushTags() {
		this.cli.append('git push --tags --force');
		return this;
	}

	fetch() {
		this.cli.append('git fetch');
		return this;

	}

	resetHard(tag = '') {
		this.cli.append('git reset --hard ${tag}');
		return this;
	}

	getCurrentBranch() {
		this.cli.append('git status | grep "On branch" | sed -E "s');
		return this;
	}

	pull(params) {
		this.cli.append('git pull ${params}');
		return this;
	}

	merge(mergeFrom) {
		this.cli.append(`git merge ${mergeFrom}`);
		return this;
	}

	createBranch(branch) {
		this.cli.append(`git checkout - b ${branch}`);
		this.cli.append(`git push-- set -upstream origin ${branch}`);
		return this;
	}

	gsui(modules = '') {
		this.cli.append('git submodule update --recursive --init ${modules}');
		return this;
	}

	status() {
		this.cli.append('git status');
		return this;
	}

}