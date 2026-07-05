import {BadImplementationException, randomNumber} from '@nu-art/ts-common';

export type SkeletonWidth = number | 'random' | `${number}%`;

export function resolveSkeletonWidth(width: SkeletonWidth, randomWidthRange: [number, number] = [50, 150]): string {
	switch (typeof width) {
		case 'number':
			return `${width}px`;

		case 'string': {
			if (width === 'random') {
				const [min, max] = randomWidthRange;
				const randomWidth = min + randomNumber(max - min + 1);
				return `${randomWidth}px`;
			}
			if (width.at(-1) === '%')
				return width;

			throw new BadImplementationException(`Unknown skeleton width format '${width}'`);
		}

		default:
			throw new BadImplementationException(`Unhandled skeleton width type ('${typeof width}'): ${width}`);
	}
}
