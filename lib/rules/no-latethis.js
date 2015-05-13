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

    function declaratorUsesThis(decl) {
        return decl.init.type === 'ThisExpression';
    }
    function declarationDeclaresThis(node) {
        return _.any(node.declarations, declaratorUsesThis);
    }
    function filterVariableDeclarations(nodes) {
        return _.where(nodes, {type: 'VariableDeclaration'});
    }
    function hasParentWithSafeContext(node) {
        node = node.parent;
        while (node) {
            if (_.isArray(node.body)) {
                var nodes = node.body;
                var declarations = filterVariableDeclarations(nodes);
                var declaresSafeContext = _.any(declarations, declarationDeclaresThis);
                if (declaresSafeContext) {
                    return true;
                }
            }
            node = node.parent;
        }
        return false;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    return {
        'CallExpression': function(node) {
            var isParentVariableDeclaration = node.parent.type === 'VariableDeclarator';
            if (isParentVariableDeclaration) {
                return;
            }
            if (!hasParentWithSafeContext(node)) {
                return;
            }

            var fnsThatUseThis = _.where(node.arguments, {type: 'ThisExpression'});
            if (fnsThatUseThis.length) {
                context.report(node, 'used "this" in a inner function of something that declared a safe context');
            }
        },

        'ExpressionStatement': function(node) {
            if (!hasParentWithSafeContext(node)) {
                return;
            }

            var expr = node.expression;
            if (expr.type === 'CallExpression' && expr.callee.object.type === 'ThisExpression') {
                context.report(node, 'used "this" instead of "{{name}}"', { name: safeContextAlias });
            }
        }
    };

};
