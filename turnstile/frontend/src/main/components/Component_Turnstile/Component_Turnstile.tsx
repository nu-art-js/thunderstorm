/*
 * @nu-art/turnstile-frontend - Cloudflare Turnstile widget and script loader for Thunderstorm frontends
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import * as React from 'react';
import {ComponentSync} from '@nu-art/thunder-widgets';
import {ModuleFE_Turnstile, type TurnstileApi, type TurnstileRenderOptions} from '../../ModuleFE_Turnstile.js';

type Props = {
	/** Widget action; the backend can require it (TurnstileVerifyContext.expectedAction). */
	action?: string;
	theme?: TurnstileRenderOptions['theme'];
	size?: TurnstileRenderOptions['size'];
	language?: string;
	/** A fresh token. Send it in the `x-turnstile-token` header (HeaderName_TurnstileToken). */
	onToken: (token: string) => void;
	/** The token expired or the widget failed; the caller should drop any held token. */
	onTokenLost?: (reason: 'expired' | 'error') => void;
};

type State = {};

/**
 * Renders a Cloudflare Turnstile widget (explicit rendering) and reports tokens.
 * Removes the widget on unmount.
 */
export class Component_Turnstile
	extends ComponentSync<Props, State> {

	private readonly container = React.createRef<HTMLDivElement>();
	private api?: TurnstileApi;
	private widgetId?: string;
	private unmounted = false;

	protected deriveStateFromProps(_nextProps: Props, state: State): State {
		return state;
	}

	componentDidMount() {
		ModuleFE_Turnstile.load()
			.then(api => this.renderWidget(api))
			.catch((err: Error) => {
				this.logError('Turnstile failed to load', err);
				this.props.onTokenLost?.('error');
			});
	}

	componentWillUnmount() {
		this.unmounted = true;
		if (this.api && this.widgetId)
			this.api.remove(this.widgetId);
	}

	/** Asks Cloudflare for a new token, e.g. after the guarded call consumed the previous one. */
	reset() {
		if (this.api && this.widgetId)
			this.api.reset(this.widgetId);
	}

	private renderWidget(api: TurnstileApi) {
		const container = this.container.current;
		if (this.unmounted || !container)
			return;

		this.api = api;
		this.widgetId = api.render(container, {
			sitekey: ModuleFE_Turnstile.getSiteKey(),
			...(this.props.action ? {action: this.props.action} : {}),
			...(this.props.theme ? {theme: this.props.theme} : {}),
			...(this.props.size ? {size: this.props.size} : {}),
			...(this.props.language ? {language: this.props.language} : {}),
			callback: token => this.props.onToken(token),
			'expired-callback': () => this.props.onTokenLost?.('expired'),
			'error-callback': () => this.props.onTokenLost?.('error'),
		});
	}

	render() {
		return <div className="component__turnstile" ref={this.container}/>;
	}
}
