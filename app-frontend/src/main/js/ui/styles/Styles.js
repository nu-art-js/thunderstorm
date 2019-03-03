/**
 * Created by tacb0ss on 28/10/2018.
 */

export const StyleStr = {
	borderRadius: (r, important) => {
		return `border-radius: ${r}px${(important ? " !important" : "")}`
	}
};

export const StyleObj = {
	borderRadius: (r, important) => {
		return {borderRadius: `${r}px${(important ? " !important" : "")}`}
	}
};