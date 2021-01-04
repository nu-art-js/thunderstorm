import {Dialog_Builder} from "@ir/thunderstorm/app-frontend/modules/dialog/DialogModule";
import {BaseComponent} from "@ir/thunderstorm/app-frontend/core/BaseComponent";
import * as React from "react";


type Props = {
	url: string
}

export class Dialog_Success
	extends BaseComponent<Props, {}> {


	constructor(props:Props) {
		super(props);
	}

	public static show(url: string) {
		new Dialog_Builder(<Dialog_Success url={url}/>)
			.setAllowIndirectClosing(true)
			.show();
	}

	redirectToJira = () => {
		if (this.props.url)
			window.open(this.props.url);
	};

	render() {
		return <div className={'ll_v_s fill'} style={{width: 344}}>
			<div className={'ll_v_s'} style={{flex: 1, position: 'relative'}}>
				<div style={{textAlign: 'center', padding: '10px', fontSize: '16px', color: 'darkslategray'}}>Success</div>
				<div style={{textAlign: 'center', padding: '5px', fontSize: '14px', color: 'darkslategray'}}>Bug report submitted successfully</div>
				<div style={{position: 'relative', height: '40px'}}>
					<div
						className={'clickable ll_h_c'}
						style={{
							background: 'DeepSkyBlue',
							height: 32,
							paddingRight: 10,
							paddingLeft: 10,
							borderRadius: 16,
							fontSize: '14px',
							color: 'darkslategray',
							position: "absolute",
							right: '35%'
						}}
						onClick={() => this.redirectToJira()}>
						Take me to jira
					</div>
				</div>
			</div>
		</div>;
	}
}