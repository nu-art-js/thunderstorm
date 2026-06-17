import * as React from 'react';
import {LL_H_C, LL_V_L} from '@nu-art/thunder-widgets/v3';
import './GallerySection.scss';

export type GallerySectionProps = {
	title?: string;
	/** Controls rendered on the same row as the title (e.g. Inspect toggle). */
	headerActions?: React.ReactNode;
	/** Span the full width of the enclosing grid. */
	wide?: boolean;
	/** Shrink to hug the content width instead of filling the parent. */
	fitContent?: boolean;
	/** Title opens component editor; preview body stays interactive. */
	selectable?: boolean;
	selected?: boolean;
	onClick?: () => void;
	children?: React.ReactNode;
};

/** Titled section card — used for component previews (grid cards and standalone panels). */
export const GallerySection: React.FC<GallerySectionProps> = props => {
	const classes = ['dl-section'];
	if (props.wide)
		classes.push('dl-section--wide');
	if (props.fitContent)
		classes.push('dl-section--fit');
	if (props.selected)
		classes.push('dl-section--selected');

	const title = props.title && (
		props.selectable ? (
			<button
				type={'button'}
				className={'dl-section__title dl-section__title--link'}
				onClick={props.onClick}
			>{props.title}</button>
		) : (
			<div className={'dl-section__title'}>{props.title}</div>
		)
	);

	return (
		<LL_V_L className={classes.join(' ')}>
			{(title || props.headerActions) && (
				<LL_H_C className={'dl-section__head'}>
					{title}
					{props.headerActions && (
						<div className={'dl-section__actions'}>{props.headerActions}</div>
					)}
				</LL_H_C>
			)}
			{props.children}
		</LL_V_L>
	);
};
