import * as React from 'react';
import {useEffect, useRef} from 'react';
import {LL_H_C, TS_PropRenderer} from '@nu-art/thunder-widgets/v3';
import {ModuleFE_Theme} from '@nu-art/thunder-theme';
import {
	asColorInputValue,
	colorAlpha,
	composeColor,
	composeNumericTokenValue,
	declaredTokenValue,
	fontFamilyOptions,
	formatNumericTokenBound,
	inferComponentTokenLinkKind,
	isColor,
	isFontFamilyToken,
	parseNumericTokenValue,
	parseVarRef,
	resolvedTokenValue,
	tokenAnimation
} from './token-introspection.js';
import './TokenRow.scss';
import {TokenActionIconKey, TokenActionIcons} from './token-action-icons.js';

export type TokenRowProps = {
	token: string;
	highlighted?: boolean;
	onRefresh: () => void;
	onRefClick?: (token: string) => void;
	/** Theme editor: raw value + numeric slider on the far right. */
	rawValueEditing?: boolean;
	/** Component editor left panel — swatch, resolved value, locate + link. */
	componentSlot?: boolean;
	/** This component token is the active link source. */
	linkSource?: boolean;
	/** Start link mode for this component token. */
	onStartLink?: () => void;
	/** Global row: highlighted pick target during link mode. */
	linkPickable?: boolean;
	/** Global row: dimmed during link mode (wrong type). */
	linkDimmed?: boolean;
	/** Complete link by picking this global. */
	onPickForLink?: () => void;
};

/**
 * Canonical name + tooltip for each per-row token action. Single source of truth so the
 * locate / reset / apply controls read identically everywhere they appear (title + aria).
 */
export const TokenActions = {
	locate: {label: 'Locate', tip: 'Flash where this token is used'},
	reset: {label: 'Reset', tip: 'Reset to the theme default'},
	apply: {label: 'Apply', tip: 'Toggle this override on/off'},
	link: {label: 'Link', tip: 'Link to a different global token'}
} as const;

const TokenActionIcon: React.FC<{action: TokenActionIconKey}> = props => {
	const Icon = TokenActionIcons[props.action].component;
	return <Icon/>;
};

const tokenDisplayName = (token: string) => token.replace(/^--/, '');

const TokenIdentityRow: React.FC<{
	token: string;
	pointsTo?: string;
	onRefClick?: (token: string) => void;
}> = props => (
	<TS_PropRenderer.Horizontal
		className={'dl-token-row__identity'}
		label={tokenDisplayName(props.token)}
		title={props.token}
		verticalAlignment={'center'}
	>
		{props.pointsTo && (
			<button
				type={'button'}
				className={'dl-token-row__ref'}
				title={`Jump to ${props.pointsTo}`}
				onClick={() => props.onRefClick?.(props.pointsTo!)}
			>
				{'→ '}{tokenDisplayName(props.pointsTo)}
			</button>
		)}
	</TS_PropRenderer.Horizontal>
);

const TokenControlsRow: React.FC<{
	token: string;
	color: boolean;
	numeric?: ReturnType<typeof parseNumericTokenValue>;
	alpha: number;
	rgbHex?: string;
	onAlphaChange: (percent: number) => void;
	onNumericChange: (value: number) => void;
}> = props => {
	if (!props.color && !props.numeric)
		return null;

	return (
		<LL_H_C className={'dl-token-row__controls'}>
			{props.color && (
				<div className={'dl-token-row__alpha'} title={'Opacity %'}>
					<input
						type={'range'}
						className={'dl-token-row__value-slider'}
						min={0}
						max={100}
						step={1}
						value={Math.round(props.alpha * 100)}
						onChange={event => props.onAlphaChange(parseInt(event.target.value, 10))}
					/>
					<input
						type={'number'}
						className={'dl-token-row__alpha-input'}
						min={0}
						max={100}
						step={1}
						value={Math.round(props.alpha * 100)}
						onChange={event => {
							const parsed = parseInt(event.target.value, 10);
							if (Number.isFinite(parsed))
								props.onAlphaChange(parsed);
						}}
					/>
					<span className={'dl-token-row__alpha-suffix'}>{'%'}</span>
				</div>
			)}
			{props.numeric && (
				<div className={'dl-token-row__value-slider-wrap'}>
					<span className={'dl-token-row__slider-bound'}>
						{formatNumericTokenBound(props.numeric.min, props.numeric.unit)}
					</span>
					<input
						type={'range'}
						className={'dl-token-row__value-slider'}
						min={props.numeric.min}
						max={props.numeric.max}
						step={props.numeric.step}
						value={props.numeric.value}
						title={`Adjust ${tokenDisplayName(props.token)}`}
						onChange={event => props.onNumericChange(parseFloat(event.target.value))}
					/>
					<span className={'dl-token-row__slider-bound'}>
						{formatNumericTokenBound(props.numeric.max, props.numeric.unit)}
					</span>
				</div>
			)}
		</LL_H_C>
	);
};

