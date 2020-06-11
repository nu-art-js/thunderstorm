
const veryLightPink = "#d8d8d8";
const blueGrey = "#8181a8";
const blueLight = "#f9f9f9";
const white = "#ffffff";
const gold = "#B5986E";
const amber = "#A15F3E";
const mint = "#E3EFE2";
const brightSkyBlue = "#00b5ff";
const darkTwo = "#2f304f";
const black = "#000000";

function calculateColorWithAlpha(color: string, alpha?: number) {
	return alpha === undefined ? color : color + ((alpha * 256) % 256).toString(16);
}

export const COLORS = {

	veryLightPink: (alpha?: number) => calculateColorWithAlpha(veryLightPink, alpha),
	blueGrey: (alpha?: number) => calculateColorWithAlpha(blueGrey, alpha),
	blueLight: (alpha?: number) => calculateColorWithAlpha(blueLight, alpha),
	white: (alpha?: number) => calculateColorWithAlpha(white, alpha),
	gold: (alpha?: number) => calculateColorWithAlpha(gold, alpha),
	amber: (alpha?: number) => calculateColorWithAlpha(amber, alpha),
	mint: (alpha?: number) => calculateColorWithAlpha(mint, alpha),
	brightSkyBlue: (alpha?: number) => calculateColorWithAlpha(brightSkyBlue, alpha),
	darkTwo: (alpha?: number) => calculateColorWithAlpha(darkTwo, alpha),
	black: (alpha?: number) => calculateColorWithAlpha(black, alpha),
};
