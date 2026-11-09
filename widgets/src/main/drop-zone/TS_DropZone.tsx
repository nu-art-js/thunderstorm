import {useRef, useState, type DragEvent, type ReactNode} from 'react';
import {_className} from '@nu-art/thunder-core';
import {asArray} from '@nu-art/ts-common';
import './TS_DropZone.scss';

export type DropFile = {
	file: File;
	accepted: boolean;
};

type Props = {
	className?: string;
	disabled?: boolean;
	/** When omitted, every file is accepted. */
	validate?: (files: File[]) => DropFile[];
	onDrop: (accepted: File[], rejected: File[]) => void;
	onDragChange?: (active: boolean) => void;
	children: ReactNode;
};

const fileDrag = (event: DragEvent) =>
	Array.from(event.dataTransfer?.types ?? []).includes('Files');

const acceptAll = (files: File[]): DropFile[] =>
	files.map(file => ({file, accepted: true}));

/** Suffix match on the file name. `js` and `.js` both mean a name ending in `.js`. */
export const acceptFilesBySuffix = (extensions: string | string[]) => {
	const list = asArray(extensions).map(ext => ext.replace(/^\./, '').toLowerCase());
	return (files: File[]): DropFile[] => files.map(file => ({
		file,
		accepted: list.some(ext => file.name.toLowerCase().endsWith(`.${ext}`)),
	}));
};

/**
 * File drop target around existing content. The children stay visible.
 * A drag depth counter ignores enter/leave events fired by those children.
 */
export const TS_DropZone = (props: Props) => {
	const depth = useRef(0);
	const hot = useRef(false);
	const [, render] = useState(0);

	const setHot = (next: boolean) => {
		if (hot.current === next)
			return;
		hot.current = next;
		render(count => count + 1);
		props.onDragChange?.(next);
	};

	const onDragEnter = (event: DragEvent<HTMLDivElement>) => {
		if (props.disabled || !fileDrag(event))
			return;
		event.preventDefault();
		depth.current += 1;
		if (depth.current === 1)
			setHot(true);
	};

	const onDragOver = (event: DragEvent<HTMLDivElement>) => {
		if (props.disabled || !fileDrag(event))
			return;
		event.preventDefault();
		event.dataTransfer.dropEffect = 'copy';
	};

	const onDragLeave = (event: DragEvent<HTMLDivElement>) => {
		if (props.disabled || !fileDrag(event))
			return;
		depth.current = Math.max(0, depth.current - 1);
		if (depth.current === 0)
			setHot(false);
	};

	const onDrop = (event: DragEvent<HTMLDivElement>) => {
		if (!fileDrag(event))
			return;
		event.preventDefault();
		event.stopPropagation();
		depth.current = 0;
		setHot(false);
		if (props.disabled)
			return;
		const files = Array.from(event.dataTransfer.files);
		if (!files.length)
			return;
		const judged = (props.validate ?? acceptAll)(files);
		props.onDrop(
			judged.filter(item => item.accepted).map(item => item.file),
			judged.filter(item => !item.accepted).map(item => item.file),
		);
	};

	return <div
		className={_className('ts-drop-zone', hot.current && 'ts-drop-zone--hot', props.className)}
		onDragEnter={onDragEnter}
		onDragOver={onDragOver}
		onDragLeave={onDragLeave}
		onDrop={onDrop}>
		{props.children}
	</div>;
};
