import {Phase, ProjectManagerV2} from '../ProjectManagerV2';
import {BasePackage} from '../BasePackage';
import {AsyncVoidFunction} from '@nu-art/ts-common';
import {RuntimeParams} from '../../core/params/params';
import {Commando} from '@nu-art/commando/core/cli';


const Phase_A: Phase<'compile'> = {
	name: 'Compile',
	method: 'compile',
	filter: async () => !RuntimeParams.noBuild
};

const Phase_I: Phase<'install'> = {
	name: 'Compile',
	method: 'install',
	filter: async () => !RuntimeParams.install
};

const Phase_C: Phase<'copyPackageJson'> = {
	name: 'Copy Package Json',
	method: 'copyPackageJson',
};

const Phase_B: Phase<'launch'> = {
	name: 'Launch',
	method: 'launch'
};

const AllPhases = [
	Phase_A,
	Phase_B,
];

type PhaseImplementor<P extends Phase<string>> = {
	[K in P['method']]: AsyncVoidFunction
}

export abstract class Package_Python
	extends BasePackage
	implements PhaseImplementor<typeof Phase_I> {

	async install() {
		await Commando.create().append('pip install -r requirements.txt').execute();
	}
}

abstract class Package_Typescript
	extends BasePackage
	implements PhaseImplementor<typeof Phase_C> {

	async copyPackageJson() {

	}
}

export class Package_Root
	extends Package_Typescript {

	constructor(name: string) {
		super(name);
	}
}

class Package_Lib
	extends Package_Typescript
	implements PhaseImplementor<typeof Phase_A> {

	constructor(name: string) {
		super(name);
	}

	compile = async () => {
		// compile fe custom to fe
	};
}

class Package_FirebaseHosting
	extends Package_Typescript
	implements PhaseImplementor<typeof Phase_B>, PhaseImplementor<typeof Phase_A> {

	constructor(name: string) {
		super(name);
	}

	launch = async () => {
		// launch FE
	};

	compile = async () => {
		// compile fe custom to fe
	};
}

class Package_FirebaseFunction
	extends Package_Typescript
	implements PhaseImplementor<typeof Phase_B>, PhaseImplementor<typeof Phase_A> {

	constructor(name: string) {
		super(name);
	}

	launch = async () => {
		// launch BE
	};

	compile = async () => {
		// compile fe custom to fe
	};
}

const item1 = new Package_FirebaseHosting('item-1');
const item2 = new Package_Lib('item-2');
const item3 = new Package_FirebaseFunction('item-3');

new ProjectManagerV2(...AllPhases)
	.register(item1)
	.register(item2)
	.register(item3)
	.execute()
	.then(() => console.log('completed'))
	.catch((e) => console.error(e))
;