/**
 * Token editor cell — three rows:
 * 1. identity (TS_PropRenderer — token name · → ref)
 * 2. value (actions + swatch / text / select)
 * 3. controls (opacity slider or numeric range, when applicable)
 */
export const TokenRow: React.FC<TokenRowProps> = props => {
	const rowRef = useRef<HTMLDivElement>(null);
	const override = ModuleFE_Theme.getOverride(props.token);
	const raw = declaredTokenValue(props.token);
	const effectiveDeclaration = override?.value ?? raw;
	const value = override?.value ?? resolvedTokenValue(props.token);
	const color = isColor(value);
	const rgbHex = color ? asColorInputValue(value)! : undefined;
	const alpha = color ? colorAlpha(value) : 1;
	const canLocate = !!tokenAnimation(value);
	const pointsTo = parseVarRef(effectiveDeclaration);
	const numeric = props.rawValueEditing ? parseNumericTokenValue(props.token, value) : undefined;
	const slotNumeric = props.componentSlot && !pointsTo
		? parseNumericTokenValue(props.token, value)
		: undefined;
	const fontFamily = (props.rawValueEditing || (props.componentSlot && !pointsTo))
		&& isFontFamilyToken(props.token);

	const canLink = props.componentSlot && !!inferComponentTokenLinkKind(props.token, effectiveDeclaration);

	useEffect(() => {
		if (props.highlighted && rowRef.current)
			rowRef.current.scrollIntoView({behavior: 'smooth', block: 'nearest'});
	}, [props.highlighted]);

	const locate = () => {
		const anim = tokenAnimation(value);
		if (anim)
			ModuleFE_Theme.animateToken(props.token, anim);
	};

	const setNumericValue = (n: number) => {
		const active = numeric ?? slotNumeric;
		if (!active)
			return;
		const clamped = Math.min(active.max, Math.max(active.min, n));
		ModuleFE_Theme.setOverride(props.token, composeNumericTokenValue(active, clamped));
		props.onRefresh();
	};

	const setAlphaPercent = (percent: number) => {
		const clamped = Math.min(100, Math.max(0, percent));
		ModuleFE_Theme.setOverride(props.token, composeColor(rgbHex!, clamped / 100));
		props.onRefresh();
	};

	const rowClass = [
		'dl-token-row',
		props.componentSlot && 'dl-token-row--component-slot',
		props.componentSlot && !pointsTo && 'dl-token-row--unlinked',
		props.linkSource && 'dl-token-row--link-source',
		props.linkPickable && 'dl-token-row--link-target',
		props.linkDimmed && 'dl-token-row--link-dimmed',
		props.highlighted && 'dl-token-row--highlighted'
	].filter(Boolean).join(' ');

	const renderValueRow = (actions: React.ReactNode, valueEditor: React.ReactNode) => (
		<LL_H_C className={'dl-token-row__value-row'}>
			<div
				className={'dl-token-row__actions'}
				onClick={event => props.linkPickable && event.stopPropagation()}
			>
				{actions}
			</div>
			{valueEditor}
		</LL_H_C>
	);

	const pickForLink = () => {
		if (props.linkPickable)
			props.onPickForLink?.();
	};

	if (props.componentSlot) {
		return (
			<div ref={rowRef} className={rowClass} title={props.token}>
				<div className={'dl-token-row__slot-name'}>{tokenDisplayName(props.token)}</div>

				<LL_H_C className={'dl-token-row__slot-ref-row'}>
					<button
						type={'button'}
						className={'dl-token-row__slot-link-icon'}
						title={TokenActions.link.tip}
						disabled={!canLink || props.linkSource}
						onClick={() => props.onStartLink?.()}
						aria-label={TokenActions.link.label}
					><TokenActionIcon action={'link'}/></button>
					{pointsTo ? (
						<button
							type={'button'}
							className={'dl-token-row__slot-ref'}
							title={`Jump to ${pointsTo}`}
							onClick={() => props.onRefClick?.(pointsTo)}
						>{tokenDisplayName(pointsTo)}</button>
					) : (
						<button
							type={'button'}
							className={'dl-token-row__slot-ref dl-token-row__slot-ref--empty'}
							title={TokenActions.link.tip}
							disabled={!canLink || props.linkSource}
							onClick={() => props.onStartLink?.()}
							aria-label={TokenActions.link.label}
						>{'not linked'}</button>
					)}
				</LL_H_C>

				<LL_H_C className={'dl-token-row__slot-value-row'}>
					<button
						type={'button'}
						className={'dl-token-row__slot-locate-icon'}
						title={TokenActions.locate.tip}
						disabled={!canLocate}
						onClick={locate}
						aria-label={TokenActions.locate.label}
					><TokenActionIcon action={'locate'}/></button>
					{pointsTo ? (
						<LL_H_C className={'dl-token-row__color-value dl-token-row__color-value--static'}>
							{color && (
								<span
									className={'dl-token-row__swatch dl-token-row__swatch--static'}
									style={{['--sw' as any]: value}}
								/>
							)}
							<span className={'dl-token-row__value-text'}>{value}</span>
						</LL_H_C>
					) : (
						<div className={'dl-token-row__color-value'}>
							{color && rgbHex && (
								<label
									className={'dl-token-row__swatch'}
									style={{['--sw' as any]: value}}
									title={'Pick colour'}
								>
									<input
										type={'color'}
										value={rgbHex}
										onChange={event => {
											ModuleFE_Theme.setOverride(props.token, composeColor(event.target.value, alpha));
											props.onRefresh();
										}}
									/>
								</label>
							)}
							{fontFamily ? (
								<select
									className={'dl-token-row__value dl-token-row__value-select'}
									value={value}
									style={{fontFamily: value}}
									onChange={event => {
										ModuleFE_Theme.setOverride(props.token, event.target.value);
										props.onRefresh();
									}}
								>
									{fontFamilyOptions(value).map(option => (
										<option key={option} value={option} style={{fontFamily: option}}>{option}</option>
									))}
								</select>
							) : (
								<input
									type={'text'}
									className={'dl-token-row__value'}
									value={value}
									spellCheck={false}
									onChange={event => {
										ModuleFE_Theme.setOverride(props.token, event.target.value);
										props.onRefresh();
									}}
								/>
							)}
						</div>
					)}
				</LL_H_C>
				{!pointsTo && (color || slotNumeric) && (
					<TokenControlsRow
						token={props.token}
						color={color}
						numeric={slotNumeric}
						alpha={alpha}
						rgbHex={rgbHex}
						onAlphaChange={setAlphaPercent}
						onNumericChange={setNumericValue}
					/>
				)}
			</div>
		);
	}

	const rowBody = (
		<>
			<TokenIdentityRow token={props.token} pointsTo={pointsTo} onRefClick={props.onRefClick}/>

			{renderValueRow(
				<>
					<input
						type={'checkbox'}
						className={'dl-token-row__toggle'}
						title={TokenActions.apply.tip}
						aria-label={TokenActions.apply.label}
						checked={!!override?.enabled}
						disabled={!override}
						onChange={event => {
							ModuleFE_Theme.setOverrideEnabled(props.token, event.target.checked);
							props.onRefresh();
						}}
					/>
					<button
						type={'button'}
						className={'dl-token-row__action-btn dl-token-row__locate'}
						title={TokenActions.locate.tip}
						disabled={!canLocate}
						onClick={locate}
						aria-label={TokenActions.locate.label}
					><TokenActionIcon action={'locate'}/></button>
					<button
						type={'button'}
						className={'dl-token-row__action-btn dl-token-row__reset'}
						title={TokenActions.reset.tip}
						disabled={!override}
						onClick={() => {
							ModuleFE_Theme.removeOverride(props.token);
							props.onRefresh();
						}}
						aria-label={TokenActions.reset.label}
					><TokenActionIcon action={'reset'}/></button>
				</>,
				<div
					className={'dl-token-row__color-value'}
					onClick={event => props.linkPickable && event.stopPropagation()}
				>
					{color && (
						<label
							className={'dl-token-row__swatch'}
							style={{['--sw' as any]: value}}
							title={'Pick colour'}
						>
							<input
								type={'color'}
								value={rgbHex}
								onChange={event => {
									ModuleFE_Theme.setOverride(props.token, composeColor(event.target.value, alpha));
									props.onRefresh();
								}}
							/>
						</label>
					)}
					{fontFamily ? (
						<select
							className={'dl-token-row__value dl-token-row__value-select'}
							value={value}
							style={{fontFamily: value}}
							onChange={event => {
								ModuleFE_Theme.setOverride(props.token, event.target.value);
								props.onRefresh();
							}}
						>
							{fontFamilyOptions(value).map(option => (
								<option key={option} value={option} style={{fontFamily: option}}>{option}</option>
							))}
						</select>
					) : (
						<input
							type={'text'}
							className={'dl-token-row__value'}
							value={value}
							spellCheck={false}
							onChange={event => {
								ModuleFE_Theme.setOverride(props.token, event.target.value);
								props.onRefresh();
							}}
						/>
					)}
				</div>
			)}

			<div
				className={'dl-token-row__controls-wrap'}
				onClick={event => props.linkPickable && event.stopPropagation()}
			>
				<TokenControlsRow
					token={props.token}
					color={color}
					numeric={numeric}
					alpha={alpha}
					rgbHex={rgbHex}
					onAlphaChange={setAlphaPercent}
					onNumericChange={setNumericValue}
				/>
			</div>
		</>
	);

	if (props.linkPickable) {
		return (
			<div
				ref={rowRef}
				className={rowClass}
				role={'button'}
				tabIndex={0}
				onClick={pickForLink}
				onKeyDown={event => {
					if (event.key === 'Enter' || event.key === ' ')
						pickForLink();
				}}
			>
				{rowBody}
			</div>
		);
	}

	return (
		<div ref={rowRef} className={rowClass}>
			{rowBody}
		</div>
	);
};
