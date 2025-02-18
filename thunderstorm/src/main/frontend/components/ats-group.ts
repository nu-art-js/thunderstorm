import {ATS_Button} from './Button/ATS_Button';
import {ATS_Label} from './Label/ATS_Label';
import {AppToolsScreen} from './TS_AppTools';
import {ATS_CheckboxGroup} from './TS_CheckboxGroup/ATS_CheckboxGroup';
import {ATS_CrudOperations} from "../_ats/ATS_CrudOperations/ATS_CrudOperations";

export const ATSGroup_ThunderstormComponents: AppToolsScreen[] = [
	ATS_Button.Screen,
	ATS_CheckboxGroup.Screen,
	ATS_Label.Screen,
	ATS_CrudOperations.Screen
];