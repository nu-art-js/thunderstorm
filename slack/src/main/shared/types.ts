import {PartialProperties} from '@thunder-storm/common';
import {ChatPostMessageArguments} from '@slack/web-api';

export type PreSendSlackStructuredMessage = PartialProperties<ChatPostMessageArguments, 'channel' | 'text'>
