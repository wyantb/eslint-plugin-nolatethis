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
            _.where(args, {object: {type: 'ThisExpression'}}).length;
    }
    function declaratorUsesThis(decl) {
        var init = decl.init;
        return init &&
            (init.type === 'ThisExpression' ||
            (init.type === 'CallExpression' && hasThisArgument(init.arguments)));
    }
    function declaratorDeclaresSafeContext(decl) {
        var init = decl.init;
        return init && init.type === 'ThisExpression';
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

    function checkForThisArguments(expr, positionWithinParent, node) {
        while (expr) {
            if (hasThisArgument(expr)) {
                if (positionWithinParent !== 0) {
                    context.report(node, '"this" should not be used as callee in non-first expression within a function');
                }
            }
            if (hasThisArgument(expr.arguments)) {
                var object = getDeepKey(expr, 'callee.object');
                if (object && object.type === 'CallExpression') {
                    context.report(node, '"this" should not be late in a chain call');
                }
                if (positionWithinParent !== 0) {
                    context.report(node, '"this" should not be used in later expressions in anon functions');
                }
            }
            _.each(expr.arguments, function (arg) {
                checkForThisArguments(arg, positionWithinParent, node);
            });
            expr = getDeepKey(expr, 'callee.object');
        }
    }
    function getPositionWithinParent(node) {
        if (node.parent.body) {
            return node.parent.body.indexOf(node);
        }
        // otherwise, e.g. switch statements, just pretend we're not first so errs are thrown
        return 1;
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

            var positionWithinParent = getPositionWithinParent(node);
            checkForThisArguments(node.expression, positionWithinParent, node);
        },
        'ReturnStatement': function(node) {
            if (!hasParentWithSafeContext(node)) {
                return;
            }

            var positionWithinParent = getPositionWithinParent(node);
            checkForThisArguments(node.argument, positionWithinParent, node);
        }
    };

};
