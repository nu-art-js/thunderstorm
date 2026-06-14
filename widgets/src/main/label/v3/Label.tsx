import * as React from 'react';
import {useEffect, useRef} from 'react';
import {_className} from '@nu-art/thunder-core';
import {addWindowResizeListener, removeWindowResizeListener} from '@nu-art/thunder-core';
import '../Label.scss';

type Props = React.PropsWithChildren<{
	tooltip?: React.ReactNode;
	className?: string;
	containerSelector?: string;
	onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}>;

const activeTruncationClass = 'truncate-active';
const activeTooltipClass = 'tooltip-active';
const invertTooltipClass = 'invert-tooltip';

function checkOverflow(el: HTMLDivElement | null, tooltip: React.ReactNode) {
	if (!el)
		return;
	const content = el.querySelector('.ts-label__content');
	const measureEl = content instanceof HTMLElement ? content : el;
	const overflowing = measureEl.scrollWidth > measureEl.clientWidth;
	if (!overflowing) {
		el.classList.remove(activeTruncationClass);
		el.classList.remove(activeTooltipClass);
		return;
	}
	el.classList.add(activeTruncationClass);
	if (tooltip)
		el.classList.add(activeTooltipClass);
}

function checkTooltipDir(el: HTMLDivElement | null, containerSelector?: string) {
	if (!el || !containerSelector)
		return;
	const container = el.closest(containerSelector);
	if (!container)
		return;
	const containerTop = container.getBoundingClientRect().top;
	const labelRect = el.getBoundingClientRect();
	const distance = labelRect.top - containerTop;
	if (distance <= labelRect.height * 2.5)
		el.classList.add(invertTooltipClass);
	else
		el.classList.remove(invertTooltipClass);
}

export function Label(props: Props): React.ReactElement {
	const {tooltip = '', className, containerSelector, onClick, children, ...rest} = props;
	const labelRef = useRef<HTMLDivElement>(null);
	const handler = {__onWindowResized: () => checkOverflow(labelRef.current, tooltip)};

	useEffect(() => {
		addWindowResizeListener(handler);
		checkOverflow(labelRef.current, tooltip);
		return () => removeWindowResizeListener(handler);
	}, [tooltip]);

	useEffect(() => {
		checkOverflow(labelRef.current, tooltip);
	});

	return (
		<div
			{...rest}
			className={_className('ts-label', className)}
			data-tooltip={tooltip}
			onMouseEnter={() => checkTooltipDir(labelRef.current, containerSelector)}
			onClick={onClick}
			ref={labelRef}
		>
			<div className="ts-label__content">{children}</div>
		</div>
	);
}
