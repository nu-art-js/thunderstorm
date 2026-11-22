import {FirebaseApp, initializeApp} from 'firebase/app';
import {browserLocalPersistence, getAuth, onAuthStateChanged, setPersistence, signInWithCustomToken, signOut} from 'firebase/auth';
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
	port: number; //http, normal/default port.
	ssl?: boolean;
	httpsPort?: number; //this is required only for ssl, this is the port in which the db will be available on proxy https.
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
	private signedToken?: string;

	/**
	 * Login captured X-Firebase-Token. Sign this app in before a ruled node is read.
	 * Example: __onFirebaseListenerToken(token) then watchSignedIn starts the forest listen.
	 */
	__onFirebaseListenerToken = (token: string): void => {
		void this.signInWithToken(token).catch((err: unknown) => this.logListenerFailure('Firebase listener sign-in failed', err));
	};

	/** The app session was cleared. Example: logout calls __onFirebaseListenerSignOut(). */
	__onFirebaseListenerSignOut = (): void => {
		void this.signOutListener().catch((err: unknown) => this.logListenerFailure('Firebase listener sign-out failed', err));
	};

	/**
	 * Logs a rejected listener promise. An Error keeps its stack. A LogParam value is logged as itself. A function becomes a string.
	 * Example: this.logListenerFailure('Firebase listener sign-in failed', err)
	 */
	private logListenerFailure(message: string, err: unknown): void {
		if (err instanceof Error)
			return this.logError(message, err);

		if (typeof err === 'string' || typeof err === 'number' || typeof err === 'boolean' || typeof err === 'bigint' || typeof err === 'symbol' || err == null)
			return this.logError(message, err);

		if (typeof err === 'object')
			return this.logError(message, err);

		this.logError(message, String(err));
	}

	/**
	 * Signs this app in once. Firebase Auth stores the refresh token in the browser and renews the ID token by itself.
	 * Example: await listener.signInWithToken(customToken)
	 */
	async signInWithToken(token: string): Promise<void> {
		if (!this.app)
			throw new ImplementationMissingException('Firebase listener app is not ready');

		const auth = getAuth(this.app);
		if (token === this.signedToken && auth.currentUser)
			return;

		await setPersistence(auth, browserLocalPersistence);
		await signInWithCustomToken(auth, token);
		this.signedToken = token;
	}

	async signOutListener(): Promise<void> {
		this.signedToken = undefined;
		if (!this.app)
			return;

		await signOut(getAuth(this.app));
	}

	/**
	 * Fires with the current user, then on each change.
	 * Example: watchSignedIn(signedIn => { if (signedIn) listener.startListening(onValue); })
	 */
	watchSignedIn(onChange: (signedIn: boolean) => void): () => void {
		if (!this.app)
			throw new ImplementationMissingException('Firebase listener app is not ready');

		return onAuthStateChanged(getAuth(this.app), user => onChange(user != null));
	}

	protected init() {
		if (!this.config.firebaseConfig)
			throw new ImplementationMissingException('Could not initialize firebase listener, did not provide FE firebase config!');

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
		if (exists(emulatorConfig)) {
			connectDatabaseEmulator(_database, emulatorConfig.hostname, emulatorConfig.port);
		}

		return this.database = _database;
	}

	createListener(nodePath: string): RefListenerFE {
		this.logDebug(`Creating listener for firebase rtdb node ${nodePath}`);
		return new RefListenerFE(nodePath);
	}
}

/**
 * Firebase Realtime Database rules need to allow reading the nodes that are being queried.
 * <p>"<b>Permission Denied</b>" errors in dev console imply permission is not allowed in the db's rules.
 */
export class RefListenerFE<Value = any>
	extends Logger {
	private readonly nodePath: string;
	private toUnsubscribeFunction?: Unsubscribe;

	constructor(nodePath: string) {
		super(`RefListenerFE('${nodePath}')`);
		this.nodePath = nodePath;
	}

	private getQuery() {
		const db = ModuleFE_FirebaseListener.getDatabase();
		return query(ref(db, this.nodePath));
	}

	/**
	 * Receives initial value and listens henceforth.
	 */
	startListening(onValueChangedListener: (snapshot: DataSnapshot) => void) {
		if (this.toUnsubscribeFunction) {
			this.logWarning('RefListener asked to listen mid-listening. Stopping to listen prior to re-listening');
			this.stopListening();
		}
		this.logDebug('Starting to listen...');
		const refQuery = this.getQuery();
		try {
			this.toUnsubscribeFunction = onValue(refQuery,
				(snapshot) => {
					onValueChangedListener(snapshot);
				}, error => {
					this.logError('Failed receiving value with error', error);
				});
		} catch (e: any) {
			this.logWarning(`Failed listening on node data, check if your rtdb rules permit reading this node '${this.nodePath}'`);
			throw e;
		}
		this.logDebug(`Listening.`);

		return this;
	}

	/**
	 * One time get the value.
	 */
	async get(): Promise<Value> {
		try {
			const dataSnapshot = await get(this.getQuery());
			return dataSnapshot.val();
		} catch (e: any) {
			this.logWarning(`Failed getting node data, check if your rtdb rules permit reading this node '${this.nodePath}'`);
			throw e;
		}
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