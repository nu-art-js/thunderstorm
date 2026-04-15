import * as React from 'react';
import {exists, isPromise, ResolvableContent, resolveContent} from '@nu-art/ts-common';
import '../Button.scss';
import {_className} from '@nu-art/thunder-core';
import {LL_H_C} from '../../layouts/v3/Layouts.js';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'text' | 'dangerous' | (string & {});
type ButtonProps = Omit<React.HTMLProps<HTMLButtonElement>, 'type' | 'ref'>;
export type Props_Button = ButtonProps & {
	loader?: ResolvableContent<React.ReactNode>;
	variant?: ButtonVariant;
	innerRef?: React.RefObject<HTMLButtonElement>;
	actionInProgress?: boolean;
	onDisabledClick?: (e: React.MouseEvent<HTMLButtonElement>) => any;
};

export function Button(props: Props_Button): React.ReactElement {
	const {
					loader,
					variant = 'tertiary',
					innerRef,
					onDisabledClick,
					actionInProgress: controlledInProgress,
					onClick,
					disabled: disabledProp,
					className,
					children,
					...rest
				} = props;
	const [internalInProgress, setInternalInProgress] = React.useState(false);
	const actionInProgress = exists(controlledInProgress) ? controlledInProgress : internalInProgress;
	const disabled = !!disabledProp;

	const handleAction = React.useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
		if (actionInProgress)
			return;
		if (disabled)
			return onDisabledClick?.(e);
		const result = onClick?.(e) as Promise<void> | void;
		if (!isPromise(result))
			return;
		if (!exists(controlledInProgress))
			setInternalInProgress(true);
		try {
			await result;
		} finally {
			if (!exists(controlledInProgress))
				setInternalInProgress(false);
		}
	}, [actionInProgress, disabled, onDisabledClick, onClick, controlledInProgress]);

	const btnClassName = _className('ts-button', className, actionInProgress && 'action-in-progress');
	const loaderNode = loader ? resolveContent(loader) : <div className="ts-button__loader"/>;

	return (
		<button
			{...rest}
			className={btnClassName}
			disabled={disabled}
			ref={innerRef}
			data-variant={variant}
			type="button"
			onClick={handleAction}
		>
			<LL_H_C className="ts-button__content">
				{children}
			</LL_H_C>
			{loaderNode}
		</button>
	);
}

export const TS_Button = Button;
