import {Phase, ProjectManagerV2} from '../ProjectManagerV2';
import {BasePackage} from '../BasePackage';
import {AsyncVoidFunction} from '@nu-art/ts-common';


const Phase_A: Phase<'compile'> = {
	name: 'Compile',
	method: 'compile'
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

abstract class Package_Typescript
	extends BasePackage {

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

new ProjectManagerV2(...AllPhases)
	.register(item1)
	.register(item2)
	.execute()
	.then(() => console.log('completed'))
	.catch((e) => console.error(e))
;