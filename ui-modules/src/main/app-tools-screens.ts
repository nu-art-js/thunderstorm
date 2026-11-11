/*
 * @nu-art/thunder-ui-modules - Developer screens for the App-Tools navigator
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ATS_Button} from './ATS_Button/ATS_Button.js';
import {ATS_Checkbox} from './ATS_Checkbox/ATS_Checkbox.js';
import {ATS_CheckboxGroup} from './ATS_CheckboxGroup/ATS_CheckboxGroup.js';
import {ATS_CollapsableContainerV2} from './ATS_CollapsableContainer/ATS_CollapsableContainer.js';
import {ATS_CollectionUpgrades} from './ATS_CollectionUpgrades/ATS_CollectionUpgrades.js';
import {ATS_CrudOperations} from './ATS_CrudOperations/ATS_CrudOperations.js';
import {ATS_Label} from './ATS_Label/ATS_Label.js';
import {ATS_Printable} from './ATS_Printable/ATS_Printable.js';
import {ATS_TextArea} from './ATS_TextArea/ATS_TextArea.js';
import {ATS_Toaster} from './ATS_Toaster/ATS_Toaster.js';
import {ATS_ToastingPlacement} from './ATS_ToastingPlacement/ATS_ToastingPlacement.js';
import {ATS_Toggle} from './ATS_Toggle/ATS_Toggle.js';
import type {AppToolsScreen} from './TS_AppTools/types.js';

export const ThunderstormAppToolsScreens: AppToolsScreen[] = [
	ATS_Button.Screen,
	ATS_Checkbox,
	ATS_CheckboxGroup.Screen,
	ATS_CollapsableContainerV2,
	ATS_Label.Screen,
	ATS_TextArea.Screen,
	ATS_Toggle.Screen,
	ATS_Printable.Screen,
	ATS_Toaster.screen,
	ATS_ToastingPlacement,
	ATS_CollectionUpgrades.screen,
	ATS_CrudOperations.screen,
];
