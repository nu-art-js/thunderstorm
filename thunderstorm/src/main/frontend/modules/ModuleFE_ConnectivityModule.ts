import {Module} from '@nu-art/ts-common';
import {ThunderDispatcher} from '../core/thunder-dispatcher';

export interface OnConnectivityChange {
	__onConnectivityChange(): void;
}

class ModuleFE_ConnectivityModule_Class
	extends Module {

	private connected: boolean;
	private dispatch_onConnectivityChange = new ThunderDispatcher<OnConnectivityChange, '__onConnectivityChange'>('__onConnectivityChange');

	constructor() {
		super();
		this.connected = this.getConnectivityStatus();
	}

	protected init(): void {
		window.addEventListener('online', this.handleConnectionChange);
		window.addEventListener('offline', this.handleConnectionChange);

		// ModuleFE_FirebaseListener.createListener('.info').startListening(snapshot => {
		// 	if (snapshot.val() === true) {
		// 		this.logWarningBold(`Connected to Firebase ${__stringify(snapshot.val())}`);
		// 		// Perform actions when connected
		// 	} else {
		// 		this.logWarningBold(`Disconnected from Firebase ${__stringify(snapshot.val())}`);
		// 		// Handle disconnection
		// 	}
		// });
	}

	isConnected = () => this.connected;

	handleConnectionChange = () => {
		this.connected = this.getConnectivityStatus();
		this.dispatch_onConnectivityChange.dispatchModule();
		this.dispatch_onConnectivityChange.dispatchUI();
	};

	private getConnectivityStatus = () => navigator.onLine;
}


export const ModuleFE_ConnectivityModule = new ModuleFE_ConnectivityModule_Class();