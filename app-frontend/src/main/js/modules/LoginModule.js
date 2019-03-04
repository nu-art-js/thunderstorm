/**
 * Created by tacb0ss on 27/07/2018.
 */
import {Module, CookiesModule, Interface, HttpModule, AnalyticsModule} from "nu-art--react-core";

class LoginModule
	extends Module {
	constructor() {
		super();
		this.onAuthenticationCompleted = this.onAuthenticationCompleted.bind(this);
		this.onLoggedIn = "onLoggedIn";
		this.OnLoginListener = Interface("OnLoginListener").addMethod(this.onLoggedIn);

		this.onLoggedOut = "onLoggedOut";
		this.OnLogoutListener = Interface("OnLogoutListener").addMethod(this.onLoggedOut);
	}

	onAuthenticationCompleted(error, xhr) {
		if (error) {
			this.lastLoginError = "LoginError_ConnectivityError";
			this.logError(`login error: ${this.lastLoginError}`);
		} else {
			let status = xhr.status;
			let loginResponse = JSON.parse(xhr.responseText);
			switch (true) {
				case (status === 200):
					this.logInfo("login successful!!");

					this.accountInfo = loginResponse.accountInfo;
					CookiesModule.set("token", loginResponse.token);
					CookiesModule.set("accountInfo", loginResponse.accountInfo);
					break;

				case (status === 400 || status === 422):
					this.lastLoginError = "LoginError_BadRequest";
					this.logError(`login error: ${this.lastLoginError}`);
					break;

				case (status === 401):
					this.lastLoginError = "LoginError_AuthenticationError";
					this.logError(`login error: ${this.lastLoginError}`);
					break;

				case (status >= 400):
					this.lastLoginError = "LoginError_ServerError";
					AnalyticsModule.sendEvent("server-error", `${xhr.url}`, `${status}`, 1);
					this.logError(`login error: ${this.lastLoginError}`);
					break;
			}
			loginResponse.debugMessage && this.logError(`Debug: ${loginResponse.debugMessage}`)
		}

		this.dispatchEvent(this.OnLoginListener, this.onLoggedIn);
	}

	signup(email, password, repeatedPassword) {
		const loginData = {
			email: email,
			password: password,
			repeatedPassword: repeatedPassword
		};

		HttpModule.execute("POST", "/api/v1/account/signup", {}, loginData, this.onAuthenticationCompleted.bind(this));
	}

	recoverPassword(email) {
		const loginData = {
			email: email,
		};

		HttpModule.execute("POST", "/api/v1/account/recover-password", {}, loginData, this.onAuthenticationCompleted);
	}

	login(email, password) {
		const loginData = {
			email: email,
			password: password
		};

		HttpModule.execute("POST", "/api/v1/account/login", {}, loginData, this.onAuthenticationCompleted);
	}

	logout() {
		const logoutData = {
			account: {
				token: CookiesModule.get("token")
			}
		};

		HttpModule.execute("POST", "/api/v1/account/logout", this.headers, logoutData, (err, xhr) => {
			let success;
			if (err) {
				this.logError("logout error!!");
				success = false;
			} else {
				success = xhr.status === 200;
				if (success)
					this.logInfo("logout successful!!");
				else
					this.logError("logout error!!");

			}
			CookiesModule.set("token", null);
			this.dispatchEvent(this.OnLogoutListener, this.onLoggedOut, success);
		});

	}

	isLoggedIn() {
		const token = CookiesModule.get("token");
		return token && true;
	}

	getAccountInfo() {
		return this.accountInfo;
	}

	getLastLoginError() {
		return this.lastLoginError;
	}

	clearLastError() {
		this.lastLoginError = undefined;
	}
}

export default new LoginModule();
