( function ( M ) {

	var View = M.require( 'mobile.startup/View' );

	/**
	 * Representation of a thumbnail
	 *
	 * @class Thumbnail
	 * @extends View
	 */
	function Thumbnail() {
		View.apply( this, arguments );
	}
	OO.mfExtend( Thumbnail, View, {
		/**
		 * @memberof Thumbnail
		 * @instance
		 * @mixes View#defaults
		 * @property {Object} defaults Default options hash.
		 * @property {string} defaults.filename uri decoded filename including File: prefix
		 *  associated with thumbnail
		 */
		defaults: {
			filename: undefined
		},
		/**
		 * @inheritdoc
		 * @memberof Thumbnail
		 * @instance
		 */
		isBorderBox: false,
		/**
		 * @inheritdoc
		 * @memberof Thumbnail
		 * @instance
		 */
		postRender: function () {
			this.options.description = this.$el.siblings( '.thumbcaption' ).text();
		},
		/**
		 * Obtain description for thumbnail
		 * @memberof Thumbnail
		 * @instance
		 * @return {string}
		 */
		getDescription: function () {
			return this.options.description;
		},
		/**
		 * Return the page title for the thumbnail
		 * @memberof Thumbnail
		 * @instance
		 * @return {string}
		 */
		getFileName: function () {
			return this.options.filename;
		}
	} );

	M.define( 'mobile.startup/Thumbnail', Thumbnail );

}( mw.mobileFrontend ) );
