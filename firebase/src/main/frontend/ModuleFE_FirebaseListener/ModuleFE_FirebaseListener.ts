import {Database, DataSnapshot, getDatabase, onValue, ref} from 'firebase/database';
import {initializeApp} from 'firebase/app';
import {Unsubscribe} from 'firebase/messaging';
import {
	__stringify,
	_keys,
	BadImplementationException,
	filterInstances,
	ImplementationMissingException,
	Module
} from '@nu-art/ts-common';

type FirebaseListenerConfig = {
	firebaseConfig: {
		apiKey: string;
		authDomain: string;
		databaseURL: string;
		projectId: string;
		storageBucket: string;
		messagingSenderId: string;
		appId: string;
		measurementId: string;
	}
}
type FirebaseConfigKey =
	'apiKey'
	| 'authDomain'
	| 'databaseURL'
	| 'projectId'
	| 'storageBucket'
	| 'messagingSenderId'
	| 'appId'
	| 'measurementId'
const ConfigKeys: FirebaseConfigKey[] = ['apiKey', 'authDomain', 'databaseURL', 'projectId', 'storageBucket', 'messagingSenderId', 'appId', 'measurementId'];

export class ModuleFE_FirebaseListener_Class
	extends Module<FirebaseListenerConfig> {
	public database!: Database;

	private getFirebaseConfig = () => {
		if (!this.config.firebaseConfig) {
			this.logWarning('Did not provide FE firebase config!');
			throw new ImplementationMissingException('Did not provide FE firebase config!');
		}

		const configObjectKeys: FirebaseConfigKey[] = _keys(this.config.firebaseConfig);
		if (configObjectKeys.length < ConfigKeys.length) {
			const missingKeys = filterInstances(ConfigKeys.map(key => configObjectKeys.includes(key) ? undefined : key));
			this.logWarning(`FE firebase config is missing props: ${__stringify(missingKeys)}`);
			throw new ImplementationMissingException(`FE firebase config is missing props: ${__stringify(missingKeys)}`);
		}

		return this.config.firebaseConfig;
	};

	initializeFirebase() {
		let app;
		try {
			app = initializeApp(this.getFirebaseConfig());
		} catch (e: any) {
			throw new BadImplementationException(`Could not initialize firebase for FirebaseListener, couldn't get config. ${e.message}`);
		}
		return getDatabase(app);
	}

	protected init() {
		this.database = this.initializeFirebase();
	}

	createListener(nodePath: string): RefListenerFE {
		return new RefListenerFE(this.database, nodePath);
	}
}

export class RefListenerFE {
	private readonly database: Database;
	private readonly nodePath: string;
	private toUnsubscribeFunction?: Unsubscribe;

	constructor(database: Database, nodePath: string) {
		this.database = database;
		this.nodePath = nodePath;
	}

	startListening(onValueChangedListener: (snapshot: DataSnapshot) => void) {
		const nodeRef = ref(this.database, this.nodePath);
		this.toUnsubscribeFunction = onValue(nodeRef, onValueChangedListener);
		return this;
	}

	stopListening() {
		if (!this.toUnsubscribeFunction)
			return;

		this.toUnsubscribeFunction();
		this.toUnsubscribeFunction = undefined;
	}
}

export const ModuleFE_FirebaseListener = new ModuleFE_FirebaseListener_Class();