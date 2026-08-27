import {ComponentPreview} from './Preview.types.js';
import {Preview_Button} from './previews/Preview_Button.js';
import {Preview_Input} from './previews/Preview_Input.js';
import {Preview_Textarea} from './previews/Preview_Textarea.js';
import {Preview_Checkbox} from './previews/Preview_Checkbox.js';
import {Preview_Radio} from './previews/Preview_Radio.js';
import {Preview_Toggle} from './previews/Preview_Toggle.js';
import {Preview_DropDown} from './previews/Preview_DropDown.js';
import {Preview_Label} from './previews/Preview_Label.js';
import {Preview_Slider} from './previews/Preview_Slider.js';
import {Preview_ButtonGroup} from './previews/Preview_ButtonGroup.js';
import {Preview_CheckboxGroup} from './previews/Preview_CheckboxGroup.js';
import {Preview_Link} from './previews/Preview_Link.js';
import {Preview_IconButton} from './previews/Preview_IconButton.js';
import {Preview_Loader} from './previews/Preview_Loader.js';
import {Preview_ProgressBar} from './previews/Preview_ProgressBar.js';
import {Preview_Toast} from './previews/Preview_Toast.js';
import {Preview_ReadMore} from './previews/Preview_ReadMore.js';
import {Preview_ColorSwatch} from './previews/Preview_ColorSwatch.js';
import {Preview_JSONViewer} from './previews/Preview_JSONViewer.js';
import {Preview_Tree} from './previews/Preview_Tree.js';

/**
 * The gallery catalog. One line per tokenized widget; the page maps over this.
 * Scope grows incrementally as more Thunderstorm classes are tokenized in
 * @app/styles-components. Order = display order within each layout tier.
 */
export const ComponentPreviews: ComponentPreview[] = [
	{id: 'button', title: 'Button', renderer: Preview_Button, layout: 'matrix'},
	{id: 'input', title: 'Input', renderer: Preview_Input, layout: 'row'},
	{id: 'textarea', title: 'Textarea', renderer: Preview_Textarea, layout: 'row'},
	{id: 'checkbox', title: 'Checkbox', renderer: Preview_Checkbox, layout: 'row'},
	{id: 'radio', title: 'Radio', renderer: Preview_Radio, layout: 'row'},
	{id: 'toggle', title: 'Toggle', renderer: Preview_Toggle, layout: 'row'},
	{id: 'dropdown', title: 'DropDown', renderer: Preview_DropDown, layout: 'row'},
	{id: 'label', title: 'Label', renderer: Preview_Label, layout: 'row'},
	{id: 'slider', title: 'Slider', renderer: Preview_Slider, layout: 'row'},
	{id: 'button-group', title: 'Button group', renderer: Preview_ButtonGroup, layout: 'row'},
	{id: 'checkbox-group', title: 'Checkbox group', renderer: Preview_CheckboxGroup, layout: 'row'},
	{id: 'link', title: 'Link', renderer: Preview_Link, layout: 'row'},
	{id: 'icon-button', title: 'Icon button', renderer: Preview_IconButton, layout: 'row'},
	{id: 'loader', title: 'Loader', renderer: Preview_Loader, layout: 'row'},
	{id: 'progress-bar', title: 'Progress bar', renderer: Preview_ProgressBar, layout: 'row'},
	{id: 'toast', title: 'Toast', renderer: Preview_Toast, layout: 'row'},
	{id: 'read-more', title: 'Read more', renderer: Preview_ReadMore, layout: 'row'},
	{id: 'color-swatch', title: 'Color swatch', renderer: Preview_ColorSwatch, layout: 'row'},
	{id: 'json-viewer', title: 'JSON viewer', renderer: Preview_JSONViewer, layout: 'row'},
	{id: 'tree', title: 'Tree', renderer: Preview_Tree, layout: 'row'}
];
