/*
 * A typescript & react boilerplate with api call example
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const path = require('path');
const HtmlWebPackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const {WebpackManifestPlugin} = require("webpack-manifest-plugin");
const packageJson = require('./package.json');
const webpack = require("webpack");
const sourcePath = path.join(__dirname, './src');
const swFolder = path.join(__dirname, './src/sw/');
const mainFolder = path.join(__dirname, './src/main/');
const mainConfig = path.join(__dirname, './src/main/tsconfig.json');

module.exports = (env, argv) => {
	env = env.dev ? "dev" : "prod"
	const envConfig = require(`./_config/${env}`);
	const outputFolder = path.resolve(__dirname, `dist`);
	const swChunkName = 'pubsub-sw';

	return {
		context: sourcePath,
		target: ["web", "es2017"],
		entry: {
			main: './main/index.tsx',
			[swChunkName]: './sw/index.ts',
		},
		output: {
			path: outputFolder,
			filename: '[name].js',
			publicPath: '/',
			clean: true
		},
		optimization: {
			moduleIds: 'deterministic',
			// minimize: false,
			splitChunks: {
				cacheGroups: {
					defaultVendors: {
						chunks(chunk) {
							return chunk.name !== swChunkName;
						},
						test: /[\\/]node_modules[\\/]/,
						name: 'vendors',
					},
				},
			},
		},
		devtool: "source-map",

		devServer: {
			historyApiFallback: true,
			compress: true,
			static: outputFolder,
			server: {type: "https", options: envConfig.getDevServerSSL()},
			port: envConfig.getHostingPort(),
		},

		resolve: {
			fallback: {
				"fs": false,
				"tls": false,
				"net": false,
				"path": false,
				"buffer": require.resolve("buffer/"),
				"zlib": require.resolve("browserify-zlib"),
				"util": require.resolve("util/"),
				"http": false,
				"https": false,
				"stream": require.resolve("stream-browserify"),
				"crypto": require.resolve("crypto-browserify"),
			},
			alias: {
				"@modules": path.resolve(__dirname, "src/main/modules"),
				"@styles": path.resolve(__dirname, "src/main/res/styles"),
				"@res": path.resolve(__dirname, "src/main/res"),
				"@consts": path.resolve(__dirname, "src/main/app/consts"),
				"@form": path.resolve(__dirname, "src/main/app/form"),
				"@page": path.resolve(__dirname, "src/main/app/pages"),
				"@component": path.resolve(__dirname, "src/main/app/components"),
				"@dialog": path.resolve(__dirname, "src/main/app/dialogs"),
				"@renderer": path.resolve(__dirname, "src/main/app/renderers"),
			},
			extensions: ['.js', '.jsx', '.json', '.ts', '.tsx']
		},

		module: {
			rules: [
				{
					test: /main\/.+\.tsx?$/,
					include: [mainFolder],
					use: {
						loader: "ts-loader",
						options: {
							configFile: mainConfig
						}
					}
				},
				{
					test: /sw\/index.ts$/,
					include: [swFolder],
					loader: "ts-loader",
				},
				{
					loader: "source-map-loader",
					enforce: "pre",
					test: /\.js$/,
					exclude: [/node_modules/, /dist/, /build/, /__test__/]
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
				},
				{
					test: /\.(jpe?g|png|gif|ico|svg)$/i,
					type: 'asset/resource'
				},
				{
					test: /\.s?[c|a]ss$/,
					use: [
						'style-loader',
						MiniCssExtractPlugin.loader,
						// Translates CSS into CommonJS
						"css-loader",
						// Compiles Sass to CSS
						"sass-loader",
					]
				}
			]
		},
		plugins: [
			new webpack.DefinePlugin({
				'process.env': {
					'appEnv': `"${env}"`,
					'appVersion': `"${packageJson.version}"`
				}
			}),
			new CleanWebpackPlugin({cleanStaleWebpackAssets: false}),
			new MiniCssExtractPlugin({
				filename: 'main/res/styles.[contenthash].css',
			}),
			new HtmlWebPackPlugin({
				inject: true,
				favicon: './main/res/favicon.ico',
				template: "./main/index.ejs",
				filename: "./index.html",
				minify: envConfig.htmlMinificationOptions(),
				excludeChunks: [swChunkName]
			}),
			new WebpackManifestPlugin()
		].filter(plugin => plugin),
	}
};
