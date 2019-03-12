const path = require('path');
const HtmlWebPackPlugin = require("html-webpack-plugin");
const WebpackMd5Hash = require('webpack-md5-hash');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const WriteFilePlugin = require('write-file-webpack-plugin');
const sourcePath = path.join(__dirname, './src');

module.exports = (env, argv) => {

	const envConfig = require(`./_config/${env}`);

	console.log("env: " + env);
	console.log("argv: " + JSON.stringify(argv));
	console.log("argv.mode: " + argv.mode);
	const outputFolder = path.resolve(__dirname, `dist/${envConfig.outputFolder()}`);

	return {
		context: sourcePath,
		entry: {
			main: './main/index.tsx',
		},
		output: {
			path: outputFolder,
			filename: '[name].[chunkhash].js',
			publicPath: '/',
		},
		devtool: "source-map",

		devServer: {
			historyApiFallback: true,
			compress: true,
			https: !argv.ssl ? undefined : envConfig.getDevServerSSL(),
			port: envConfig.getServerPort(),
		},

		resolve: {
			extensions: ['.js', '.jsx', '.json', '.ts', '.tsx']
		},

		module: {
			rules: [
				{
					test: /\.tsx?$/, use: [
						{
							loader: 'babel-loader',
							options: {plugins: ['react-hot-loader/babel']}
						},
						'ts-loader'
					]
				},
				{enforce: "pre", test: /\.js$/, loader: "source-map-loader"},
				{
					test: /\.jsx?$/,
					exclude: /node_modules/,
					use: {
						loader: "babel-loader",
						options: {
							minified: envConfig.jsxMinify(),
							presets: [
								"@babel/preset-env",
								"@babel/preset-react"
							],
						},
					},
				},
				{
					test: /\.[ot]tf$/,
					use: [
						{
							loader: 'url-loader',
							options: {
								limit: 10000,
								mimetype: 'application/octet-stream',
								name: 'fonts/[name].[ext]',
							}
						}
					]
				},
				{
					test: /\.json$/,
					exclude: /node_modules/,
					use: {
						loader: "file-loader",
					}
				},
				{
					test: /\.(jpe?g|png|gif|ico)$/i,
					use: [
						{
							loader: 'file-loader',
							options: {
								regExp: /\/src\/main\/res\/images\/(.*\.png)$/,
								name: 'images/[1]',
							}
						},
					]
				},
				{
					test: /\.s[c|a]ss$/,
					use: [
						'style-loader',
						MiniCssExtractPlugin.loader,
						{
							loader: 'css-loader',
							options: {minimize: envConfig.cssMinify(), importLoaders: 2}
						},
						{
							loader: 'postcss-loader',
							options: {
								plugins: () => [
									require('autoprefixer')
								],
							}
						},
						'sass-loader'
					]
				}
			]
		},
		plugins: [
			new CleanWebpackPlugin(outputFolder),
			new MiniCssExtractPlugin({
				filename: 'style.[contenthash].css',
			}),
			new HtmlWebPackPlugin({
				inject: true,
				favicon: './main/res/favicon.ico',
				template: "./main/index.ejs",
				filename: "./index.html",
				minify: envConfig.htmlMinificationOptions(),
				myfiles: {
					gtm: envConfig.resolveGtmScript(),
					fcm: envConfig.resolveFcmScript()
				}
			}),
			new WebpackMd5Hash(),
			// new CopyWebpackPlugin([
			// 	{
			// 		from: "./src/main/scripts/firebase-messaging-sw.js",
			// 		to: "firebase-messaging-sw.js",
			// 		toType: 'file'
			// 	},
			// 	{
			// 		from: "./src/main/scripts/manifest.json",
			// 		to: "scripts/manifest.json",
			// 		toType: 'file'
			// 	},
			// ], {}),
			envConfig.getPrettifierPlugin(),
			new WriteFilePlugin(),
		].filter(plugin => plugin),

	};
};
