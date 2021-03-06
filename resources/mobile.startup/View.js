/* global $ */
( function ( M ) {
	var
		util = M.require( 'mobile.startup/util' ),
		// Cached regex to split keys for `delegate`.
		delegateEventSplitter = /^(\S+)\s*(.*)$/,
		idCounter = 0;

	/**
	 * Generate a unique integer id (unique within the entire client session).
	 * Useful for temporary DOM ids.
	 * @param {string} prefix Prefix to be used when generating the id.
	 * @return {string}
	 */
	function uniqueId( prefix ) {
		var id = ( ++idCounter ).toString();
		return prefix ? prefix + id : id;
	}

	/**
	 * Should be extended using extend().
	 *
	 * When options contains el property, this.$el in the constructed object
	 * will be set to the corresponding jQuery object. Otherwise, this.$el
	 * will be an empty div.
	 *
	 * When extended using extend(), if the extended prototype contains
	 * template property, this.$el will be filled with rendered template (with
	 * options parameter used as template data).
	 *
	 * template property can be a string which will be passed to mw.template.compile()
	 * or an object that has a render() function which accepts an object with
	 * template data as its argument (similarly to an object created by
	 * mw.template.compile()).
	 *
	 * You can also define a defaults property which should be an object
	 * containing default values for the template (if they're not present in
	 * the options parameter).
	 *
	 * If this.$el is not a jQuery object bound to existing DOM element, the
	 * view can be attached to an element using appendTo(), prependTo(),
	 * insertBefore(), insertAfter() proxy functions.
	 *
	 * append(), prepend(), before(), after() can be used to modify $el. on()
	 * can be used to bind events.
	 *
	 * You can also use declarative DOM events binding by specifying an `events`
	 * map on the class. The keys will be 'event selector' and the value can be
	 * either the name of a method to call, or a function. All methods and
	 * functions will be executed on the context of the View.
	 *
	 * Inspired from Backbone.js
	 * https://github.com/jashkenas/backbone/blob/master/backbone.js#L1128
	 *
	 * Example:
	 * ```js
	 *     var MyComponent = View.extend( {
	 *       events: {
	 *	       'mousedown .title': 'edit',
	 *	       'click .button': 'save',
	 *	       'click .open': function(e) { ... }
	 *       },
	 *       edit: function ( ev ) {
	 *         //...
	 *       },
	 *       save: function ( ev ) {
	 *         //...
	 *       }
	 *     } );
	 * ```
	 *
	 * Example:
	 * ```js
	 *     var View, section;
	 *     function Section( options ) {
	 *       View.call( this, options );
	 *     }
	 *     View = M.require( 'mobile.startup/View' );
	 *     OO.mfExtend( Section, View, {
	 *       template: mw.template.compile( "&lt;h2&gt;{{title}}&lt;/h2&gt;" ),
	 *     } );
	 *     section = new Section( { title: 'Test', text: 'Test section body' } );
	 *     section.appendTo( 'body' );
	 * ```
	 *
	 * @class View
	 * @mixins OO.EventEmitter
	 */
	function View() {
		this.initialize.apply( this, arguments );
	}
	OO.mixinClass( View, OO.EventEmitter );
	OO.mfExtend( View, {
		/**
		 * A css class to apply to the containing element of the View.
		 * @memberof View
		 * @instance
		 * @property {string} className
		 */
		className: undefined,
		/**
		 * Name of tag that contains the rendered template
		 * @memberof View
		 * @instance
		 * @property {string} tagName
		 */
		tagName: 'div',
		/**
		 * Tells the View to ignore tagName and className when constructing the element
		 * and to rely solely on the template
		 * @memberof View
		 * @instance
		 * @property {boolean} isTemplateMode
		 */
		isTemplateMode: false,

		/**
		 * Whether border box box sizing model should be used
		 * @memberof View
		 * @instance
		 * @property {boolean} isBorderBox
		 */
		isBorderBox: true,
		/**
		 * @memberof View
		 * @instance
		 * @property {Mixed}
		 * Specifies the template used in render(). Object|string|HoganTemplate
		 */
		template: undefined,

		/**
		 * Specifies partials (sub-templates) for the main template. Example:
		 *
		 *     @example
		 *     // example content for the "some" template (sub-template will be
		 *     // inserted where {{>content}} is):
		 *     // <h1>Heading</h1>
		 *     // {{>content}}
		 *
		 *     oo.mfExtend( SomeView, View, {
		 *       template: M.template.get( 'some.hogan' ),
		 *       templatePartials: { content: M.template.get( 'sub.hogan' ) }
		 *     }
		 *
		 * @memberof View
		 * @instance
		 * @property {Object}
		 */
		templatePartials: {},

		/**
		 * A set of default options that are merged with options passed into the initialize
		 * function.
		 * @memberof View
		 * @instance
		 * @property {Object} defaults Default options hash.
		 * @property {jQuery.Object|string} [defaults.el] jQuery selector to use for rendering.
		 * @property {boolean} [defaults.enhance] Whether to enhance views already in DOM.
		 * When enabled, the template is disabled so that it is not rendered in the DOM.
		 * Use in conjunction with View::defaults.$el to associate the View with an existing
		 * already rendered element in the DOM.
		 */
		defaults: {},

		/**
		 * Default events map
		 * @memberof View
		 * @instance
		 */
		events: null,

		/**
		 * Run once during construction to set up the View
		 * @memberof View
		 * @instance
		 * @param {Object} options Object passed to the constructor.
		 */
		initialize: function ( options ) {
			var self = this;

			OO.EventEmitter.call( this );
			options = util.extend( {}, this.defaults, options );
			this.options = options;
			// Assign a unique id for dom events binding/unbinding
			this.cid = uniqueId( 'view' );

			// TODO: if template compilation is too slow, don't compile them on a
			// per object basis, but don't worry about it now (maybe add cache to
			// M.template.compile())
			if ( typeof this.template === 'string' ) {
				this.template = mw.template.compile( this.template );
			}

			if ( options.el ) {
				// Note the element may not be in the document so must use global jQuery here
				this.$el = $( options.el );
			} else {
				this.$el = this.parseHTML( '<' + this.tagName + '>' );
			}

			// Make sure the element is ready to be manipulated
			if ( this.$el.length ) {
				this._postInitialize();
			} else {
				util.docReady( function () {
					// Note the element may not be in the document so must use global jQuery here
					self.$el = $( options.el );
					self._postInitialize();
				} );
			}
		},

		/**
		 * Called when this.$el is ready.
		 * @memberof View
		 * @instance
		 * @private
		 */
		_postInitialize: function () {
			this.$el.addClass( this.className );
			if ( this.isBorderBox ) {
				// FIXME: Merge with className property (?)
				this.$el.addClass( 'view-border-box' );
			}
			this.render( this.options );
		},

		/**
		 * Function called before the view is rendered. Can be redefined in
		 * objects that extend View.
		 * @memberof View
		 * @instance
		 */
		preRender: util.noop,

		/**
		 * Function called after the view is rendered. Can be redefined in
		 * objects that extend View.
		 *
		 * @memberof View
		 * @instance
		 */
		postRender: util.noop,

		// eslint-disable-next-line valid-jsdoc
		/**
		 * Fill this.$el with template rendered using data if template is set.
		 *
		 * @memberof View
		 * @instance
		 * @param {Object} data Template data. Will be merged into the view's
		 * options
		 * @chainable
		 */
		render: function ( data ) {
			var html;
			util.extend( this.options, data );
			this.preRender();
			this.undelegateEvents();
			if ( this.template && !this.options.enhance ) {
				html = this.template.render( this.options, this.templatePartials );
				if ( this.isTemplateMode ) {
					this.$el = $( html );
				} else {
					this.$el.html( html );
				}
			}
			this.postRender();
			this.delegateEvents();
			return this;
		},

		/**
		 * Wraps this.$el.find, so that you can search for elements in the view's
		 * ($el's) scope.
		 *
		 * @memberof View
		 * @instance
		 * @param {string} query A jQuery CSS selector.
		 * @return {JQuery.Object} jQuery object containing results of the search.
		 */
		$: function ( query ) {
			return this.$el.find( query );
		},

		/**
		 * Set callbacks, where `this.events` is a hash of
		 *
		 * {"event selector": "callback"}
		 *
		 * {
		 *	'mousedown .title': 'edit',
		 *	'click .button': 'save',
		 *	'click .open': function(e) { ... }
		 * }
		 *
		 * pairs. Callbacks will be bound to the view, with `this` set properly.
		 * Uses event delegation for efficiency.
		 * Omitting the selector binds the event to `this.el`.
		 *
		 * @memberof View
		 * @instance
		 * @param {Object} events Optionally set this events instead of the ones on this.
		 */
		delegateEvents: function ( events ) {
			var match, key, method;
			// Take either the events parameter or the this.events to process
			events = events || this.events;
			if ( events ) {
				// Remove current events before re-binding them
				this.undelegateEvents();
				for ( key in events ) {
					method = events[ key ];
					// If the method is a string name of this.method, get it
					if ( typeof method !== 'function' ) {
						method = this[ events[ key ] ];
					}
					if ( method ) {
						// Extract event and selector from the key
						match = key.match( delegateEventSplitter );
						this.delegate( match[ 1 ], match[ 2 ], method.bind( this ) );
					}
				}
			}
		},

		/**
		 * Add a single event listener to the view's element (or a child element
		 * using `selector`). This only works for delegate-able events: not `focus`,
		 * `blur`, and not `change`, `submit`, and `reset` in Internet Explorer.
		 *
		 * @memberof View
		 * @instance
		 * @param {string} eventName
		 * @param {string} selector
		 * @param {Function} listener
		 */
		delegate: function ( eventName, selector, listener ) {
			this.$el.on( eventName + '.delegateEvents' + this.cid, selector,
				listener );
		},

		/**
		 * Clears all callbacks previously bound to the view by `delegateEvents`.
		 * You usually don't need to use this, but may wish to if you have multiple
		 * views attached to the same DOM element.
		 * @memberof View
		 * @instance
		 */
		undelegateEvents: function () {
			if ( this.$el ) {
				this.$el.off( '.delegateEvents' + this.cid );
			}
		},

		/**
		 * A finer-grained `undelegateEvents` for removing a single delegated event.
		 * `selector` and `listener` are both optional.
		 *
		 * @memberof View
		 * @instance
		 * @param {string} eventName
		 * @param {string} selector
		 * @param {Function} listener
		 */
		undelegate: function ( eventName, selector, listener ) {
			this.$el.off( eventName + '.delegateEvents' + this.cid, selector,
				listener );
		},

		/**
		 * See parseHTML method of util singleton
		 *
		 * @memberof View
		 * @instance
		 */
		parseHTML: util.parseHTML
	} );

	/**
	 * @memberof View
	 * @instance
	 * @func append
	 * @param {...(string|Node|Node[]|JQuery)} contents
	 * @return {this}
	 */

	/**
	 * @memberof View
	 * @instance
	 * @func append
	 * @param {function(number, string): string|Node|Node[]|JQuery} contents
	 * @return {this}
	 */

	/**
	 * @memberof View
	 * @instance
	 * @func prepend
	 * @param {...(string|Node|Node[]|JQuery)} contents
	 * @return {this}
	 */

	/**
	 * @memberof View
	 * @instance
	 * @func prepend
	 * @param {function(number, string): string|Node|Node[]|JQuery} contents
	 * @return {this}
	 */

	/**
	 * @memberof View
	 * @instance
	 * @func appendTo
	 * @param {string|Node|Node[]|JQuery} target
	 * @return {this}
	 */

	/**
	 * @memberof View
	 * @instance
	 * @func prependTo
	 * @param {string|Node|Node[]|JQuery} target
	 * @return {this}
	 */

	/**
	 * @memberof View
	 * @instance
	 * @func after
	 * @param {...(string|Node|Node[]|JQuery)} contents
	 * @return {this}
	 */

	/**
	 * @memberof View
	 * @instance
	 * @func after
	 * @param {function(number, string): string|Node|Node[]|JQuery} contents
	 * @return {this}
	 */

	/**
	 * @memberof View
	 * @instance
	 * @func before
	 * @param {...(string|Node|Node[]|JQuery)} contents
	 * @return {this}
	 */

	/**
	 * @memberof View
	 * @instance
	 * @func before
	 * @param {function(number, string): string|Node|Node[]|JQuery} contents
	 * @return {this}
	 */

	/**
	 * @memberof View
	 * @instance
	 * @func insertAfter
	 * @param {string|Node|Node[]|JQuery} target
	 * @return {this}
	 */

	/**
	 * @memberof View
	 * @instance
	 * @func insertBefore
	 * @param {string|Node|Node[]|JQuery} target
	 * @return {this}
	 */

	/**
	 * @memberof View
	 * @instance
	 * @func remove
	 * @param {string} [selector]
	 * @return {this}
	 */

	/**
	 * @memberof View
	 * @instance
	 * @func detach
	 * @param {string} [selector]
	 * @return {this}
	 */

	[
		'append',
		'prepend',
		'appendTo',
		'prependTo',
		'after',
		'before',
		'insertAfter',
		'insertBefore',
		'remove',
		'detach'
	].forEach( function ( prop ) {
		View.prototype[prop] = function () {
			this.$el[prop].apply( this.$el, arguments );
			return this;
		};
	} );

	M.define( 'mobile.startup/View', View );
}( mw.mobileFrontend ) );
