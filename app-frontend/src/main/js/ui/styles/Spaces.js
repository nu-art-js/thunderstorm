/**
 * Created by tacb0ss on 22/10/2018.
 */
export const SpacesObj = {
		paddingH: (p) => {
			return {
				paddingLeft: p,
				paddingRight: p
			}
		},

		paddingV: (p) => {
			return {
				paddingTop: p,
				paddingBottom: p
			}
		},
		marginH: (m) => {
			return {
				marginLeft: m,
				marginRight: m
			}
		},
		marginV: (m) => {
			return {
				marginTop: m,
				marginBottom: m
			}
		},

		padding: (t, r = t, b = r, l = b) => {
			return {padding: `${t}px ${r}px ${b}px ${l}px`}
		},

		margin: (t, r = t, b = r, l = b) => {
			return {margin: `${t}px ${r}px ${b}px ${l}px`}
		},

	}
;
export const SpacesStr = {
	_paddingH: (p) => {
		return `paddingLeft: ${p}, paddingRight: ${p}`
	},
	_paddingV: (p) => {
		return `paddingTop: ${p}, paddingBottom: ${p}`
	},
	_padding: (t, r = t, b = r, l = b) => {
		return `padding: ${t}px ${r}px ${b}px ${l}px`
	},

	_marginH: (m) => {
		return `marginLeft: ${m}, marginRight: ${m}`
	},

	_marginV: (m) => {
		return `marginTop: ${m}, marginBottom: ${m}`
	},

	_margin: (t, r = t, b = r, l = b) => {
		return `margin: ${t}px ${r}px ${b}px ${l}px`
	},
};
