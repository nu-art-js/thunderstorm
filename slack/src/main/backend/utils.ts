/**
 * Receives slack error and returns a human-readable error message
 * @param error The error received from the api call
 */
export const postSlackMessageErrorHandler = (error: any) => {
	const prefix = 'Slack error! ';
	if (error.data && error.data.error) {
		switch (error.data.error) {
			case 'channel_not_found':
				return `${prefix}The specified channel does not exist or is not accessible by your access token. Please double check defined channel in config and adjust if needed`;
			case 'not_in_channel':
				return `${prefix}The bot or user is not a member of the specified channel.`;
			case 'is_archived':
				return `${prefix}The channel has been archived and cannot be written to.`;
			case 'msg_too_long':
				return `${prefix}The message text exceeds the maximum allowed length.`;
			case 'no_text':
				return `${prefix}The message text was provided empty.`;
			case 'rate_limited':
				return `${prefix}Too many messages have been sent in a short period. Please try again later.`;
			case 'not_authed':
				return `${prefix}No authentication token was provided. Please provide a valid token.`;
			case 'invalid_auth':
				return `${prefix}The authentication token provided is invalid. Please check your token settings.`;
			case 'access_denied':
				return `${prefix}Access has been denied. The token does not have the necessary permissions to perform this operation.`;
			case 'account_inactive':
				return `${prefix}The user account associated with the token is inactive.`;
			case 'token_revoked':
				return `${prefix}The token has been revoked.`;
			case 'no_permission':
				return `${prefix}The token does not have the necessary permission to post messages in the specified channel.`;
			case 'user_is_bot':
				return `${prefix}The user associated with the token is a bot, which cannot post messages.`;
			case 'team_access_not_granted':
				return `${prefix}The application has not been granted access to post messages in the specified team.`;
			default:
				return `${prefix}An unexpected error occurred: ${error.data.error}`;
		}
	} else {
		return `${prefix}An unknown error occurred. Please check your network and try again.`;
	}
};