const path = require("path");
const webpack = require("webpack");

module.exports = {
    entry: [
        "webpack-dev-server/client?http://localhost:3000",
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
        })
    ],
    devServer: {
        contentBase: path.resolve("dist"),
        inline: true,
        port: 3000,
        stats: {
            hideModules: true,
            colors: true,
            hash: false,
            version: false,
            timings: true,
            assets: true,
            chunks: false,
            modules: false,
            reasons: false,
            children: false,
            source: false,
            errors: true,
            errorDetails: true,
            warnings: true,
            publicPath: false
        }
    },
    externals: {
        "phaser": "Phaser"
    },
    devtool: "#eval-source-map"
};
