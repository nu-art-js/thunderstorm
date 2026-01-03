import {ATS_Printable} from '../_ats/ATS_Printables/ATS_Printable.js';
import {ATS_Button} from '@nu-art/thunder-ui-modules//ATS_Button/ATS_Button.js';
import {ATS_Label} from './Label/ATS_Label.js';
import {AppToolsScreen} from '../../../../ui-modules//TS_AppTools/index.js';
import {ATS_CheckboxV2} from '@nu-art/thunder-ui-modules//ATS_Checkbox/ATS_CheckboxV2.js';
import {ATS_CheckboxGroup} from '@nu-art/thunder-ui-modules//ATS_CheckboxGroup/ATS_CheckboxGroup.js';
import {ATS_CollapsableContainerV2} from './TS_CollapsableContainerV2/index.js';

export const ATSGroup_ThunderstormComponents: AppToolsScreen[] = [
	ATS_Button.Screen,
	ATS_CheckboxGroup.Screen,
	ATS_Label.Screen,
	ATS_Printable.Screen,
	ATS_CollapsableContainerV2,
	ATS_CheckboxV2,
];