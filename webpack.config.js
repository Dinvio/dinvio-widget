var fs = require('fs');
var webpack = require('webpack');
var path = require('path');
var argv = require('minimist')(process.argv.slice(2));
var autoprefixer = require('autoprefixer-core');

var RELEASE = !!argv['release'];
var DEBUG = !RELEASE;
var DATA_URI_LIMIT = 10000000;

var version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;


var entry = ['./src/index.js'];


var plugins = [
    new webpack.optimize.OccurenceOrderPlugin()
];

if (RELEASE) {
    plugins = plugins.concat([
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin(),
        new webpack.optimize.AggressiveMergingPlugin()
    ]);
}

var styleLoader = 'style',
    cssLoader = DEBUG ? 'css' : 'css?minimize';

function styleLoaders() {
    return [styleLoader, cssLoader, 'postcss'].concat(Array.prototype.slice.call(arguments));
}

function url(mimeType) {
    return 'url?limit=' + DATA_URI_LIMIT + '&name=[path][name].[ext]&mimetype=' + mimeType;
}

function getPath() {
    return RELEASE ? path.join(__dirname, 'dist') : path.join(__dirname, 'build');
}

function getFilename() {
    return RELEASE ? 'dinvio-widget.' + version + '.min.js' : 'bundle.js';
}

module.exports = {
    entry: entry,
    output: {
        path: getPath(),
        filename: getFilename()
    },
    cache: DEBUG,
    debug: DEBUG,
    devtool: DEBUG ? 'source-map': false,
    module: {
        loaders: [
            {
                test: /\.css$/,
                loaders: styleLoaders()
            },
            {
                test: /\.styl$/,
                loaders: styleLoaders('stylus')
            },
            {
                test: /\.html$/,
                loader: 'html'
            },
            {
                test: /\.png$/,
                loader: url('image/png')
            }
        ]
    },
    plugins: plugins,
    postcss: [
        autoprefixer(['last 3 versions', 'IE >= 9'])
    ]
};
