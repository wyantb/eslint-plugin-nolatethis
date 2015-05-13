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
    }, {
        code: 'console.log(this);'
    }, {
        code: 'this.doSomething();'
    }, {
        code: wrapInSafe('var $node = $(this), foo = 1;')
    }
    ],

    invalid: [{
        code: 'var that = this; $el.on("click", function () { this.trigger("ok"); });',
        errors: [{ message: 'used "this" instead of "that"', }]
    }, {
        code: 'var that = this; $el.on("click", function () { var $node = $(this); $node.trigger("ok"); this.run(); });',
        errors: [{ message: 'used "this" instead of "that"', }]
    }, {
        code: 'var self = this; $el.on("click", function () { this.trigger("ok"); });',
        args: [1, 'self'],
        errors: [{ message: 'used "this" instead of "self"', }]
    }, {
        code: 'var that = this; $el.on("click", function () { var a = 1, $node = $(this); });',
        errors: [{ message: 'this redeclaration was not the first variable assignment' }]
    }, {
        code: wrapInSafe('var a = 1; var $node = $(this);'),
        errors: [{ message: 'something declared this, but wasnt first variable declaration in function' }]
    }
        // TODO using this in a sub-nested anon function
    ]
});
