import {ComponentSync, LL_H_C, LL_V_L} from '@nu-art/thunder-widgets/v3';
import {ModuleFE_Routing, OnLocationChanged} from '@nu-art/thunder-routing';
import {ModuleFE_Theme, ThemeName} from '@nu-art/thunder-theme';
import {
	DesignLanguageBreadcrumb,
	DesignLanguageMode,
	GalleryQueryParam,
	buildGallerySearch,
	gallerySelectionMatches,
	persistGallerySelection,
	readGallerySelection,
	readGallerySelectionFromSearch
} from './gallery-selection-storage.js';
import {ComponentPreviews} from './registry.js';
import {ComponentEditorMode} from './modes/ComponentEditorMode.js';
import {GalleryMode} from './modes/GalleryMode.js';
import {ThemeEditorModeView} from './modes/ThemeEditorMode.js';
import {ThemeSwitcher} from './modes/ThemeSwitcher.js';
import './ComponentGallery.scss';
import './ComponentGrid.scss';
import './PreviewSamples.scss';
import './theme-editor/TokenEditor.scss';

export type {DesignLanguageMode} from './gallery-selection-storage.js';

type State = {
	theme?: ThemeName;
	mode: DesignLanguageMode;
	selectedId?: string;
	previousMode?: DesignLanguageMode;
	highlightToken?: string;
	highlightTokens?: string[];
};

/**
 * Design-language page shell: three modes sharing reusable ComponentGrid and TokenEditor.
 * Gallery (view), Theme Editor (globals), Component Editor (single widget deep-dive).
 */
