import {FirebaseApp, initializeApp} from 'firebase/app';
import {
	connectDatabaseEmulator,
	Database,
	DataSnapshot,
	get,
	getDatabase,
	onValue,
	query,
	ref,
	Unsubscribe
} from 'firebase/database';
import {
	__stringify,
	_keys,
	exists,
	filterInstances,
	ImplementationMissingException,
	Logger,
	Module
} from '@nu-art/ts-common';
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
	databaseURL: string; //??
	projectId: string; //??
	appId: string; //??
}

type FirebaseListenerConfig = {
	runInEmulator?: boolean;
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
			const _app = initializeApp(this.getFirebaseConfig());
			this.app = _app;
		} catch (e: any) {
			this.logWarning(`Could not initialize firebase for FirebaseListener, couldn't get config. ${e.message}`);
			throw new Error(`Could not initialize firebase for FirebaseListener, couldn't get config. ${e.message}`);
		}
	}

	protected init() {
		this.initializeFirebase();
	}

	public getDatabase() {
		if (this.database)
			return this.database;
		this.logWarning('1 getDatabase');
		const _database = getDatabase(this.app);
		this.logWarning('2 getDatabase');

		if (this.config.runInEmulator) { // Make the _database instance connect to local emulator rtdb.
			this.logWarning('3 getDatabase');

			if (!exists(this.config.emulatorConfig)) {
				this.logWarning('Did not provide emulatorConfig in ModuleFE_FirebaseListener\'s FE config, but config.runInEmulator === true.');
				throw new ImplementationMissingException('Did not provide emulatorConfig in ModuleFE_FirebaseListener\'s FE config, but config.runInEmulator === true.');
			}
			this.logWarning('4 getDatabase');

			const emulatorConfig = this.config.emulatorConfig;
			connectDatabaseEmulator(_database, emulatorConfig.hostname, emulatorConfig.port);
		}
		this.logWarning('5 getDatabase');

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