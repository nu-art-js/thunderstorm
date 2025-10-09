import {ATS_Printable} from '../_ats/ATS_Printables/ATS_Printable';
import {ATS_Button} from './Button/ATS_Button';
import {ATS_Label} from './Label/ATS_Label';
import {AppToolsScreen} from './TS_AppTools';
import {ATS_CheckboxV2} from './TS_Checkbox/ATS_CheckboxV2';
import {ATS_CheckboxGroup} from './TS_CheckboxGroup/ATS_CheckboxGroup';
import {ATS_CollapsableContainerV2} from './TS_CollapsableContainerV2';

export const ATSGroup_ThunderstormComponents: AppToolsScreen[] = [
	ATS_Button.Screen,
	ATS_CheckboxGroup.Screen,
	ATS_Label.Screen,
	ATS_Printable.Screen,
	ATS_CollapsableContainerV2,
	ATS_CheckboxV2,
];