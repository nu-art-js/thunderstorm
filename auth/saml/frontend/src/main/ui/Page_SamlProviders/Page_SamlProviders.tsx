import * as React from 'react';
import {ComponentSync, LL_H_C, LL_V_L, TS_Button} from '@nu-art/thunder-widgets';
import {DB_SamlProvider, UI_SamlProvider, ParsedIdpMetadata} from '@nu-art/saml-shared';
import {ModuleFE_SamlProviderDB, OnSamlProvidersUpdated} from '../../_entity/saml-provider/ModuleFE_SamlProviderDB.js';
import {ModuleFE_SAML} from '../../ModuleFE_SAML.js';
import type {ApiCallerEventType} from '@nu-art/db-api-shared';
import './Page_SamlProviders.scss';

type State = {
	metadataUrl: string;
	domain: string;
	label: string;
	preview?: ParsedIdpMetadata;
	previewError?: string;
	refreshError?: string;
	loading?: boolean;
	deletingId?: string;
};

class Page_SamlProviders
	extends ComponentSync<{}, State>
	implements OnSamlProvidersUpdated {

	__onSamlProvidersUpdated(..._params: ApiCallerEventType<DB_SamlProvider>) {
		this.forceUpdate();
	}

	protected deriveStateFromProps(): State {
		return {metadataUrl: '', domain: '', label: ''};
	}

	private resetForm = () => {
		this.setState({metadataUrl: '', domain: '', label: '', preview: undefined, previewError: undefined});
	};

	private onPreviewMetadata = async () => {
		if (!this.state.metadataUrl)
			return;

		this.setState({loading: true, previewError: undefined, preview: undefined});
		try {
			const preview = await ModuleFE_SAML.previewMetadata({metadataUrl: this.state.metadataUrl});
			this.setState({preview, loading: false});
		} catch (e: any) {
			this.setState({previewError: e.message ?? 'Failed to fetch metadata', loading: false});
		}
	};

	private onCreateFromPreview = async () => {
		const {preview, metadataUrl, domain, label} = this.state;
		if (!preview || !metadataUrl || !domain)
			return;

		await ModuleFE_SamlProviderDB.upsert({
			domain: domain.toLowerCase().trim(),
			label: label || `SAML - ${domain}`,
			enabled: true,
			metadataUrl,
			idpEntityId: preview.idpEntityId,
			ssoLoginUrl: preview.ssoLoginUrl,
			ssoLogoutUrl: preview.ssoLogoutUrl,
			certificates: preview.certificates,
		} as UI_SamlProvider);

		this.resetForm();
	};

	private onRefresh = async (provider: DB_SamlProvider) => {
		this.setState({refreshError: undefined});
		try {
			await ModuleFE_SAML.refreshMetadata({_id: provider._id});
		} catch (e: any) {
			this.setState({refreshError: `${provider.domain}: ${e.message}`});
		}
	};

	private onToggleEnabled = async (provider: DB_SamlProvider) => {
		await ModuleFE_SamlProviderDB.upsert({...provider, enabled: !provider.enabled});
	};

	private onDelete = async (provider: DB_SamlProvider) => {
		await ModuleFE_SamlProviderDB.deleteUnique({_id: provider._id});
		this.setState({deletingId: undefined});
	};

	private renderProvider = (provider: DB_SamlProvider) => {
		const isDeleting = this.state.deletingId === provider._id;
		return <div key={provider._id} className={'card-list__item'}>
			<LL_H_C className={'card-list__item-header'}>
				<LL_H_C style={{gap: 'var(--space-3)'}}>
					<span className={'card-list__item-name'}>{provider.domain}</span>
					<span className={'card-list__item-meta'}>{provider.label}</span>
					<span className={`badge ${provider.enabled ? 'badge--active' : 'badge--inactive'}`}>
						{provider.enabled ? 'Enabled' : 'Disabled'}
					</span>
				</LL_H_C>
				<LL_H_C style={{gap: 'var(--space-2)'}}>
					<label className={'toggle'}>
						<input
							type={'checkbox'}
							checked={provider.enabled}
							onChange={() => this.onToggleEnabled(provider)}
						/>
					</label>
					<TS_Button variant={'ghost'} onClick={() => this.onRefresh(provider)}>Refresh</TS_Button>
				</LL_H_C>
			</LL_H_C>
			<div className={'card-list__item-meta'}>Entity ID: {provider.idpEntityId}</div>
			<div className={'card-list__item-meta'}>SSO URL: {provider.ssoLoginUrl}</div>
			<div className={'card-list__item-meta'}>{provider.certificates.length} certificate(s)</div>
			{provider.lastMetadataFetchAt &&
				<div className={'card-list__item-meta'}>Last refreshed: {new Date(provider.lastMetadataFetchAt).toLocaleString()}</div>}
			{provider.metadataFetchError &&
				<div className={'saml-providers__error'}>{provider.metadataFetchError}</div>}
			<LL_H_C className={'card-list__item-actions'}>
				{isDeleting
					? <>
						<span className={'card-list__item-meta'}>Delete provider for '{provider.domain}'?</span>
						<TS_Button variant={'primary'} className={'btn--danger'} onClick={() => this.onDelete(provider)}>Confirm Delete</TS_Button>
						<TS_Button variant={'secondary'} onClick={() => this.setState({deletingId: undefined})}>Cancel</TS_Button>
					</>
					: <TS_Button variant={'primary'} className={'btn--danger'} onClick={() => this.setState({deletingId: provider._id})}>Delete</TS_Button>
				}
			</LL_H_C>
		</div>;
	};

	private renderAddForm = () => {
		const {metadataUrl, domain, label, preview, previewError, loading} = this.state;
		const canCreate = preview && domain.trim();
		return <LL_V_L className={'editor-panel'}>
			<h3>Add SAML Provider</h3>
			<div className={'form-group'}>
				<label className={'form-label'}>IdP Metadata URL</label>
				<LL_H_C style={{gap: 'var(--space-2)'}}>
					<input
						type={'text'}
						placeholder={'https://accounts.google.com/o/saml2?idpid=...'}
						value={metadataUrl}
						onChange={e => this.setState({metadataUrl: e.target.value, preview: undefined, previewError: undefined})}
						style={{flex: 1}}
					/>
					<TS_Button variant={'secondary'} onClick={this.onPreviewMetadata} disabled={loading || !metadataUrl}>
						{loading ? 'Fetching...' : 'Preview'}
					</TS_Button>
				</LL_H_C>
			</div>
			{previewError && <div className={'saml-providers__error'}>{previewError}</div>}
			{preview && <>
				<div className={'card-list__item-meta'}>Entity ID: {preview.idpEntityId}</div>
				<div className={'card-list__item-meta'}>SSO Login URL: {preview.ssoLoginUrl}</div>
				<div className={'card-list__item-meta'}>{preview.certificates.length} certificate(s) found</div>
				<div className={'form-group'}>
					<label className={'form-label'}>Email Domain</label>
					<input
						type={'text'}
						placeholder={'acme.com'}
						value={domain}
						onChange={e => this.setState({domain: e.target.value})}
					/>
				</div>
				<div className={'form-group'}>
					<label className={'form-label'}>Label</label>
					<input
						type={'text'}
						placeholder={`SAML - ${domain || 'acme.com'}`}
						value={label}
						onChange={e => this.setState({label: e.target.value})}
					/>
				</div>
				<LL_H_C className={'editor-panel__actions'}>
					<TS_Button variant={'primary'} onClick={this.onCreateFromPreview} disabled={!canCreate}>Create Provider</TS_Button>
					<TS_Button variant={'secondary'} onClick={this.resetForm}>Cancel</TS_Button>
				</LL_H_C>
			</>}
		</LL_V_L>;
	};

	render() {
		const providers = ModuleFE_SamlProviderDB.cache.allMutable() as DB_SamlProvider[];
		return <LL_V_L className={'page page-saml-providers'}>
			<LL_H_C className={'page__header'}>
				<h2>SAML Providers</h2>
			</LL_H_C>
			{this.renderAddForm()}
			{this.state.refreshError && <div className={'saml-providers__error'}>{this.state.refreshError}</div>}
			<LL_V_L className={'card-list'}>
				{providers.length === 0
					? <div className={'empty-state'}>No SAML providers configured</div>
					: providers.map(p => this.renderProvider(p))
				}
			</LL_V_L>
		</LL_V_L>;
	}
}

export const APage_SamlProviders = React.lazy(() => Promise.resolve({default: Page_SamlProviders}));
