import {Module} from "@ir/ts-common";
import {ThunderDispatcher} from "../core/thunder-dispatcher";

export interface OnConnectivityChange {
	__onConnectivityChange(): void
}

class ConnectivityModule_Class
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
	}

	isConnected = () => this.connected;

	handleConnectionChange = () => {
		this.connected = this.getConnectivityStatus();
		this.dispatch_onConnectivityChange.dispatchModule([]);
		this.dispatch_onConnectivityChange.dispatchUI([])
	};

	private getConnectivityStatus = () => navigator.onLine;
}

export const ConnectivityModule = new ConnectivityModule_Class();