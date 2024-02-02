import * as React from 'react';
import {ComponentSync} from '@nu-art/thunderstorm/frontend';
import './Renderer_UserThumbnail.scss';


type Props = {
	innerText: string
}
type State = {}

export class Renderer_UserThumbnail
	extends ComponentSync<Props, State> {

	render() {
		return <div className={'user-thumbnail'}>{this.props.innerText}</div>;
	}
}