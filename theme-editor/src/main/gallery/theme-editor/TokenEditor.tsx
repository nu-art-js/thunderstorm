import * as React from 'react';
import {useState} from 'react';
import {TS_Icons} from '@nu-art/ts-styles';
import {ModuleFE_Theme} from '@nu-art/thunder-theme';
import {
	createGlobalTokenInGroup,
	createSpecForGroup,
	declaredTokenValue,
	globalTokenGroups,
	globalTokenMatchesKind,
	groupMatchesLinkKind,
	inferComponentTokenLinkKind,
	resolvedTokenValue,
	TokenGroup,
	TokenLinkMode,
	TokenValueKind
} from './token-introspection.js';
import {TokenRow} from './TokenRow.js';
import {
	buildComponentToThemeExport,
	buildDeltaComponentExport,
	buildDeltaThemeExport,
	buildThemeToValueExport,
	publishThemeExport,
	themeExportSize
} from './theme-export.js';
import './TokenEditor.scss';

const DownloadIcon = TS_Icons.download.component;

const globalGroupSlot = (title: string): string => {
	switch (title) {
		case 'Semantic palette': return ' dl-token-editor__group--palette';
		case 'Radii': return ' dl-token-editor__group--radii';
		case 'Spacing': return ' dl-token-editor__group--spacing';
		case 'Typography': return ' dl-token-editor__group--typography';
		case 'Motion': return ' dl-token-editor__group--motion';
		default: return '';
	}
};

export type TokenEditorProps = {
	title?: string;
	subtitle?: string;
	groups: TokenGroup[];
	highlightToken?: string;
	/** Highlight multiple rows (inspect mode). Takes precedence over highlightToken. */
	highlightTokens?: string[];
	onRefClick?: (token: string) => void;
	/** Master override toggle, base font slider, reset — shown on primary panels only. */
	showControls?: boolean;
	compact?: boolean;
	emptyHint?: string;
	/**
	 * Group arrangement:
	 * - `global`     — palette left (tall); radii|spacing top-right; typography|motion bottom-right (3×2).
	 * - `global-2col` — palette left column; radii/spacing/typography/motion stacked in the right column.
	 */
	layout?: 'global' | 'global-2col' | 'default';
	/** Component editor left panel — slot tokens with link action. */
	componentSlot?: boolean;
	/** Allow creating new globals via + on group headers. */
	allowCreateGlobal?: boolean;
	/** Active component→global link mode (globals panel). */
	linkMode?: TokenLinkMode;
	onStartLink?: (componentToken: string, requiredKind: TokenValueKind) => void;
	onCompleteLink?: (globalToken: string) => void;
	onCancelLink?: () => void;
	/** Parent refresh after runtime global create (outside link-complete). */
	onRuntimeChange?: () => void;
};

const CreateGlobalTokenForm: React.FC<{
	groupTitle: string;
	onCreated: (token: string) => void;
	onCancel: () => void;
	requiredKind?: TokenValueKind;
	initialValue?: string;
}> = props => {
	const spec = createSpecForGroup(props.groupTitle);
	const [suffix, setSuffix] = useState('');
	const [variantKind, setVariantKind] = useState<TokenValueKind>(
		props.requiredKind ?? spec?.variants?.[0]?.kind ?? spec?.kind ?? 'color'
	);
	const [error, setError] = useState<string>();

	if (!spec)
		return null;

	const activeVariant = spec.variants?.find(v => v.kind === variantKind);
	const prefix = activeVariant?.prefix ?? spec.prefix;

	const submit = () => {
		try {
			setError(undefined);
			const token = createGlobalTokenInGroup(
				props.groupTitle,
				suffix,
				variantKind,
				props.initialValue
			);
			props.onCreated(token);
		} catch (e: any) {
			setError(e?.message ?? String(e));
		}
	};

	return (
		<div className={'dl-token-editor__create-form'}>
			{spec.variants && !props.requiredKind && (
				<select
					className={'dl-token-editor__create-variant'}
					value={variantKind}
					onChange={event => setVariantKind(event.target.value as TokenValueKind)}
				>
					{spec.variants.map(variant => (
						<option key={variant.kind} value={variant.kind}>{variant.label}</option>
					))}
				</select>
			)}
			<span className={'dl-token-editor__create-prefix'}>{prefix}</span>
			<input
				type={'text'}
				className={'dl-token-editor__create-suffix'}
				placeholder={'name'}
				value={suffix}
				spellCheck={false}
				autoFocus
				onChange={event => setSuffix(event.target.value)}
				onKeyDown={event => {
					if (event.key === 'Enter')
						submit();
					if (event.key === 'Escape')
						props.onCancel();
				}}
			/>
			<button type={'button'} className={'dl-token-editor__create-submit'} onClick={submit}>Add</button>
			<button type={'button'} className={'dl-token-editor__create-cancel'} onClick={props.onCancel}>Cancel</button>
			{error && <span className={'dl-token-editor__create-error'}>{error}</span>}
		</div>
	);
};

