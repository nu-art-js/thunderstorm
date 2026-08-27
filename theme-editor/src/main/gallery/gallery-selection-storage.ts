import {ComponentPreviews} from './registry.js';

export type DesignLanguageMode = 'gallery' | 'theme-editor' | 'component-editor';

/** Human label for breadcrumb / navigation. */
export const designLanguageModeLabel = (mode: DesignLanguageMode): string => {
	switch (mode) {
		case 'gallery':
			return 'Design Language';
		case 'theme-editor':
			return 'Theme';
		case 'component-editor':
			return 'Component Editor';
	}
};

/** Breadcrumb segment labels — fixed vocabulary for the three-level path. */
export const DesignLanguageBreadcrumb = {
	root: 'Design Language',
	theme: 'Theme'
} as const;

const StorageKey_GallerySelection = 'theme-editor--gallery-selection';

export type PersistedGallerySelection = {
	mode: DesignLanguageMode;
	selectedId?: string;
	previousMode?: DesignLanguageMode;
};

const isMode = (value: unknown): value is DesignLanguageMode =>
	value === 'gallery' || value === 'theme-editor' || value === 'component-editor';

const isKnownComponent = (id: string) => ComponentPreviews.some(p => p.id === id);

/** Query-param keys for design-language URL state (browser back/forward). */
export const GalleryQueryParam = {
	view: 'view',
	component: 'component'
} as const;

export type GalleryViewQuery = 'gallery' | 'theme' | 'component';

export const buildGallerySearch = (selection: PersistedGallerySelection): string => {
	switch (selection.mode) {
		case 'gallery':
			return '';
		case 'theme-editor':
			return `?${GalleryQueryParam.view}=theme`;
		case 'component-editor':
			if (!selection.selectedId)
				return `?${GalleryQueryParam.view}=theme`;
			return `?${GalleryQueryParam.view}=component&${GalleryQueryParam.component}=${encodeURIComponent(selection.selectedId)}`;
	}
};

/** Parse `location.search` into gallery selection. Empty search → gallery. */
export const readGallerySelectionFromSearch = (search: string): PersistedGallerySelection => {
	const raw = search.startsWith('?') ? search.slice(1) : search;
	if (!raw)
		return {mode: 'gallery'};

	const params = new URLSearchParams(raw);
	const view = params.get(GalleryQueryParam.view);
	if (!view || view === 'gallery')
		return {mode: 'gallery'};

	if (view === 'theme')
		return {mode: 'theme-editor'};

	if (view === 'component') {
		const id = params.get(GalleryQueryParam.component);
		if (id && isKnownComponent(id))
			return {mode: 'component-editor', selectedId: id};
		return {mode: 'theme-editor'};
	}

	return {mode: 'gallery'};
};

export const gallerySelectionMatches = (
	a: PersistedGallerySelection,
	b: PersistedGallerySelection
): boolean => a.mode === b.mode && a.selectedId === b.selectedId;

export const readGallerySelection = (): PersistedGallerySelection | undefined => {
	try {
		const raw = localStorage.getItem(StorageKey_GallerySelection);
		if (!raw)
			return undefined;

		const parsed = JSON.parse(raw) as PersistedGallerySelection;
		if (!isMode(parsed.mode))
			return undefined;

		const selectedId = parsed.selectedId && isKnownComponent(parsed.selectedId)
			? parsed.selectedId
			: undefined;
		const previousMode = isMode(parsed.previousMode) ? parsed.previousMode : undefined;

		if (parsed.mode === 'component-editor' && !selectedId)
			return {mode: previousMode ?? 'gallery'};

		return {mode: parsed.mode, selectedId, previousMode};
	} catch {
		return undefined;
	}
};

export const persistGallerySelection = (selection: PersistedGallerySelection) => {
	localStorage.setItem(StorageKey_GallerySelection, JSON.stringify({
		mode: selection.mode,
		selectedId: selection.selectedId,
		previousMode: selection.previousMode
	}));
};
