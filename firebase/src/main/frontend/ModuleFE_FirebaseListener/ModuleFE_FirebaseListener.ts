import {FirebaseApp, initializeApp} from 'firebase/app';
import {DataSnapshot, get, getDatabase, onValue, query, ref, Unsubscribe} from 'firebase/database';
import {__stringify, _keys, filterInstances, ImplementationMissingException, Logger, Module} from '@nu-art/ts-common';
import 'firebase/database';

type FirebaseListenerConfig = {
	firebaseConfig: {
		apiKey: string;
		authDomain: string;
		databaseURL: string;
		projectId: string;
		storageBucket?: string;
		messagingSenderId?: string;
		appId: string;
		measurementId?: string;
	}
}
type FirebaseConfigKey =
	'apiKey'
	| 'authDomain'
	| 'databaseURL'
	| 'projectId'
	| 'appId'
const MandatoryFirebaseConfigKeys: FirebaseConfigKey[] = ['apiKey', 'authDomain', 'databaseURL', 'projectId', 'appId'];

export class ModuleFE_FirebaseListener_Class
	extends Module<FirebaseListenerConfig> {
	public app!: FirebaseApp;

	private getFirebaseConfig = () => {
		if (!this.config.firebaseConfig) {
			this.logWarning('Did not provide FE firebase config!');
			throw new ImplementationMissingException('Did not provide FE firebase config!');
		}

		const configObjectKeys: FirebaseConfigKey[] = _keys(this.config.firebaseConfig);
		const missingKeys = filterInstances(MandatoryFirebaseConfigKeys.map(key => configObjectKeys.includes(key) ? undefined : key));
		if (missingKeys.length > 0) {
			this.logWarning(`FE firebase config is missing props: ${__stringify(missingKeys)}`);
			throw new ImplementationMissingException(`FE firebase config is missing props: ${__stringify(missingKeys)}`);
		}

		return this.config.firebaseConfig;
	};

	initializeFirebase() {
		try {
			this.app = initializeApp(this.getFirebaseConfig());
		} catch (e: any) {
			throw new Error(`Could not initialize firebase for FirebaseListener, couldn't get config. ${e.message}`);
		}
	}

	protected init() {
		this.initializeFirebase();
	}

	createListener(nodePath: string): RefListenerFE {
		return new RefListenerFE(nodePath);
	}
}

/**
 * Firebase Realtime Database rules need to allow reading the nodes that are being queried.
 * <p>"<b>Permission Denied</b>" errors in dev console imply permission is not allowed in the db's rules.
 */
export class RefListenerFE<Value extends any = any>
	extends Logger {
	private readonly nodePath: string;
	private toUnsubscribeFunction?: Unsubscribe;

	constructor(nodePath: string) {
		super(`RefListenerFE('${nodePath}')`);
		this.nodePath = nodePath;
	}

	/**
	 * Receives initial value and listens henceforth.
	 */
	startListening(onValueChangedListener: (snapshot: DataSnapshot) => void) {
		if (this.toUnsubscribeFunction) {
			this.logWarning('RefListener asked to listen mid-listening. Stopping to listen prior to re-listening');
			this.stopListening();
		}

		const db = getDatabase(ModuleFE_FirebaseListener.app);
		const dbRef = ref(db, this.nodePath);
		const refQuery = query(dbRef);
		this.logInfo(`RefListener asked to start listening`);
		this.toUnsubscribeFunction = onValue(refQuery, (snapshot) => {
			onValueChangedListener(snapshot);
		});

		return this;
	}

	private getQuery() {
		const db = getDatabase(ModuleFE_FirebaseListener.app);
		return query(ref(db, this.nodePath));
	}

	/**
	 * One time get the value.
	 */
	async get(): Promise<Value> {
		const dataSnapshot = await get(this.getQuery());
		return dataSnapshot.val();
	}

	stopListening() {
		if (!this.toUnsubscribeFunction) {
			this.logWarning('RefListener asked to stop listening but unsubscribeFunction does not exist.');
			return;
		}
		this.logInfo('RefListener asked to stop listening');
		this.toUnsubscribeFunction();
		this.toUnsubscribeFunction = undefined;
	}
}

export const ModuleFE_FirebaseListener = new ModuleFE_FirebaseListener_Class();