export class ComponentGallery
	extends ComponentSync<{}, State>
	implements OnLocationChanged {

	protected deriveStateFromProps(nextProps: {}, state = {} as State): State {
		state.theme = ModuleFE_Theme.getCurrentTheme();
		if (state.mode === undefined) {
			const search = window.location.search;
			const fromUrl = readGallerySelectionFromSearch(search);
			const saved = readGallerySelection();
			const hasExplicitView = search.includes(`${GalleryQueryParam.view}=`);
			const selection = hasExplicitView ? fromUrl : (saved ?? fromUrl);
			state.mode = selection.mode;
			state.selectedId = selection.selectedId;
			state.previousMode = selection.previousMode;
		}
		return state;
	}

	componentDidMount() {
		this.syncUrlToSelection('replace');
	}

	__onLocationChanged = () => {
		const fromUrl = readGallerySelectionFromSearch(window.location.search);
		const current = {
			mode: this.state.mode,
			selectedId: this.state.selectedId
		};
		if (gallerySelectionMatches(fromUrl, current))
			return;

		this.setState({
			mode: fromUrl.mode,
			selectedId: fromUrl.selectedId,
			previousMode: undefined,
			highlightToken: undefined,
			highlightTokens: undefined
		}, () => persistGallerySelection(fromUrl));
	};

	private syncUrlToSelection = (history: 'push' | 'replace') => {
		const search = buildGallerySearch({
			mode: this.state.mode,
			selectedId: this.state.selectedId
		});
		const pathname = ModuleFE_Routing.getCurrentUrl();
		const currentSearch = ModuleFE_Routing.getCurrent().search || '';
		if (currentSearch === search)
			return;

		const location = {pathname, search: search || undefined};
		if (history === 'push')
			ModuleFE_Routing.push(location);
		else
			ModuleFE_Routing.replace(location);
	};

	private updateSelection = (
		patch: Partial<Pick<State, 'mode' | 'selectedId' | 'previousMode'>>,
		history: 'push' | 'replace' = 'push'
	) => {
		const mode = patch.mode ?? this.state.mode;
		const selectedId = patch.selectedId !== undefined ? patch.selectedId : this.state.selectedId;
		const previousMode = patch.previousMode !== undefined ? patch.previousMode : this.state.previousMode;
		const selection = {mode, selectedId, previousMode};

		this.setState({
			mode,
			selectedId,
			previousMode,
			highlightToken: undefined,
			highlightTokens: undefined
		}, () => {
			persistGallerySelection(selection);
			this.syncUrlToSelection(history);
		});
	};
	private selectTheme = (theme: ThemeName) => {
		ModuleFE_Theme.setTheme(theme);
		this.setState({theme});
	};

	private setMode = (mode: DesignLanguageMode) => {
		this.updateSelection({mode, selectedId: undefined, previousMode: undefined});
	};

	private openComponentEditor = (id: string) => {
		this.updateSelection({
			mode: 'component-editor',
			selectedId: id,
			previousMode: undefined
		});
	};

	private backFromComponentEditor = () => {
		this.setMode('theme-editor');
	};

	private renderBreadcrumbBar() {
		const theme: ThemeName = this.state.theme ?? ModuleFE_Theme.getCurrentTheme() ?? 'dark';
		const mode = this.state.mode;
		const preview = ComponentPreviews.find(p => p.id === this.state.selectedId);

		return (
			<LL_H_C className={'dl-gallery__nav-bar'}>
				<nav className={'dl-gallery__breadcrumb'} aria-label={'Design language navigation'}>
					{mode === 'gallery' ? (
						<span className={'dl-gallery__breadcrumb-current'}>
							{DesignLanguageBreadcrumb.root}
						</span>
					) : (
						<button
							type={'button'}
							className={'dl-gallery__breadcrumb-link'}
							onClick={() => this.setMode('gallery')}
						>{DesignLanguageBreadcrumb.root}</button>
					)}

					{mode !== 'gallery' && (
						<>
							<span className={'dl-gallery__breadcrumb-sep'}>{'›'}</span>
							{mode === 'theme-editor' ? (
								<span className={'dl-gallery__breadcrumb-current'}>
									{DesignLanguageBreadcrumb.theme}
								</span>
							) : (
								<button
									type={'button'}
									className={'dl-gallery__breadcrumb-link'}
									onClick={this.backFromComponentEditor}
								>{DesignLanguageBreadcrumb.theme}</button>
							)}
						</>
					)}

					{mode === 'gallery' && (
						<>
							<span className={'dl-gallery__breadcrumb-sep'}>{'›'}</span>
							<button
								type={'button'}
								className={'dl-gallery__breadcrumb-link'}
								onClick={() => this.setMode('theme-editor')}
							>{DesignLanguageBreadcrumb.theme}</button>
						</>
					)}

					{mode === 'component-editor' && (
						<>
							<span className={'dl-gallery__breadcrumb-sep'}>{'›'}</span>
							<span className={'dl-gallery__breadcrumb-current'}>
								{preview?.title ?? this.state.selectedId}
							</span>
						</>
					)}
				</nav>

				<ThemeSwitcher activeTheme={theme} onThemeChange={this.selectTheme}/>
			</LL_H_C>
		);
	}

	render() {
		return (
			<LL_V_L className={'dl-gallery'}>
				<div className={'dl-gallery__header'}>
					<div className={'dl-gallery__heading'}>Design Language</div>
					<div className={'dl-gallery__subtitle'}>
						Real Thunderstorm widgets rendered from <code>var(--token)</code>. Switching the theme
						remaps tokens via <code>[data-theme]</code> — no rebuild.
					</div>
				</div>

				{this.renderBreadcrumbBar()}

				{this.state.mode === 'gallery' && (
					<GalleryMode onSelectComponent={this.openComponentEditor}/>
				)}

				{this.state.mode === 'theme-editor' && (
					<ThemeEditorModeView
						highlightToken={this.state.highlightToken}
						highlightTokens={this.state.highlightTokens}
						onHighlightToken={token => this.setState({highlightToken: token, highlightTokens: undefined})}
						onHighlightTokens={tokens => this.setState({highlightTokens: tokens, highlightToken: undefined})}
						onSelectComponent={this.openComponentEditor}
					/>
				)}

				{this.state.mode === 'component-editor' && this.state.selectedId && (
					<ComponentEditorMode
						componentId={this.state.selectedId}
						highlightToken={this.state.highlightToken}
						highlightTokens={this.state.highlightTokens}
						onHighlightToken={token => this.setState({highlightToken: token, highlightTokens: undefined})}
						onHighlightTokens={tokens => this.setState({highlightTokens: tokens, highlightToken: undefined})}
					/>
				)}
			</LL_V_L>
		);
	}
}
