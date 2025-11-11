import {PartialProperties} from '@nu-art/ts-common';
import {ChatPostMessageArguments} from '@slack/web-api';

export type PreSendSlackStructuredMessage = PartialProperties<ChatPostMessageArguments, 'channel' | 'text'>
