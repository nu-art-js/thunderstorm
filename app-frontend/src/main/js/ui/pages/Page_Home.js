import {React, css, BaseComponent, PropTypes, InputTextField, BrowserHistoryModule} from 'nu-art--react-core';
import LoginModule from '../../modules/LoginModule';
const centredImage = css`
  position: absolute;
  left: 50%;
  top: 50%;
  -webkit-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
`;


class Page_Home
	extends BaseComponent {
	constructor(props) {
		super(props);

		this.state = {
			formFields: {},
		};

		this.setInterfaces(LoginModule.OnLoginListener)
	}

	onLoggedIn(err) {
		this.forceUpdate();
	}

	render() {
		return (
			<div className="match_height match_width ll_v_c" style={{paddingTop: "82px"}}>
				<div className="ll_h_c">
					<img src="/images/icon__add.png" className={centredImage}/>
				</div>
			</div>
		);
	}
}

Page_Home.propTypes = {};

export default Page_Home;
