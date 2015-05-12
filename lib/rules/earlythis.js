/**
 * @fileoverview Forces developers to alias or use this only as the first line in a function, when a parent function has a safe context var.
 * @author Brian
 * @copyright 2014 Brian. All rights reserved.
 */
"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function(context) {

    // variables should be defined here

    //--------------------------------------------------------------------------
    // Helpers
    //--------------------------------------------------------------------------

    // any helper functions should go here or else delete this section

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    return {
        'VariableDeclaration': function(node) {
            context.report(node, 'plugin is broke');
        }
    };

};
