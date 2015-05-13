'use strict';

var eslint = require('eslint');
var ESLintTester = require('eslint-tester');

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

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
    }
        // TODO as later part of onevar
        // TODO using this as part of func call, ala $(this)
        // TODO using this in a sub-nested anon function
    ]
});
