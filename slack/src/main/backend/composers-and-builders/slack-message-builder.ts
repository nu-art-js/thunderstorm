import {SlackBlock} from '../SlackBuilder';

export const SlackBuilder_TextSection = (text: string): SlackBlock => {
	return {
		type: 'section',
		text: {
			// @ts-ignore
			type: 'mrkdwn',
			text: text,
		}
	};
};

export const SlackBuilder_Divider = (): SlackBlock => {
	return {
		type: 'divider'
	};
};

export const SlackBuilder_TextSectionWithTitle = (title: string, text: string): SlackBlock[] => {
	return [
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: title
			}
		},
		{
			type: 'divider'
		},
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: text
			}
		},
	];
};