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
        wrapInSafe('_.chain(this).filter().each()'),
        wrapInSafe('this.chain().run()'),
        wrapInSafe('return this.chain().run()'),
        wrapInSafe('return _.chain(this).blah()'),
    ],

    invalid: [{
        code: 'var that = this; $el.on("click", function () { this.trigger("ok"); });',
        errors: [{ message: '"this" should declare a local alias when within safe context', }]
    }, {
        code: 'var that = this; $el.on("click", function () { var $node = $(this); $node.trigger("ok"); this.run(); });',
        errors: [{ message: '"this" should declare a local alias when within safe context', }]
    }, {
        code: 'var self = this; $el.on("click", function () { this.trigger("ok"); });',
        args: [1, 'self'],
        errors: [{ message: '"this" should declare a local alias when within safe context', }]
    }, {
        code: 'var that = this; $el.on("click", function () { var a = 1, $node = $(this); });',
        errors: [{ message: 'this redeclaration was not the first variable assignment' }]
    }, {
        code: wrapInSafe('var a = 1; var $node = $(this);'),
        errors: [{ message: 'something declared this, but wasnt first variable declaration in function' }]
    }, {
        code: wrapInSafe('var a = 1; that.trigger(this.getProject());'),
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
    }
        // TODO using this in a sub-nested anon function
    ]
});