/**
 * Reusable design-token editor panel. Renders TokenRow for each token in the
 * supplied groups; edits flow through ModuleFE_Theme at runtime.
 */
export const TokenEditor: React.FC<TokenEditorProps> = props => {
	const [revision, setRevision] = useState(0);
	const refresh = () => setRevision(tick => tick + 1);

	const [createInGroup, setCreateInGroup] = useState<string | undefined>();
	const [groups, setGroups] = useState(props.groups);
	const [exportNote, setExportNote] = useState<string>();

	const runExport = (label: string, build: typeof buildComponentToThemeExport) => {
		const payload = publishThemeExport(build);
		setExportNote(`${themeExportSize(payload)} · ${label} → #theme-editor--export`);
	};

	React.useEffect(() => {
		// Link mode needs the full global catalog for picking targets.
		if (props.linkMode && props.layout?.startsWith('global')) {
			setGroups(globalTokenGroups());
			return;
		}
		// Theme editor owns the full catalog; refresh after runtime creates.
		if (props.allowCreateGlobal && props.layout?.startsWith('global') && props.layout !== 'global-2col') {
			setGroups(globalTokenGroups());
			return;
		}
		// Component editor globals — referenced subset only (preserves 2-col palette layout).
		setGroups(props.groups);
	}, [props.groups, props.linkMode, props.allowCreateGlobal, props.layout, revision]);

	const masterOn = ModuleFE_Theme.isOverridesEnabled();
	const showControls = props.showControls ?? false;

	const baseFontPx = (): number => {
		const override = ModuleFE_Theme.getOverride('--font-size-base');
		const parsed = parseInt(override?.value ?? resolvedTokenValue('--font-size-base'), 10);
		return Number.isFinite(parsed) ? parsed : 14;
	};

	const setBaseFontPx = (px: number) => {
		ModuleFE_Theme.setOverride('--font-size-base', `${px}px`);
		refresh();
	};

	const isGlobalLayout = props.layout === 'global' || props.layout === 'global-2col';
	const isGlobalsPanel = props.allowCreateGlobal || !!props.linkMode;

	const classes = ['dl-token-editor'];
	if (props.compact)
		classes.push('dl-token-editor--compact');
	if (props.layout === 'global')
		classes.push('dl-token-editor--global-layout');
	if (props.layout === 'global-2col')
		classes.push('dl-token-editor--global-2col');
	if (props.componentSlot)
		classes.push('dl-token-editor--component-slot');
	if (props.linkMode)
		classes.push('dl-token-editor--link-mode');

	const hasTokens = groups.some(g => g.tokens.length > 0);

	const onGlobalCreated = (token: string) => {
		setCreateInGroup(undefined);
		refresh();
		props.onRuntimeChange?.();
		if (props.linkMode)
			props.onCompleteLink?.(token);
	};

	const linkInitialValue = props.linkMode
		? resolvedTokenValue(props.linkMode.componentToken)
		: undefined;

	const renderGroup = (group: TokenGroup) => {
		const createSpec = props.allowCreateGlobal ? createSpecForGroup(group.title) : undefined;
		const showCreateForm = createInGroup === group.title;
		const canCreateInGroup = createSpec
			&& (!props.linkMode || groupMatchesLinkKind(group.title, props.linkMode.requiredKind));

		return (
			<div
				className={`dl-token-editor__group${isGlobalLayout ? globalGroupSlot(group.title) : ''}`}
				key={group.title}
			>
				<div className={'dl-token-editor__group-head'}>
					<div className={'dl-token-editor__group-title'}>{group.title}</div>
					{canCreateInGroup && !showCreateForm && (
						<button
							type={'button'}
							className={'dl-token-editor__group-add'}
							title={`Add ${group.title.toLowerCase()} token`}
							onClick={() => setCreateInGroup(group.title)}
						>{'+'}</button>
					)}
				</div>
				{showCreateForm && (
					<CreateGlobalTokenForm
						groupTitle={group.title}
						requiredKind={props.linkMode?.requiredKind}
						initialValue={linkInitialValue}
						onCreated={onGlobalCreated}
						onCancel={() => setCreateInGroup(undefined)}
					/>
				)}
				<div className={'dl-token-editor__group-body'}>
					{group.tokens.map(token => {
						const linkSource = props.linkMode?.componentToken === token;
						const linkPickable = !!props.linkMode
							&& isGlobalsPanel
							&& globalTokenMatchesKind(token, props.linkMode.requiredKind);
						const linkDimmed = !!props.linkMode && isGlobalsPanel && !linkPickable;

						return (
							<TokenRow
								key={token}
								token={token}
								highlighted={
									props.highlightTokens !== undefined
										? props.highlightTokens.includes(token)
										: props.highlightToken === token
								}
								onRefresh={refresh}
								onRefClick={props.onRefClick}
								rawValueEditing={isGlobalLayout}
								componentSlot={props.componentSlot}
								linkSource={linkSource}
								onStartLink={() => {
									const kind = inferComponentTokenLinkKind(
										token,
										ModuleFE_Theme.getOverride(token)?.value ?? declaredTokenValue(token)
									);
									if (kind)
										props.onStartLink?.(token, kind);
								}}
								linkPickable={linkPickable}
								linkDimmed={linkDimmed}
								onPickForLink={() => props.onCompleteLink?.(token)}
							/>
						);
					})}
				</div>
			</div>
		);
	};

	const renderGroups = () => {
		if (props.layout !== 'global-2col')
			return groups.map(renderGroup);

		const palette = groups.find(g => g.title === 'Semantic palette');
		const rest = groups.filter(g => g.title !== 'Semantic palette');

		return (
			<>
				{palette && (
					<div className={'dl-token-editor__groups-col'}>
						{renderGroup(palette)}
					</div>
				)}
				{rest.length > 0 && (
					<div className={'dl-token-editor__groups-col dl-token-editor__groups-col--stack'}>
						{rest.map(renderGroup)}
					</div>
				)}
			</>
		);
	};

	return (
		<div className={classes.join(' ')}>
			{(props.title || showControls || props.linkMode) && (
				<div className={'dl-token-editor__head'}>
					{props.title && <div className={'dl-token-editor__title'}>{props.title}</div>}
					{props.subtitle && !props.linkMode && (
						<div className={'dl-token-editor__subtitle'}>{props.subtitle}</div>
					)}
					{props.linkMode && isGlobalsPanel && (
						<div className={'dl-token-editor__link-banner'}>
							<span>
								{'Linking '}
								<code>{props.linkMode.componentToken.replace(/^--/, '')}</code>
								{' — click a matching global, Esc to cancel'}
							</span>
							<button
								type={'button'}
								className={'dl-token-editor__link-create'}
								onClick={() => setCreateInGroup(
									props.linkMode!.requiredKind === 'color'
										? 'Semantic palette'
										: props.linkMode!.requiredKind === 'length'
											? 'Radii'
											: props.linkMode!.requiredKind === 'motion'
												? 'Motion'
												: 'Typography'
								)}
							>Create global</button>
						</div>
					)}
					{showControls && (
						<div className={'dl-token-editor__controls'}>
							<label className={'dl-token-editor__master'}>
								<input
									type={'checkbox'}
									checked={masterOn}
									onChange={event => {
										ModuleFE_Theme.setAllOverridesEnabled(event.target.checked);
										refresh();
									}}
								/>
								Apply overrides ({ModuleFE_Theme.getOverrides().filter(o => o.enabled).length})
							</label>
							<label className={'dl-token-editor__scale'}>
								<span className={'dl-token-editor__scale-label'}>Base font</span>
								<input
									type={'range'}
									min={11}
									max={22}
									step={1}
									value={baseFontPx()}
									onChange={event => setBaseFontPx(parseInt(event.target.value, 10))}
								/>
								<span className={'dl-token-editor__scale-val'}>{baseFontPx()}px</span>
							</label>
							<button
								className={'dl-token-editor__clear'}
								onClick={() => {
									ModuleFE_Theme.clearOverrides();
									refresh();
								}}
							>Reset all</button>
							<div className={'dl-token-editor__export'}>
								{exportNote && (
									<span className={'dl-token-editor__export-note'}>{exportNote}</span>
								)}
								<div className={'dl-token-editor__export-grid'}>
									<button
										type={'button'}
										className={'dl-token-editor__export-btn'}
										title={'Layer 1 (full) — every component token (--ts-*) mapped to the theme token it is wired to, for the active theme. Published to #theme-editor--export for the agent.'}
										onClick={() => runExport('components', buildComponentToThemeExport)}
									>
										<DownloadIcon/>
										<span>Components</span>
									</button>
									<button
										type={'button'}
										className={'dl-token-editor__export-btn'}
										title={'Layer 2 (full) — every theme token mapped to its value, for the active theme. Published to #theme-editor--export for the agent.'}
										onClick={() => runExport('theme', buildThemeToValueExport)}
									>
										<DownloadIcon/>
										<span>Theme</span>
									</button>
									<button
										type={'button'}
										className={'dl-token-editor__export-btn'}
										title={'Layer 1 (delta) — only the component→theme overrides you changed for the active theme. Lean payload. Published to #theme-editor--export.'}
										onClick={() => runExport('delta components', buildDeltaComponentExport)}
									>
										<DownloadIcon/>
										<span>Delta Components</span>
									</button>
									<button
										type={'button'}
										className={'dl-token-editor__export-btn'}
										title={'Layer 2 (delta) — only the theme→value overrides (and created globals) you changed for the active theme. Lean payload. Published to #theme-editor--export.'}
										onClick={() => runExport('delta theme', buildDeltaThemeExport)}
									>
										<DownloadIcon/>
										<span>Delta Theme</span>
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
			)}

			<div className={'dl-token-editor__body'}>
				{!hasTokens && props.emptyHint && (
					<div className={'dl-token-editor__hint'}>{props.emptyHint}</div>
				)}
				<div className={'dl-token-editor__groups'}>
					{renderGroups()}
				</div>
			</div>
		</div>
	);
};
