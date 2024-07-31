import {Stream} from 'stream';
import {Block, KnownBlock} from '@slack/web-api';

export type SlackFile = {
	file: Buffer | Stream;
	fileName: string;
	title?: string;
}

export type SlackBlock = Block | KnownBlock;

export type ThreadPointer = { ts?: string, channel: string };
