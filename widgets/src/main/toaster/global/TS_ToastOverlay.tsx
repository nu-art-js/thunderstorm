import {ComponentSync} from '../../_core/ComponentSync.js';
import {ToasterPortal_Vertical} from '../placement/index.js';
import {Model_Toast} from '@nu-art/toasting';
import {TOAST_KEY_GLOBAL} from './consts.js';
import './TS_ToastOverlay.scss';

export class TS_ToastOverlay
	extends ComponentSync {

	render() {
		return <div className="ts-global-toast-portal">
			<ToasterPortal_Vertical
				verticalPadding={16}
				verticalGap={8}
				modelFilter={(model: Model_Toast) => model.key === TOAST_KEY_GLOBAL}
			/>
		</div>;
	}
}
