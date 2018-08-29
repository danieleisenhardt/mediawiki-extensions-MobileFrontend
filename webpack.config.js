/* eslint-env node, es6 */
const
	CleanPlugin = require( 'clean-webpack-plugin' ),
	path = require( 'path' ),
	prod = process.env.NODE_ENV === 'production',
	// The output directory for all build artifacts. Only absolute paths are accepted by output.path.
	distDir = path.resolve( __dirname, 'resources/dist' ),
	// The extension used for source map files.
	srcMapExt = '.map.json';

module.exports = {
	// Apply the rule of silence: https://wikipedia.org/wiki/Unix_philosophy.
	stats: {
		all: false,
		errors: true,
		warnings: true
	},

	// Fail on the first build error instead of tolerating it for prod builds. This seems to
	// correspond to optimization.noEmitOnErrors.
	bail: prod,

	// Specify that all paths are relative the Webpack configuration directory not the current working
	// directory.
	context: __dirname,

	// A map of ResourceLoader module / entry chunk names to JavaScript files to pack. E.g.,
	// "mobile.startup" maps to src/mobile.startup/mobile.startup.js. The JavaScript entry could be
	// named simply "index.js" but the redundancy of "[name].js" improves presentation and search-
	// ability in some tools. Entry names are tightly coupled to output.filename and extension.json.
	entry: {
		'mobile.startup': './src/mobile.startup/mobile.startup.js'

		// mobile.startup.webpack: reserved entry for the Webpack bootloader optimization.runtimeChunk. Without
		// a distinct runtime chunk, it's instead bundled into each entry which is inefficient. This
		// chunk should only change Webpack or configuration changes.
	},

	optimization: {
		// Generate a single Webpack bootstrap chunk for ResourceLoader modules to share.
		// This will be packaged inside the mobile.startup module which should be a dependency for all
		// modules.
		// The inefficient  alternative is for each module to bundle its own runtime.
		// The terms bootloader and runtime are used interchangeably.
		runtimeChunk: { name: 'mobile.startup.runtime' },

		// Don't produce production output when a build error occurs.
		noEmitOnErrors: prod
	},

	output: {
		// Specify the destination of all build products.
		path: distDir,

		// Store outputs per module in files named after the modules. For the JavaScript entry
		// itself, append .js to each ResourceLoader module entry name. This value is tightly coupled to
		// sourceMapFilename.
		filename: '[name].js',

		// Rename source map extensions. Per T173491 files with a .map extension cannot be served from
		// prod.
		sourceMapFilename: `[file]${srcMapExt}`,

		// Expose the module.exports of each module entry chunk through the global mobileFrontend[name].
		// This is useful for debugging.
		library: [ 'mobileFrontend', '[name]' ],
		libraryTarget: 'this'
	},

	// Accurate source maps at the expense of build time. The source map is intentionally exposed to
	// users via sourceMapFilename for prod debugging. This goes against convention as source code is
	// publicly distributed.
	devtool: 'source-map',

	plugins: [
		// Delete the output directory on each build.
		new CleanPlugin( distDir, { verbose: false } )
	],

	performance: {
		// Size violations for prod builds fail; development builds are unchecked.
		hints: prod ? 'error' : false,

		// Minified uncompressed size limits for chunks / assets and entrypoints. Keep these numbers up-
		// to-date and rounded to the nearest 10th of a kibibyte so that code sizing costs are well
		// understood. Related to bundlesize minified, gzipped compressed file size tests. Note:
		// entrypoint size implicitly includes the mobile.runtime entry.
		maxAssetSize: 1.5 * 1024,
		maxEntrypointSize: 2.6 * 1024,

		// The default filter excludes map files but we rename ours.
		assetFilter: filename => !filename.endsWith( srcMapExt )
	}
};
