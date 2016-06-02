/*
 * Copyright 2016 Cray Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function() {
  'use strict';

  var REQUIRED = " " + gettext("Required") + ".";
  var selectOptionsRegexp =
      new RegExp(
        gettext('(?:[Oo]ne of )(?!this)((?:(?:"[^"]+"|[^,\. ]+)(?:, |\.))+)'));
  var defaultValueRegexp = new RegExp(gettext('default is ([^". ]+|"[^"]+")'));
  var oneOfRegexp =
      new RegExp(gettext('One of this, (.*) must be specified\.'));
  var notInsideMatch = -1;

  angular
    .module('horizon.dashboard.admin.ironic')
    .factory('horizon.dashboard.admin.ironic.enroll-node.service',
             enrollNodeService);

  enrollNodeService.$inject = [
    '$modal',
    'horizon.dashboard.admin.basePath',
    '$log'
  ];

  function enrollNodeService($modal, basePath, $log) {
    var service = {
      modal: modal,
      DriverProperty: DriverProperty
    };

    function modal() {
      var options = {
        controller: 'EnrollNodeController as ctrl',
        templateUrl: basePath + '/ironic/enroll-node/enroll-node.html'
      };
      return $modal.open(options);
    }

    /**
     * Construct a new driver property
     *
     * @class DriverProperty
     * @param {string} name - Name of property
     * @param {string} desc - Description of property
     * @param {object} propertySet - Set of properties to which this one belongs
     *
     * @property {string} defaultValue - Default value of the property
     * @property {string[]} selectOptions - If the property is limited to a
     * set of enumerted values then selectOptions will be an array of those
     * values, otherwise null
     * @property {boolean} required - Boolean value indicating whether a value
     * must be supplied for this property if it is active
     * @property {PostfixExpr} isActiveExpr - Null if this property is always
     * active; otherwise, a boolean expression that when evaluated will
     * return whether this variable is active
     * @propery {string} inputValue User assigned value for this property
     */
    function DriverProperty(name, desc, propertySet) {
      this.name = name;
      this.desc = desc;
      this.propertySet = propertySet;
      // Determine whether this property should be presented as a selection
      this.selectOptions = this._analyzeSelectOptions();
      this.required = null;  // Initialize to unknown
      // Expression to be evaluated to determine whether property is active.
      // By default the property is considered active.
      this.isActiveExpr = null;
      var result = this._analyzeRequiredOnlyDependencies();
      if (result) {
        this.required = result[0];
        this.isActiveExpr = result[1];
      }
      if (!this.isActiveExpr) {
        result = this._analyzeOneOfDependencies();
        if (result) {
          this.required = result[0];
          this.isActiveExpr = result[1];
        }
      }
      if (this.required === null) {
        this.required = desc.endsWith(REQUIRED);
      }
      this.defaultValue = this._getDefaultValue();
      this.inputValue = null;
    }

    DriverProperty.prototype.isActive = function() {
      if (!this.isActiveExpr) {
        return true;
      }
      var ret = this.isActiveExpr.evaluate(this.propertySet);
      return ret[0] === PostfixExpr.status.OK &&
        typeof ret[1] === "boolean" ? ret[1] : true;
    };

    /*
     * Must a value be provided for this property
     *
     * @return {boolean} True if a value must be provided for this property
     */
    DriverProperty.prototype.isRequired = function() {
      return this.required && this.isActive();
    };

    DriverProperty.prototype._analyzeSelectOptions = function() {
      var match = this.desc.match(selectOptionsRegexp);
      if (!match) {
        return null;
      }

      var matches = match[1].substring(0, match[1].length - 1).split(", ");
      var options = [];
      angular.forEach(matches, function(match) {
        options.push(trimQuotes(match));
      });
      return options;
    };

    /**
     * Get the list of select options for this property
     *
     * @return {string[]} null if this property is not selectable; else,
     * an array of selectable options
     */
    DriverProperty.prototype.getSelectOptions = function() {
      return this.selectOptions;
    };

    /**
     * Remove leading/trailing double-quotes from a string
     *
     * @param {string} str - String to be trimmed
     * @return {string} trim'd string
     */
    function trimQuotes(str) {
      return str.charAt(0) === '"'
        ? str.substring(1, str.length - 1) : str;
    }

    /**
     * Get the default value of this property
     *
     * @return {string} Default value of this property
     */
    DriverProperty.prototype._getDefaultValue = function() {
      var match = this.desc.match(defaultValueRegexp);
      return match ? trimQuotes(match[1]) : null;
    };

    /**
     * Get the actual value of this property
     *
     * @return {string} Get the actual value of this property. If
     * an input value has not been specified, but a default value exists
     * that will be returned.
     */
    DriverProperty.prototype.getActualValue = function() {
      return this.inputValue ? this.inputValue
        : this.defaultValue ? this.defaultValue : null;
    };

    /**
     * Get the description of this property
     *
     * @return {string} Description of this property
     */
    DriverProperty.prototype.getDescription = function() {
      return this.desc;
    };

    /**
     * Use the property description to build an expression that will
     * evaluate to a boolean result indicating whether the property is
     * active
     *
     * @return {array} null if this property is not dependent on any others;
     * otherwise,
     * [0] boolean indicating whether if active a value must be
     * supplied for this property.
     * [1] an expression that when evaluated will return a boolean
     * result indicating whether this property is active
     */
    DriverProperty.prototype._analyzeRequiredOnlyDependencies = function() {
      var re = /(Required|Used) only if ([^ ]+) is set to /g;
      var match = re.exec(this.desc);

      if (!match) {
        return null;
      }

      // Build logical expression to describe under what conditions this
      // property is active
      var expr = new PostfixExpr();
      var numAdds = 0;

      var i = notInsideMatch;
      var j = re.lastIndex;
      while (j < this.desc.length) {
        if (i === notInsideMatch && this.desc.charAt(j) === ".") {
          break;
        }

        if (this.desc.charAt(j) === '"') {
          if (i === notInsideMatch) {
            i = j + 1;
          } else {
            expr.addProperty(match[2]);
            expr.addValue(this.desc.substring(i, j));
            expr.addOperator(PostfixExpr.op.EQ);
            numAdds++;
            if (numAdds > 1) {
              expr.addOperator(PostfixExpr.op.OR);
            }
            i = notInsideMatch;
          }
        }
        j++;
      }
      $log.debug("_analyzeRequiredOnlyDependencies | " +
                 this.desc + " | " +
                 match[2] + ", " +
                 JSON.stringify(expr));
      return [match[1] === "Required", expr];
    };

    DriverProperty.prototype._analyzeOneOfDependencies = function() {
      var match = this.desc.match(oneOfRegexp);
      if (!match) {
        return null;
      }

      // Build logical expression to describe under what conditions this
      // property is active
      var expr = new PostfixExpr();

      var parts = match[1].split(", or ");
      expr.addProperty(parts[1]);
      expr.addValue(null);
      expr.addOperator(PostfixExpr.op.EQ);

      parts = parts[0].split(", ");
      for (var i = 0; i < parts.length; i++) {
        expr.addProperty(parts[i]);
        expr.addValue(null);
        expr.addOperator(PostfixExpr.op.EQ);
        expr.addOperator(PostfixExpr.op.AND);
      }
      $log.debug("_analyzeOneOfDependencies | " +
                 this.desc + " | " +
                 JSON.stringify(match) + ", " +
                 JSON.stringify(expr));
      return [true, expr];
    };

    /**
     * PostFixExpr is a class primarily developed to support the
     * evaluation of boolean expressions that determine whether a
     * particular property is active.
     *
     * The expression is stored as a postfix sequence of operands and
     * operators. Operands are currently limited to the literal values
     * and the values of properties in a specified set. Currently
     * supported operands are ==, or, and.
     *
     * @return {void}
     */
    function PostfixExpr() {
      this.elem = [];
    }

    PostfixExpr.op = {
      EQ: "==",
      AND: "and",
      OR: "or"
    };

    PostfixExpr.UNDEFINED = null;

    PostfixExpr.status = {
      OK: 0,
      ERROR: 1,
      BAD_ARG: 2,
      UNKNOWN_OP: 3,
      MALFORMED: 4
    };

    PostfixExpr.prototype.addProperty = function(propertyName) {
      this.elem.push({name: propertyName});
    };

    PostfixExpr.prototype.addValue = function(value) {
      this.elem.push({value: value});
    };

    PostfixExpr.prototype.addOperator = function(opId) {
      this.elem.push({op: opId});
    };

    /**
     * Evaluate a boolean binary operation
     *
     * @param {array} valStack - Stack of values to operate on
     * @param {string} opId - operator id
     *
     * @return {integer} Return code
     */
    function _evaluateBoolBinaryOp(valStack, opId) {
      var retCode = PostfixExpr.status.OK;
      var val1 = valStack.pop();
      var val2 = valStack.pop();
      if (typeof val1 === "boolean" &&
          typeof val2 === "boolean") {
        switch (opId) {
          case PostfixExpr.op.AND:
            valStack.push(val1 && val2);
            break;
          case PostfixExpr.op.OR:
            valStack.push(val1 || val2);
            break;
          default:
            retCode = PostfixExpr.status.UNKNOWN_OP;
        }
      } else {
        retCode = PostfixExpr.status.BAD_ARG;
      }
      return retCode;
    }

    /**
     * Evaluate the experssion using property values from a specified
     * set
     *
     * @param {object} propertySet - Dictionary of DriverProperty instances
     *
     * @return {array} Return code and Value of the expression
     */
    PostfixExpr.prototype.evaluate = function(propertySet) {
      var resultStack = [];
      for (var i = 0, len = this.elem.length; i < len; i++) {
        var elem = this.elem[i];
        if (angular.isDefined(elem.name)) {
          resultStack.push(propertySet[elem.name].getActualValue());
        } else if (angular.isDefined(elem.value)) {
          resultStack.push(elem.value);
        } else if (angular.isDefined(elem.op)) {
          if (elem.op === PostfixExpr.op.EQ) {
            var val1 = resultStack.pop();
            var val2 = resultStack.pop();
            resultStack.push(val1 === val2);
          } else {
            var ret = _evaluateBoolBinaryOp(resultStack, elem.op);
            if (ret !== PostfixExpr.status.OK) {
              return [ret, PostfixExpr.UNDEFINED];
            }
          }
        } else {
          return [PostfixExpr.status.UNKNOWN_ELEMENT, PostfixExpr.UNDEFINED];
        }
      }
      return resultStack.length === 1
        ? [PostfixExpr.status.OK, resultStack.pop()]
        : [PostfixExpr.status.MALFORMED, PostfixExpr.UNDEFINED];
    };

    return service;
  }
})();
