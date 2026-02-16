import * as React from 'react';
import {HTMLProps} from 'react';
import {useRef, useCallback} from 'react';
import {_className} from '@nu-art/thunder-core';
import '../TS_Printable.scss';

type Props = HTMLProps<HTMLDivElement> & {
	printable: (ref: HTMLDivElement) => Promise<void>;
	printOnly?: boolean;
};

export function TS_Printable(props: Props): React.ReactElement {
	const {printable, printOnly, children, ...rest} = props;
	const ref = useRef<HTMLDivElement | null>(null);
	const done = useRef(false);
	const setRef = useCallback((el: HTMLDivElement | null) => {
		if (!el || done.current)
			return;
		ref.current = el;
		done.current = true;
		printable(el).then(() => { done.current = false; });
	}, [printable]);
	return (
		<div
			{...rest}
			className={_className('ts-printable', props.className, printOnly ? 'print-only' : undefined)}
			ref={setRef}
		>
			{children}
		</div>
	);
}
