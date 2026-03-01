import {TS_Input} from '@nu-art/thunder-widgets';
import {TS_Icons} from '@nu-art/ts-styles';

export const Input_Text_Blur = TS_Input.editableString({saveEvent: ['blur'], type: 'text'});

export const Input_Number_Blur = TS_Input.editableString({saveEvent: ['blur'], type: 'number'});

export const DropDownCaret = {
	open: <TS_Icons.treeCollapse.component/>,
	close: <TS_Icons.treeCollapse.component className={'flip'}/>
};