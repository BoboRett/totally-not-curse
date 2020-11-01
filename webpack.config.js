const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');

module.exports = (env, argv) => {
    const prod = argv.mode === 'production';
    return {
        devtool: 'inline-source-map',
        devServer: {
            contentBase: path.resolve(__dirname, 'public'),
            historyApiFallback: true,
            hot: true,
            watchOptions: {
                ignored: [/node_modules/, 'main/*']
            }
        },
        entry: path.resolve(__dirname, 'renderer/index.js'),
        mode: 'development',
        module: {
            rules: [
                {
                    enforce: 'pre',
                    test: /\.js$/,
                    exclude: /node_modules/,
                    loader: 'eslint-loader',
                    options: {
                        emitWarning: true
                    }
                },
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader'
                    }
                },
                {
                    test: /\.less$/,
                    use: [
                        {
                            loader: MiniCssExtractPlugin.loader,
                            options: {
                                hmr: !prod,
                            },
                        },
                        'css-loader',
                        'less-loader'
                    ]
                },
                {
                    test: /\.(woff|woff2|eot|ttf|otf|svg)$/,
                    loader: 'file-loader',
                    options: {
                        name: '[name].[ext]'
                    }
                }
            ]
        },
        output: {
            path: path.resolve(__dirname, 'build'),
            filename: '[name].js'
        },
        plugins: [
            new CopyWebpackPlugin({
                patterns: [
                    { from: 'public/*.js', flatten: true },
                    { from: 'media/icon.ico', flatten: true }
                ]
            }),
            new HtmlWebpackPlugin({
                inject: 'head',
                template: path.resolve(__dirname, './public/index.html')
            }),
            new MiniCssExtractPlugin({
                filename: '[name].css'
            })
        ],
        stats: 'errors-only'
    };
};
