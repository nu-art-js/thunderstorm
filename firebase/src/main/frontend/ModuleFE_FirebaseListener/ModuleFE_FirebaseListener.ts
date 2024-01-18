import {FirebaseApp, initializeApp} from 'firebase/app';
import {connectDatabaseEmulator, Database, DataSnapshot, get, getDatabase, onValue, query, ref, Unsubscribe} from 'firebase/database';
import {__stringify, _keys, exists, filterInstances, ImplementationMissingException, Logger, Module} from '@nu-art/ts-common';
import 'firebase/database';


type FirebaseConfig = {
	apiKey: string;
	authDomain: string;
	databaseURL: string;
	projectId: string;
	appId: string;
	storageBucket?: string;
	messagingSenderId?: string;
	measurementId?: string;
}
type EmulatorConfig = {
	hostname: string;
	port: number;
}

type FirebaseListenerConfig = {
	emulatorConfig?: EmulatorConfig;
	firebaseConfig: FirebaseConfig;
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
	public database!: Database;

	protected init() {
		if (!this.config.firebaseConfig)
			throw new ImplementationMissingException('Could not initialize firebase listener, Did not provide FE firebase config!');

		const configObjectKeys: FirebaseConfigKey[] = _keys(this.config.firebaseConfig);
		const missingKeys = filterInstances(MandatoryFirebaseConfigKeys.map(key => configObjectKeys.includes(key) ? undefined : key));
		if (missingKeys.length > 0)
			throw new ImplementationMissingException(`Could not initialize firebase listener, FE firebase config is missing props: ${__stringify(missingKeys)}`);

		this.app = initializeApp(this.config.firebaseConfig);
	}

	public getDatabase() {
		if (this.database)
			return this.database;

		const _database = getDatabase(this.app);
		const emulatorConfig = this.config.emulatorConfig;
		if (exists(emulatorConfig))
			connectDatabaseEmulator(_database, emulatorConfig.hostname, emulatorConfig.port);

		return this.database = _database;
	}

	createListener(nodePath: string): RefListenerFE {
		this.logInfo(`Creating listener for firebase rtdb node ${nodePath}`);
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
		this.logInfo('Starting to listen...');
		const db = ModuleFE_FirebaseListener.getDatabase();
		this.logInfo(`db!`);

		const dbRef = ref(db, this.nodePath);
		this.logInfo(`dbRef!`);

		const refQuery = query(dbRef);
		this.logInfo(`Created listening refQuery...`);

		this.toUnsubscribeFunction = onValue(refQuery, (snapshot) => {
			onValueChangedListener(snapshot);
		});
		this.logInfo(`Listening on '${this.nodePath}'`);

		return this;
	}

	private getQuery() {
		const db = ModuleFE_FirebaseListener.getDatabase();
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