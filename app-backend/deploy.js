const fs = require("fs");
const copyFiles = (source, dest) => {
	return new Promise((resolved, rejected) => {
		fs.copyFile(source, dest, (err) => {
			if (err) {
				rejected(err);
				return;
			}

			resolved();
		})
	})
};

const makeDir = (dest) => {
	return new Promise((resolved, rejected) => {
		fs.mkdir(dest, (err) => {
			if (err) {
				rejected(err);
				return;
			}

			resolved();
		})
	})
};

const folderExists = (dest) => {
	return new Promise((resolved, rejected) => {
		fs.mkdir(dest, (err) => {
			if (err) {
				rejected(err);
				return;
			}

			resolved();
		})
	})
};

makeDir("./dist/config")
	.then(copyFiles("./src/config/dev.json", "./dist/config/dev.json"))
	.then(() => {
		console.log("PAH");
	})
	.catch((err) => {
		console.error("ZEVEL");
		console.error(err)
	});
;
