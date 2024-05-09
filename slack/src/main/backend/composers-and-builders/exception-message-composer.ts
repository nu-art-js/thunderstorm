import {CustomException, ServerErrorSeverity} from '@nu-art/ts-common';

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