import {BadImplementationException, CustomException, ServerErrorSeverity, ThisShouldNotHappenException} from '@nu-art/ts-common';
import {ApiException} from '@nu-art/thunderstorm/backend';

export const Composer_StackTrace = (exception: CustomException): string | undefined => {
	if (!exception.stack)
		return;

	return `\`\`\`${exception.stack}\`\`\``;
};

export const Composer_BadImplementationException = (exception: BadImplementationException): string => {
	let message = '';
	message += `*Exception Type :* Bad Implementation Exception\n`;
	message += `*Message :* ${exception.message}\n`;
	message += `*Caused By :* Somebody suspicious\n`;
	return message;
};

export const Composer_ApiException = (exception: ApiException): string => {
	let message = '';
	message += `*Exception Type :* API Exception\n`;
	message += `*Error Code :* ${(exception as ApiException).responseCode}\n`;
	message += `*Message :* ${(exception as ApiException).responseBody.debugMessage}\n`;
	return message;
};

export const Composer_ThisShouldNotHappenException = (exception: ThisShouldNotHappenException): string => {
	let message = '';
	message += `*Exception Type :* This Should Not Happen\n`;
	message += `*Message :* ${exception.message}\n`;
	return message;
};

export const Composer_NotificationText = (exception: CustomException) => {
	return `*${exception.exceptionType}* - ${exception.message}`;
};

export const Composer_SeverityEmoji = (severity: ServerErrorSeverity) => {
	switch (severity) {
		case ServerErrorSeverity.Critical:
			return ':red_circle:';
		case ServerErrorSeverity.Error:
			return ':large_orange_circle:';
		case ServerErrorSeverity.Warning:
			return ':large_yellow_circle:';
		case ServerErrorSeverity.Info:
			return ':large_purple_circle:';
		case ServerErrorSeverity.Debug:
			return ':large_blue_circle:';
	}
};