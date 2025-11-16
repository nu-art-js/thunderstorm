export const windowRect = {
	halfScreen_Left: () => {
		const width = (window.innerWidth - 32) / 2;
		return {width, height: window.innerHeight - 32, x: 16, y: 16};
	},
	halfScreen_Right: () => {
		const width = (window.innerWidth - 32) / 2;
		return {width, height: window.innerHeight - 32, x: width + 16, y: 16};
	},
	thirdScreen_Left: () => {
		const width = (window.innerWidth - 32) / 3;
		return {width, height: window.innerHeight - 32, x: 16, y: 16};
	},
	thirdScreen_Middle: () => {
		const width = (window.innerWidth - 32) / 3;
		return {width, height: window.innerHeight - 32, x: width + 16, y: 16};
	},
	thirdScreen_Right: () => {
		const width = (window.innerWidth - 32) / 3;
		return {width, height: window.innerHeight - 32, x: (2 * width) + 16, y: 16};
	}
};