import {ATS_Printable} from '../_ats/ATS_Printables/ATS_Printable';
import {ATS_Button} from './Button/ATS_Button';
import {ATS_Label} from './Label/ATS_Label';
import {AppToolsScreen} from './TS_AppTools';
import {ATS_CheckboxGroup} from './TS_CheckboxGroup/ATS_CheckboxGroup';

export const ATSGroup_ThunderstormComponents: AppToolsScreen[] = [
	ATS_Button.Screen,
	ATS_CheckboxGroup.Screen,
	ATS_Label.Screen,
	ATS_Printable.Screen,
];