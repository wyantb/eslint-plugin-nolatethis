/**
 * @fileoverview Forces developers to alias or use this only as the first line in a function, when a parent function has a safe context var.
 */
'use strict';

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var eslint = require('eslint');
var ESLintTester = require('eslint-tester');

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

var eslintTester = new ESLintTester(eslint.linter);
eslintTester.addRuleTest('./lib/rules/earlythis', {

    valid: [
        'var self = this;',
    ],

    invalid: [{
        code: 'var self = this; $el.on(\'click\', function () { self.run(); this.trigger(\'ok\'); });',
        errors: [{ message: 'Fill me in.', }]
    }]
});
