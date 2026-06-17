import * as React from 'react';
import {LL_H_C, TS_Button} from '@nu-art/thunder-widgets/v3';
import {ModuleFE_Theme, ThemeName} from '@nu-art/thunder-theme';

export type ThemeSwitcherProps = {
	activeTheme: ThemeName;
	onThemeChange: (theme: ThemeName) => void;
};

/** Theme picker strip — shared across all Design Language modes. */
export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = props => (
	<LL_H_C className={'dl-gallery__switcher'}>
		{ModuleFE_Theme.getThemes().map(theme => (
			<TS_Button
				key={theme.name}
				variant={props.activeTheme === theme.name ? 'primary' : 'secondary'}
				onClick={() => props.onThemeChange(theme.name)}
			>
				{theme.label}
			</TS_Button>
		))}
	</LL_H_C>
);
