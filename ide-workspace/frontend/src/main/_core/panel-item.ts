import {Logger} from '@nu-art/ts-common';
import {ReactNode} from 'react';
import {ModuleFE_IdeWorkspace} from '../_module/ModuleFE_IdeWorkspace/ModuleFE_IdeWorkspace.js';

type PanelItemRenderer<Args extends any = void> = (panelItem: PanelItem<Args>, args: Args) => ReactNode;

export class PanelItem<Args extends any = void>
	extends Logger {

	public readonly key: string;
	public renderer: PanelItemRenderer<Args>;

	constructor(key: string) {
		super(`PanelItem_${key}`);
		this.key = key;
		this.renderer = () => `Renderer not set for panel item ${this.key}`;
		ModuleFE_IdeWorkspace.panelItem.register(this);
	}

	public setRenderer = (renderer: PanelItemRenderer<Args>) => {
		this.renderer = renderer;
		return this;
	};
}
