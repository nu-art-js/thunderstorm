import {_keys, Module} from '@nu-art/ts-common';
import {StorageKey} from './ModuleFE_LocalStorage';


type Theme = {
	[prop: string]: string
}

export type ThemeOptions<ThemeType> = { [P in keyof ThemeType]: ThemeType[P][] };

export abstract class ModuleFE_BaseTheme<ThemeType extends Theme>
	extends Module {

	private options: ThemeOptions<ThemeType>;

	constructor(options: ThemeOptions<ThemeType>) {
		super();
		this.options = options;
	}

	protected init() {
		_keys(this.options).forEach((option: keyof ThemeType) => {
			return this.setThemeProp(option, this.getThemeProp(option));
		});
	}

	getOptions = () => this.options;

	setThemeProp<P extends keyof ThemeType>(themeKey: P, themeValue: ThemeType[P]) {
		const _themeKey = themeKey as string;
		document.querySelector('body')?.setAttribute(_themeKey, themeValue);
		this.createStorageKey<P>(themeKey).set(themeValue);
	}

	getThemeProp<P extends keyof ThemeType>(themeKey: P): ThemeType[P] {
		return this.createStorageKey(themeKey).get(this.options[themeKey][0]);
	}

	createStorageKey<P extends keyof ThemeType>(themeKey: P) {
		const _themeKey = themeKey as string;
		return new StorageKey<ThemeType[P]>(`theme-key--${_themeKey}`);
	}
}
