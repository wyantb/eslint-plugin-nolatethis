'use strict';

var eslint = require('eslint');
var ESLintTester = require('eslint-tester');

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

function wrapInSafe(code) {
    return 'var that = this; $el.on("click", function () { ' + code + ' });';
}

var eslintTester = new ESLintTester(eslint.linter);
eslintTester.addRuleTest('./lib/rules/no-latethis', {

    valid: [{
            code: 'var self = this, foo = "bar";',
            args: [1, 'self'],
        }, {
            code: 'var self = this; $el.on("click", function () { var $node = $(this); $node.trigger("ok"); });',
            args: [1, 'self']
        },
        'console.log(this);',
        'this.doSomething();',
        wrapInSafe('var $node = $(this), foo = 1;'),
        wrapInSafe('doSomething(this);'),
        wrapInSafe('that.doSomething(this);'),
        wrapInSafe('_.chain(this).filter().each();'),
        wrapInSafe('this.chain().run();'),
        wrapInSafe('this.trigger("ok");'),
        wrapInSafe('return this.chain().run();'),
        wrapInSafe('return _.chain(this).blah();'),
        'var $n = $(this); function a () { _.chain().run(this).other(); }',
        wrapInSafe('switch(a){case "2":foo();}'),
        'function a() {var that = this; this.run()}',
        'function a() {var that = this; if(a) { if (b) {var b = 2;this.run(); }}}'
    ],

    invalid: [{
        code: 'var that = this; $el.on("click", function () { var $node = $(this); $node.trigger("ok"); this.run(); });',
        errors: [{ message: '"this" should not be used as callee in non-first expression within a function', }]
    }, {
        code: wrapInSafe('var a = 1; return this.chain().run();'),
        errors: [{ message: '"this" should not be used as callee in non-first expression within a function', }]
    }, {
        code: 'var that = this; $el.on("click", function () { var a = 1, $node = $(this); });',
        errors: [{ message: 'this redeclaration was not the first variable assignment' }]
    }, {
        code: wrapInSafe('var a = 1; var $node = $(this);'),
        errors: [{ message: 'something declared this, but wasnt first variable declaration in function' }]
    }, {
        code: wrapInSafe('var a = 1; that.trigger(this.getProject());'),
        errors: [{ message: '"this" should not be used as callee in non-first expression within a function' }]
    }, {
        code: wrapInSafe('var a = 1; that.trigger(that.getProject(this));'),
        errors: [{ message: '"this" should not be used in later expressions in anon functions' }]
    }, {
        code: wrapInSafe('doSome(this); doOther(this);'),
        errors: [{ message: '"this" should not be used in later expressions in anon functions' }]
    }, {
        code: wrapInSafe('foo().bar(this);'),
        errors: [{ message: '"this" should not be late in a chain call' }]
    }, {
        code: wrapInSafe('foo().bar(this).run();'),
        errors: [{ message: '"this" should not be late in a chain call' }]
    }, {
        code: wrapInSafe('_.chain(self.projects()).filter(this.foo).each()'),
        errors: [{ message: '"this" should not be late in a chain call' }]
    }, {
        code: wrapInSafe('var $node = $(this); return _.chain(this).foo($node);'),
        errors: [{ message: '"this" should not be used in later expressions in anon functions' }]
    }, {
        code: wrapInSafe('var that = this, $el = this;'),
        errors: [{ message: 'this redeclaration was not the first variable assignment' }]
    }, {
        code: wrapInSafe('if (this.pie()) {}'),
        errors: [{ message: '"this" should not be used as callee in non-first expression within a function' }]
    }
        // TODO using this in a sub-nested anon function
    ]
});
