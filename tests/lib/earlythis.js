'use strict';

var eslint = require('eslint');
var ESLintTester = require('eslint-tester');

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

var eslintTester = new ESLintTester(eslint.linter);
eslintTester.addRuleTest('./lib/rules/no-latethis', {

    valid: [{
        code: 'var self = this;',
        args: [1, 'self'],
    }, {
        code: 'var self = this; $el.on("click", function () { var $node = $(this); $node.trigger("ok"); });',
        args: [1, 'self']
    }, {
        code: 'console.log(this);'
    }, {
        code: 'this.doSomething();'
    }
        // TODO as first part of onevar
    ],

    invalid: [{
        code: 'var that = this; $el.on("click", function () { that.run(); this.trigger("ok"); });',
        errors: [{ message: 'Fill me in.', }]
    }, {
        code: 'var that = this; $el.on("click", function () { var $node = $(this); $node.trigger("ok"); this.run(); });',
        errors: [{ message: 'used "this" instead of "that"', }]
    },
        // TODO as later part of onevar
        // TODO using this as part of func call, ala $(this)
        // TODO using this in a sub-nested anon function
    ]
});
