import {WidgetComponentGuide} from './types.js';
import {treeComponentGuide} from './tree/index.js';

const widgetComponentGuides: WidgetComponentGuide[] = [
	treeComponentGuide,
];

const byId = Object.fromEntries(widgetComponentGuides.map(guide => [guide.id, guide])) as Record<string, WidgetComponentGuide>;

export const listWidgetComponentGuides = (): WidgetComponentGuide[] => widgetComponentGuides;

export const getWidgetComponentGuide = (id: string): WidgetComponentGuide | undefined => byId[id];
