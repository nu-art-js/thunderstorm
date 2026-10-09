/*
 * @nu-art/consent-frontend - Consent module and GDPR banner for Thunderstorm frontends
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ComponentSync} from '@nu-art/thunder-widgets';
import type {ConsentCategoryKey} from '@nu-art/consent-shared';
import {ModuleFE_Consent} from '../../ModuleFE_Consent.js';
import './Component_ConsentBanner.scss';

/** Visible copy. Pass translated strings; English defaults are used for anything missing. */
export type ConsentBannerTexts = {
	title: string;
	message: string;
	acceptAll: string;
	rejectAll: string;
	customize: string;
	save: string;
	privacyPolicy: string;
	/** Label per category key; falls back to the key. */
	categories: Partial<Record<ConsentCategoryKey, string>>;
	/** Optional one-line description per category key. */
	descriptions: Partial<Record<ConsentCategoryKey, string>>;
	alwaysOn: string;
};

export const DefaultConsentBannerTexts: ConsentBannerTexts = {
	title: 'Cookies',
	message: 'We use cookies that are needed for this site to work. With your permission we also use optional cookies. Nothing optional is loaded until you choose.',
	acceptAll: 'Accept all',
	rejectAll: 'Reject all',
	customize: 'Choose',
	save: 'Save choice',
	privacyPolicy: 'Privacy policy',
	categories: {necessary: 'Necessary', functional: 'Functional', analytics: 'Analytics', marketing: 'Marketing'},
	descriptions: {},
	alwaysOn: 'Always on',
};

type Props = {
	texts?: Partial<ConsentBannerTexts>;
	className?: string;
};

type State = {
	visible: boolean;
	customizing: boolean;
	draft: Record<ConsentCategoryKey, boolean>;
};

/**
 * Small bottom-right consent card. Shown until the visitor decides, and again on
 * ModuleFE_Consent.openSettings(). Accept and Reject are equal buttons on the first layer; the
 * privacy policy is linked; it does not block the page.
 */
export class Component_ConsentBanner
	extends ComponentSync<Props, State> {

	private readonly unsubscribe: (() => void)[] = [];

	componentDidMount() {
		this.unsubscribe.push(ModuleFE_Consent.onChange(() => this.setState({visible: !ModuleFE_Consent.hasDecided(), customizing: false})));
		this.unsubscribe.push(ModuleFE_Consent.onOpenSettings(() => this.setState({visible: true, customizing: true, draft: this.currentDraft()})));
	}

	componentWillUnmount() {
		this.unsubscribe.forEach(unsubscribe => unsubscribe());
	}

	protected deriveStateFromProps(_nextProps: Props, state: State): State {
		state.visible ??= !ModuleFE_Consent.hasDecided();
		state.customizing ??= false;
		state.draft ??= this.currentDraft();
		return state;
	}

	private currentDraft(): Record<ConsentCategoryKey, boolean> {
		return Object.fromEntries(ModuleFE_Consent.getCategories().map(c => [c.key, ModuleFE_Consent.isGranted(c.key)]));
	}

	private texts(): ConsentBannerTexts {
		const texts = this.props.texts ?? {};
		return {
			...DefaultConsentBannerTexts,
			...texts,
			categories: {...DefaultConsentBannerTexts.categories, ...texts.categories},
			descriptions: {...DefaultConsentBannerTexts.descriptions, ...texts.descriptions},
		};
	}

	render() {
		if (!this.state.visible)
			return null;

		const texts = this.texts();
		const className = ['ts-consent', this.props.className].filter(Boolean).join(' ');
		return <section className={className} role={'dialog'} aria-modal={false} aria-labelledby={'ts-consent__title'}>
			<h2 className={'ts-consent__title'} id={'ts-consent__title'}>{texts.title}</h2>
			<p className={'ts-consent__message'}>
				{texts.message}{' '}
				<a href={ModuleFE_Consent.getPrivacyPolicyUrl()} target={'_blank'} rel={'noopener noreferrer'}>{texts.privacyPolicy}</a>
			</p>
			{this.state.customizing && this.renderCategories(texts)}
			<div className={'ts-consent__actions'}>
				<button type={'button'} className={'ts-consent__button'} onClick={() => ModuleFE_Consent.rejectAll()}>{texts.rejectAll}</button>
				<button type={'button'} className={'ts-consent__button'} onClick={() => ModuleFE_Consent.acceptAll()}>{texts.acceptAll}</button>
				{this.state.customizing
					? <button type={'button'} className={'ts-consent__button'} onClick={() => ModuleFE_Consent.decide(this.state.draft)}>{texts.save}</button>
					: <button type={'button'} className={'ts-consent__button'} onClick={() => this.setState({customizing: true, draft: this.currentDraft()})}>{texts.customize}</button>}
			</div>
		</section>;
	}

	private renderCategories(texts: ConsentBannerTexts) {
		return <ul className={'ts-consent__categories'}>
			{ModuleFE_Consent.getCategories().map(category => {
				const label = texts.categories[category.key] ?? category.key;
				const description = texts.descriptions[category.key];
				return <li key={category.key} className={'ts-consent__category'}>
					<label>
						<input
							type={'checkbox'}
							checked={category.required ? true : this.state.draft[category.key] === true}
							disabled={category.required}
							onChange={e => this.setState({draft: {...this.state.draft, [category.key]: e.target.checked}})}/>
						<span>{label}{category.required && ` (${texts.alwaysOn})`}</span>
					</label>
					{description && <div className={'ts-consent__description'}>{description}</div>}
				</li>;
			})}
		</ul>;
	}
}
