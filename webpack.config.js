"use strict";

const path = require("path");
const webpack = require("webpack");
const BrowserSyncPlugin = require("browser-sync-webpack-plugin");

module.exports = {
    entry: [
        path.resolve("src/main")
    ],
    output: {
        path: path.resolve("dist"),
        filename: "bundle.js",
        publicPath: "/"
    },
    resolve: {
        extensions: ["", ".ts", ".js", ".json"],
        modulesDirectories: [
            path.resolve("node_modules"),
            path.resolve("src")
        ]
    },
    module: {
        preLoaders: [{
            test: /\.ts$/,
            loader: "tslint",
            exclude: /node_modules/
        }],
        loaders: [{
            test: /\.ts$/,
            loader: "awesome-typescript",
            exclude: /node_modules/
        }, {
            test: /\.json$/,
            loader: "json",
            exclude: /node_modules/
        }]
    },
    plugins: [
        new webpack.DefinePlugin({
            "process.env": {
                NODE_ENV: JSON.stringify("development")
            }
        }),
        new BrowserSyncPlugin({
            host: process.env.IP || "localhost",
            port: process.env.PORT || 3000,
            open: false,
            ui: false,
            server: {
                baseDir: path.resolve("dist")
            }
        })
    ],
    externals: {
        "phaser": "Phaser"
    },
    devtool: "#source-map"
};
