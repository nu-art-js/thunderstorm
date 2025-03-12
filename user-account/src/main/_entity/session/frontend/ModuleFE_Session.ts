import {
	getQueryParameter,
	ModuleFE_BrowserHistory,
	ModuleFE_XHR,
	OnStorageKeyChangedListener,
	StorageKey,
	ThunderDispatcher
} from "@nu-art/thunderstorm/frontend";
import {BadImplementationException, currentTimeMillis, exists, Module, TS_Object, TypedKeyValue} from "@nu-art/ts-common";
import {jwtDecode} from "jwt-decode";
import {ungzip} from "pako";
import {BaseHttpRequest, HeaderKey_SessionId} from "@nu-art/thunderstorm";
import {OnAuthRequiredListener} from "@nu-art/thunderstorm/shared/no-auth-listener";
import {StorageKey_SessionTimeoutTimestamp} from '../../account/frontend';
import {QueryParam_SessionId} from '../shared';

export interface OnSessionUpdated {
	__onSessionUpdated: VoidFunction;
}


export const dispatch_onSessionUpdated = new ThunderDispatcher<OnSessionUpdated, '__onSessionUpdated'>('__onSessionUpdated');
export const StorageKey_SessionId = new StorageKey<string>(`storage-${HeaderKey_SessionId}`);

export class SessionKey_FE<Binder extends TypedKeyValue<string | number, any>> {
	private readonly key: Binder['key'];

	constructor(key: Binder['key']) {
		this.key = key;
	}

	// @ts-ignore
	get(sessionData = ModuleFE_Session.sessionData): Binder['value'] {
		if (!(this.key in sessionData))
			throw new BadImplementationException(`Couldn't find key "${this.key}" in session data`);

		return sessionData[this.key] as Binder['value'];
	}
}


class ModuleFE_Session_Class
	extends Module
	implements OnStorageKeyChangedListener, OnAuthRequiredListener {

	// @ts-ignore
	private sessionData!: TS_Object;

	init() {
		StorageKey_SessionId.onChange(async (sessionAsString) => {
			this.onSessionUpdated(sessionAsString);
		});

		ModuleFE_XHR.addDefaultHeader(HeaderKey_SessionId, () => {
			const sessionJWT = StorageKey_SessionId.get();
			if (!sessionJWT)
				return "";

			return `Bearer ${sessionJWT}`;
		});
		ModuleFE_XHR.setDefaultOnComplete(async (__, _, request) => {
			if (!request.getUrl().startsWith(ModuleFE_XHR.getOrigin()))
				return;

			const responseHeader = request.getResponseHeader(HeaderKey_SessionId);
			if (!responseHeader)
				return;

			const sessionId = typeof responseHeader === 'string' ? responseHeader : responseHeader[0];
			StorageKey_SessionId.set(sessionId);
		});

		const sessionId = getQueryParameter(QueryParam_SessionId);
		if (sessionId) {
			ModuleFE_BrowserHistory.removeQueryParam(QueryParam_SessionId);
			StorageKey_SessionId.set(String(sessionId));
		}
	}

	public getSessionId = (): string => {
		return StorageKey_SessionId.get('');
	};

	__onStorageKeyEvent(event: StorageEvent) {
		if (event.key !== StorageKey_SessionId.key)
			return;

		this.onSessionUpdated(StorageKey_SessionId.get());
	}

	__onAuthRequiredListener(request: BaseHttpRequest<any>) {
		StorageKey_SessionId.delete();
		StorageKey_SessionTimeoutTimestamp.set(currentTimeMillis());
	}

	private onSessionUpdated(sessionAsString?: string) {
		if (sessionAsString)
			try {
				this.sessionData = this.decode(sessionAsString);
			} catch (e: any) {
				this.logError("Error decoding session data", e);
			}
		else
			this.sessionData = {};

		dispatch_onSessionUpdated.dispatchAll();
	}

	private decode(sessionData: string) {
		const decodedJWT = jwtDecode<{ sessionData: string }>(sessionData);
		const base64Zip = decodedJWT.sessionData;
		return JSON.parse(new TextDecoder('utf8').decode(ungzip(Uint8Array.from(atob(base64Zip), c => c.charCodeAt(0)))));
	}

	public hasSession() {
		return !!StorageKey_SessionId.get();
	}

	public isSessionValid() {
		const sessionToken = StorageKey_SessionId.get();
		if (!sessionToken)
			return false;

		try {
			// Decode the JWT token to access its payload.
			// Here we expect an optional 'exp' claim (expiration time in seconds).
			const decodedJWT = jwtDecode<{ exp?: number }>(sessionToken);

			// If the expiration time is not present, consider the session invalid.
			if (!exists(decodedJWT.exp))
				return false;

			// Get the current time in seconds.
			const currentTime = currentTimeMillis() / 1000;

			// Return true if the token's expiration time is in the future.
			return decodedJWT.exp > currentTime;
		} catch (error: any) {
			// Log any errors during decoding and consider the session invalid.
			this.logError("Error validating session token", error);
			return false;
		}
	}
}

export const ModuleFE_Session = new ModuleFE_Session_Class();