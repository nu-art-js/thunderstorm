import * as React from 'react';
import {ComponentSync} from '@nu-art/thunder-widgets';
import {
	asI18nKey,
	getI18nRegistration,
	type I18N_Brand,
	type I18N_Forms,
	type I18N_Params,
} from '@nu-art/i18n-shared';
import {ModuleFE_I18n, OnI18nChanged} from '../../ModuleFE_I18n.js';
import {ModuleFE_I18nOverlay, OnI18nOverlaysUpdated} from '../../_entity/overlay/ModuleFE_I18nOverlay.js';
import type {OnLocalesUpdated} from '../../_entity/locale/ModuleFE_Locale.js';
import './I18n.scss';

const ReservedProps = new Set(['id', 'className']);

type Props = {
	id: I18N_Brand;
	className?: string;
} & I18N_Params;

type State = {
	text: string;
	editMode: boolean;
	editing: boolean;
	draft: I18N_Forms;
};

export class I18n
	extends ComponentSync<Props, State>
	implements OnI18nChanged, OnI18nOverlaysUpdated, OnLocalesUpdated {

	__onI18nChanged() {
		this.rederiveState();
	}

	__onI18nOverlaysUpdated() {
		this.rederiveState();
	}

	__onLocalesUpdated() {
		this.rederiveState();
	}

	private paramsFromProps(props: Props): I18N_Params {
		const params: I18N_Params = {};
		for (const key of Object.keys(props)) {
			if (ReservedProps.has(key))
				continue;
			const value = props[key as keyof Props];
			if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
				params[key] = value;
		}
		return params;
	}

	protected deriveStateFromProps(nextProps: Props, state: State) {
		const params = this.paramsFromProps(nextProps);
		state.text = ModuleFE_I18n.resolve(nextProps.id, params);
		state.editMode = ModuleFE_I18n.isEditMode();
		state.editing ??= false;
		state.draft ??= this.formsForEditor(nextProps.id);
		return state;
	}

	private formsForEditor(id: I18N_Brand): I18N_Forms {
		const registration = getI18nRegistration(id);
		const localeCode = ModuleFE_I18n.getLocaleCode();
		const language = localeCode.split(/[_-]/)[0] ?? 'en';
		const defaults = registration?.defaults[localeCode] ?? registration?.defaults[language] ?? registration?.defaults.en ?? {other: ''};
		return {...defaults, ...this.currentOverlay(id)};
	}

	private currentOverlay(id: I18N_Brand): I18N_Forms {
		const locale = ModuleFE_I18n.activeLocale();
		if (!locale)
			return {};
		const overlay = ModuleFE_I18nOverlay.cache.all().find(row => row.key === asI18nKey(id) && row.localeId === locale._id);
		return overlay?.forms ?? {};
	}

	private rederiveState() {
		this.setState(this.deriveStateFromProps(this.props, {...this.state}));
	}

	private openEditor = (e: React.MouseEvent) => {
		if (!this.state.editMode)
			return;
		e.preventDefault();
		e.stopPropagation();
		this.setState({editing: true, draft: this.formsForEditor(this.props.id)});
	};

	private async saveOverlay() {
		const locale = ModuleFE_I18n.activeLocale();
		if (!locale)
			return;
		const existing = ModuleFE_I18nOverlay.cache.all().find(row => row.key === asI18nKey(this.props.id) && row.localeId === locale._id);
		await ModuleFE_I18nOverlay.upsert({
			...existing,
			key: asI18nKey(this.props.id),
			localeId: locale._id,
			forms: this.state.draft,
		});
		this.setState({editing: false});
	}

	private async resetOverlay() {
		const locale = ModuleFE_I18n.activeLocale();
		if (!locale)
			return;
		const existing = ModuleFE_I18nOverlay.cache.all().find(row => row.key === asI18nKey(this.props.id) && row.localeId === locale._id);
		if (existing)
			await ModuleFE_I18nOverlay.deleteUnique({_id: existing._id});
		this.setState({editing: false, draft: this.formsForEditor(this.props.id)});
	}

	render() {
		const registration = getI18nRegistration(this.props.id);
		const className = ['ts-i18n', this.props.className, this.state.editMode && 'ts-i18n--edit'].filter(Boolean).join(' ');

		return <span className={className} data-i18n-key={asI18nKey(this.props.id)} onClick={this.openEditor}>
			{this.state.text}
			{this.state.editing && <div className={'ts-i18n__editor'} onClick={e => e.stopPropagation()}>
				{registration?.hint && <div className={'ts-i18n__hint'}>{registration.hint}</div>}
				{Object.keys(this.state.draft).length === 0 && <label className={'ts-i18n__form'}>
					<span>other</span>
					<input
						value={this.state.draft.other ?? ''}
						onChange={e => this.setState({draft: {...this.state.draft, other: e.target.value}})}/>
				</label>}
				{_formKeys(this.state.draft).map(formKey => <label key={formKey} className={'ts-i18n__form'}>
					<span>{formKey}</span>
					<input
						value={this.state.draft[formKey] ?? ''}
						onChange={e => this.setState({draft: {...this.state.draft, [formKey]: e.target.value}})}/>
				</label>)}
				<div className={'ts-i18n__actions'}>
					<button type={'button'} onClick={() => void this.saveOverlay()}>Save</button>
					<button type={'button'} onClick={() => void this.resetOverlay()}>Reset</button>
					<button type={'button'} onClick={() => this.setState({editing: false})}>Close</button>
				</div>
			</div>}
		</span>;
	}
}

const _formKeys = (forms: I18N_Forms): string[] => Object.keys(forms);
