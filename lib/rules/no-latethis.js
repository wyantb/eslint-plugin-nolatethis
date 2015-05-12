'use strict';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

var _ = require('lodash');

module.exports = function(context) {

    var safeContextAlias = context.options[0] || 'that';

    //--------------------------------------------------------------------------
    // Helpers
    //--------------------------------------------------------------------------

    function reportBadAssignment(node) {
        context.report(node,
            'Designated alias "{{alias}}" is not assigned to "this".',
            { alias: safeContextAlias });
    }

    function checkAssignment(node, name, value) {
        var isThis = value.type === 'ThisExpression';

        if (name === safeContextAlias) {
            if (!isThis || node.operator && node.operator !== '=') {
                reportBadAssignment(node);
                return;
            }
        } else if (isThis) {
            context.report(node,
                'Unexpected alias "{{name}}" for "this".', { name: name });
            return;
        }

        node.parent.parent.__hasSafeContext__ = true;
    }

    function hasParentWithSafeContext(node) {
        while (node.parent) {
            if (node.__hasSafeContext__) {
                return true;
            }
            node = node.parent;
        }
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    return {
        'VariableDeclarator': function (node) {
            if (node.init !== null) {
                checkAssignment(node, node.id.name, node.init);
            }
        },
        'AssignmentExpression': function (node) { // TODO test this
            if (node.left.type === 'Identifier') {
                checkAssignment(node, node.left.name, node.right);
            }
        },

        'CallExpression': function(node) {
            var fnsThatUseThis = _.where(node.arguments, {type: 'ThisExpression'});
            if (fnsThatUseThis.length && hasParentWithSafeContext(node)) {
                context.report(node, 'used this in a inner function of something that declared a safe context');
            }
        }
    };

};
