var ModuleLoader = require( '../../../src/mobile.startup/modules' );

QUnit.module( 'MobileFrontend ModuleLoader', {
	beforeEach: function () {
		this.loader = new ModuleLoader();
	}
} );

QUnit.test( '#require', function ( assert ) {
	this.loader.define( 'foo', 1 );
	this.loader.define( 'bar', 5 );

	assert.strictEqual( this.loader.require( 'foo' ), 1, 'Returns appropriate module' );
	assert.strictEqual( this.loader.require( 'bar' ), 5, 'Returns appropriate module' );

	assert.throws( function () {
		this.loader.require( 'undefinedmodule' );
	}, 'Cannot require an undefined module.' );
	assert.throws( function () {
		this.loader.require( 'mobile.modules/Foo' );
	}, 'Cannot require an undefined export on a known module.' );
} );

QUnit.test( '#define', function ( assert ) {
	var loader = this.loader;
	loader.define( 'foo', 1 );
	loader.define( 'bar', 5 );
	assert.throws( function () {
		loader.define( 'bar', 50 );
	}, 'Cannot define two modules with the same name' );
	assert.strictEqual( this.loader.require( 'bar' ), 5, 'Returns first definition of module.' );
} );
