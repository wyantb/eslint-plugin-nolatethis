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

    function hasThisArgument(args) {
        return _.where(args, {type: 'ThisExpression'});
    }
    function declaratorUsesThis(decl) {
        return decl.init.type === 'ThisExpression' ||
            (decl.init.type === 'CallExpression' && hasThisArgument(decl.init.arguments));
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
        'VariableDeclaration': function(node) {
            if (!hasParentWithSafeContext(node.parent)) {
                return;
            }

            var otherDecls = _.rest(node.declarations);
            if (_.any(otherDecls, declaratorUsesThis)) {
                context.report(node, 'this redeclaration was not the first variable assignment');
            }

            var firstDecl = _.first(node.declarations);
            var positionWithinParent = node.parent.body.indexOf(node);
            if (positionWithinParent !== 0 && declaratorUsesThis(firstDecl)) {
                context.report(node, 'something declared this, but wasnt first variable declaration in function');
            }
        },

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
