'use strict';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

var _ = require('lodash');

module.exports = function(context) {

    // var safeContextAlias = context.options[0] || 'that';

    //--------------------------------------------------------------------------
    // Helpers
    //--------------------------------------------------------------------------

    function hasThisArgument(args) {
        return _.where(args, {type: 'ThisExpression'}).length ||
            _.where(args, {object: {type: 'ThisExpression'}}).length ||
            _.where(args, {callee: {object: {type: 'ThisExpression'}}}).length;
    }
    function declaratorUsesThis(decl) {
        return decl.init.type === 'ThisExpression' ||
            (decl.init.type === 'CallExpression' && hasThisArgument(decl.init.arguments));
    }
    function declaratorDeclaresSafeContext(decl) {
        return decl.init.type === 'ThisExpression';
    }
    function declarationDeclaresSafeContext(node) {
        return _.any(node.declarations, declaratorDeclaresSafeContext);
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
                var declaresSafeContext = _.any(declarations, declarationDeclaresSafeContext);
                if (declaresSafeContext) {
                    return true;
                }
            }
            node = node.parent;
        }
        return false;
    }
    function getDeepKey(node, key) {
        var parts = key.split('.');
        var partIdx = 0;
        while (node && partIdx < parts.length) {
            node = node[parts[partIdx]];
            partIdx += 1;
        }
        return node;
    }

    function checkRootCallExpression(expr, positionWithinParent, node) {
        while (expr) {
            if (hasThisArgument(expr.arguments)) {
                var object = getDeepKey(expr, 'callee.object');
                if (object && object.type === 'CallExpression') {
                    context.report(node, '"this" should not be late in a chain call');
                }
                if (positionWithinParent !== 0) {
                    context.report(node, '"this" should not be used in later expressions in anon functions');
                }
            }
            expr = getDeepKey(expr, 'callee.object');
        }
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

        'ExpressionStatement': function(node) {
            if (!hasParentWithSafeContext(node)) {
                return;
            }

            var positionWithinParent = node.parent.body.indexOf(node);
            checkRootCallExpression(node.expression, positionWithinParent, node);

            var callee = node.expression.callee;
            if (callee && callee.object && callee.object.type === 'ThisExpression') {
                context.report(node, '"this" should declare a local alias when within safe context');
            }
        },
        'ReturnStatement': function(node) {
            if (!hasParentWithSafeContext(node)) {
                return;
            }

            var positionWithinParent = node.parent.body.indexOf(node);
            checkRootCallExpression(node.argument, positionWithinParent, node);
        }
    };

};
