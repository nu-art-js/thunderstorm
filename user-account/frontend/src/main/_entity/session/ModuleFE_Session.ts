import {
	getQueryParameter,
	ModuleFE_RoutingV2,
	ModuleFE_XHR,
	OnStorageKeyChangedListener,
	StorageKey,
	ThunderDispatcher
} from '@nu-art/thunderstorm-frontend/index';
import {
	BadImplementationException,
	currentTimeMillis,
	exists,
	JwtTools,
	Module,
	ResolvableContent,
	resolveContent,
	TS_Object,
	TypedKeyValue
} from '@nu-art/ts-common';
import {BaseHttpRequest, HeaderKey_Authorization, ResponseHeaderKey_JWTToken} from '@nu-art/thunderstorm-shared';
import {OnAuthRequiredListener} from '@nu-art/thunderstorm-shared/no-auth-listener';
import {QueryParam_SessionId} from '@nu-art/user-account-shared';

export interface OnSessionUpdated {
	__onSessionUpdated: VoidFunction;
}


export const dispatch_onSessionUpdated = new ThunderDispatcher<OnSessionUpdated, '__onSessionUpdated'>('__onSessionUpdated');
export const StorageKey_SessionTimeoutTimestamp = new StorageKey<number>(`storage-accounts__session-timeout`);

export class SessionKey_FE<Binder extends TypedKeyValue<string | number | 'account', any>> {
	private readonly key: Binder['key'];

	constructor(key: Binder['key']) {
		this.key = key;
	}

	get(): Binder['value'];
	get(defaultValue: Binder['value']): Binder['value'];
	get(defaultValue?: Binder['value']): Binder['value'] {
		// @ts-ignore
		const sessionData = ModuleFE_Session.sessionData;

		// means that we don't have a session yet
		if (!sessionData)
			return;

		if (!(this.key in sessionData) && !exists(defaultValue))
			throw new BadImplementationException(`Couldn't find key "${this.key}" in session data`);

		return sessionData[this.key] as Binder['value'] ?? defaultValue;
	}
}

type SessionDecoder = (sessionAsString: string) => Promise<TS_Object>;

export const sessionContentJWT: SessionDecoder = async (sessionAsString: string) => {
	return JwtTools.decode(sessionAsString);
};

class ModuleFE_Session_Class
	extends Module
	implements OnStorageKeyChangedListener, OnAuthRequiredListener {

	// @ts-ignore
	private sessionData!: TS_Object;
	sessionDecoder: SessionDecoder = sessionContentJWT;
	private sessionKey: ResolvableContent<string> = 'session-jwt';
	private StorageKey_SessionId!: StorageKey<string | undefined>;

	init() {
		this.StorageKey_SessionId = new StorageKey<string | undefined>(resolveContent(this.sessionKey));
		this.StorageKey_SessionId.onChange(async (sessionAsString) => {
			await this.onSessionUpdated(sessionAsString);
		});

		ModuleFE_XHR.addDefaultHeader(HeaderKey_Authorization, () => {
			const sessionJWT = this.StorageKey_SessionId.get();
			if (!sessionJWT)
				return '';

			return `Bearer ${sessionJWT}`;
		});
		ModuleFE_XHR.setDefaultOnComplete(async (__, _, request) => {
			if (!request.getUrl().startsWith(ModuleFE_XHR.getOrigin()))
				return;

			const responseHeader = request.getResponseHeader(ResponseHeaderKey_JWTToken);
			if (!responseHeader)
				return;

			const sessionId = typeof responseHeader === 'string' ? responseHeader : responseHeader[0];
			this.StorageKey_SessionId.set(sessionId);
		});

		let sessionId = ModuleFE_RoutingV2.getQueryParameter(QueryParam_SessionId);
		if (sessionId)
			ModuleFE_RoutingV2.removeQueryParam(QueryParam_SessionId);
		else
			sessionId = this.StorageKey_SessionId.get();

		if (sessionId)
			this.StorageKey_SessionId.set(sessionId);

	}

	setSessionKey(sessionKey: ResolvableContent<string>) {
		this.sessionKey = sessionKey;
	}

	async __onStorageKeyEvent(event: StorageEvent) {
		if (event.key !== this.StorageKey_SessionId.key)
			return;

		await this.onSessionUpdated(this.StorageKey_SessionId.get());
	}

	__onAuthRequiredListener(request: BaseHttpRequest<any>) {
		this.StorageKey_SessionId.delete();
		StorageKey_SessionTimeoutTimestamp.set(currentTimeMillis());
	}

	private async onSessionUpdated(sessionAsString?: string) {
		if (sessionAsString)
			try {
				this.sessionData = await this.sessionDecoder(sessionAsString);
			} catch (e: any) {
				this.logError('Error decoding session data', e);
			}
		else
			this.sessionData = {};

		dispatch_onSessionUpdated.dispatchAll();
	}

	public hasSession() {
		return !!this.StorageKey_SessionId.get();
	}

	public async isSessionValid() {
		const sessionToken = this.StorageKey_SessionId.get();
		if (!sessionToken)
			return false;

		return JwtTools.isJwtActive(sessionToken);
	}

	public getJWT = () => this.StorageKey_SessionId.get();
}

export const ModuleFE_Session = new ModuleFE_Session_Class();