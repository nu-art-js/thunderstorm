import {AwaitModules} from '@nu-art/sync-manager-frontend';
import {ComponentSync, LL_H_C, LL_V_L, TS_PropRenderer} from '@nu-art/thunder-widgets';
import {DB_Locale, DatabaseDef_Locale, UI_Locale} from '@nu-art/locale-shared';
import {ModuleFE_Locale, OnLocalesUpdated} from '../../_entity/locale/ModuleFE_Locale.js';
import {EditableDBItem} from '@nu-art/editable-item';
import type {ApiCallerEventType} from '@nu-art/db-api-shared';
import './Page_Locales.scss';

type State = {
	editable?: EditableDBItem<DatabaseDef_Locale>;
};

class Page_Locales
	extends ComponentSync<{}, State>
	implements OnLocalesUpdated {

	__onLocalesUpdated(..._params: ApiCallerEventType<DB_Locale>) {
		this.forceUpdate();
	}

	protected deriveStateFromProps(): State {
		return {};
	}

	render() {
		const locales = ModuleFE_Locale.cache.allMutable() as DB_Locale[];
		return <LL_V_L className={'page page-locales'}>
			<LL_H_C className={'page__header'}>
				<h2>Locales</h2>
				<button className={'btn btn--primary'} onClick={() => this.startCreate()}>+ New Locale</button>
			</LL_H_C>
			{this.state.editable && this.renderEditor()}
			{locales.length === 0
				? <div className={'empty-state'}>No locales configured yet</div>
				: <LL_V_L className={'card-list'}>{locales.map(locale => this.renderLocaleCard(locale))}</LL_V_L>
			}
		</LL_V_L>;
	}

	private startCreate() {
		const editable = new EditableDBItem<DatabaseDef_Locale>(
			{enabled: true} as Partial<UI_Locale>,
			ModuleFE_Locale
		).setAutoSave(false)
			.setOnChanged(async () => this.forceUpdate());

		this.setState({editable});
	}

	private startEdit(locale: DB_Locale) {
		const editable = new EditableDBItem<DatabaseDef_Locale>(
			locale,
			ModuleFE_Locale
		).setAutoSave(false)
			.setOnChanged(async () => this.forceUpdate());

		this.setState({editable});
	}

	private renderLocaleCard(locale: DB_Locale) {
		return <div key={locale._id} className={'card-list__item'}>
			<LL_H_C className={'card-list__item-header'}>
				<LL_H_C style={{gap: 'var(--space-3)'}}>
					<span className={'card-list__item-name'}>{locale.displayName}</span>
					<span className={'badge badge--info'}>{locale.code}</span>
					<span className={`badge ${locale.enabled ? 'badge--active' : 'badge--inactive'}`}>
						{locale.enabled ? 'Enabled' : 'Disabled'}
					</span>
				</LL_H_C>
				<LL_H_C style={{gap: 'var(--space-2)'}}>
					<label className={'toggle'}>
						<input
							type={'checkbox'}
							checked={locale.enabled}
							onChange={() => this.toggleEnabled(locale)}
						/>
					</label>
					<button className={'btn btn--ghost btn--sm'} onClick={() => this.startEdit(locale)}>Edit</button>
				</LL_H_C>
			</LL_H_C>
		</div>;
	}

	private renderEditor() {
		const editable = this.state.editable!;
		return <LL_V_L className={'editor-panel'}>
			<TS_PropRenderer.Vertical label={'Code'}>
				<input
					type={'text'}
					className={'input input--text'}
					placeholder={'e.g. en_US, he_IL, ar_*'}
					value={String(editable.item.code ?? '')}
					onChange={e => void editable.updateObj({code: e.target.value})}
				/>
			</TS_PropRenderer.Vertical>

			<TS_PropRenderer.Vertical label={'Display Name'}>
				<input
					type={'text'}
					className={'input input--text'}
					placeholder={'e.g. English - United States'}
					value={String(editable.item.displayName ?? '')}
					onChange={e => void editable.updateObj({displayName: e.target.value})}
				/>
			</TS_PropRenderer.Vertical>

			<label className={'toggle'}>
				<input
					type={'checkbox'}
					checked={editable.item.enabled ?? true}
					onChange={() => editable.updateObj({enabled: !editable.item.enabled})}
				/>
				Enabled
			</label>

			<LL_H_C className={'editor-panel__actions'}>
				<button className={'btn btn--primary'} onClick={() => this.save()}>Save</button>
				<button className={'btn btn--secondary'} onClick={() => this.setState({editable: undefined})}>Cancel</button>
				{editable.item._id && <button className={'btn btn--danger'} onClick={() => this.deleteLocale()}>Delete</button>}
			</LL_H_C>
		</LL_V_L>;
	}

	private async save() {
		if (!this.state.editable)
			return;

		await this.state.editable.save();
		this.setState({editable: undefined});
	}

	private async deleteLocale() {
		if (!this.state.editable)
			return;

		await this.state.editable.delete();
		this.setState({editable: undefined});
	}

	private async toggleEnabled(locale: DB_Locale) {
		const editable = new EditableDBItem<DatabaseDef_Locale>(locale, ModuleFE_Locale);
		editable.setSaveAction(async (item) => await ModuleFE_Locale.upsert(item));
		await editable.updateObj({enabled: !locale.enabled});
		await editable.save();
	}
}

export const APage_Locales = () => (
	<AwaitModules modules={[ModuleFE_Locale]}>
		<Page_Locales/>
	</AwaitModules>
);
