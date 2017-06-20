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

  var SELECT_OPTIONS_REGEX =
    new RegExp(
      gettext('(?:[Oo]ne of )(?!this)((?:(?:"[^"]+"|[^,\\. ]+)(?:, |\\.))+)'));

  var DEFAULT_IS_REGEX =
      new RegExp(gettext('default (?:value )?is ([^"\\. ]+|"[^"]+")'));

  var DEFAULTS_TO_REGEX =
      new RegExp(gettext('Defaults to ([^"\\. ]+|"[^"]+")'));

  var DEFAULT_IN_PARENS_REGEX =
      new RegExp(gettext(' ([^" ]+|"[^"]+") \\(Default\\)'));

  var DEFAULT_REGEX_LIST = [DEFAULT_IS_REGEX,
                            DEFAULTS_TO_REGEX,
                            DEFAULT_IN_PARENS_REGEX];
  var ONE_OF_REGEX =
      new RegExp(gettext('One of this, (.*) must be specified\\.'));

  var NOT_INSIDE_MATCH = -1;

  var VALID_PORT_REGEX = new RegExp('^\\d+$');

  var VALID_IPV4_ADDRESS = "^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"; // eslint-disable-line max-len

  var VALID_IPV6_ADDRESS = "^\\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:)))(%.+)?\\s*$"; // eslint-disable-line max-len

  angular
    .module('horizon.dashboard.admin.ironic')
    .factory('horizon.dashboard.admin.ironic.base-node.service',
             baseNodeService);

  baseNodeService.$inject = [
    '$uibModal',
    '$log',
    'horizon.dashboard.admin.ironic.validHostNamePattern',
    'horizon.dashboard.admin.ironic.validUuidPattern'
  ];

  function baseNodeService($uibModal,
                           $log,
                           validHostNamePattern,
                           validUuidPattern) {
    var service = {
      DriverProperty: DriverProperty,
      PostfixExpr: PostfixExpr,
      Graph: Graph,
      driverPropertyGroupHasRequired: driverPropertyGroupHasRequired,
      driverPropertyGroupsToString: driverPropertyGroupsToString,
      compareDriverPropertyGroups: compareDriverPropertyGroups
    };

    var VALID_ADDRESS_HOSTNAME_REGEX = new RegExp(VALID_IPV4_ADDRESS + "|" +
                                                  VALID_IPV6_ADDRESS + "|" +
                                                  validHostNamePattern);

    var VALID_IMAGE_REGEX = new RegExp(validUuidPattern + "|" +
                                       "^(https?|file)://.+$");

    /**
       The DriverProperty class is used to represent an ironic driver
       property. It is currently used by the base-node form to
       support property display, value assignment and validation.

       The following rules are used to extract information about a property
       from the description returned by the driver.

       1. If the description ends with " Required." a value must be
       supplied for the property.

       2. The following syntax is used to extract default values
       from property descriptions.

       Default is <value>(<space>|.)
       default is “<value>”
       default value is <value>(<space>|.)
       default value is “<value>”
       Defaults to <value>(<space>|.)
       Defaults to “<value>”
       <value> (Default)

       3. The following syntax is used to determine whether a property
       is considered active. In the example below if the user specifies
       a value for <property-name-1>, properties 2 to n will be tagged
       inactive, and hidden from view. All properties are considered
       to be required.

       One of this, <property-name-1>, <property-name-2>, …, or
       <property-name-n> must be specified.

       4. The following syntax is used to determine whether a property
       is restricted to a set of enumerated values. The property will
       be displayed as an HTML select element.

       [Oo]ne of <value-1>, "<value-2>", …, <value-n>.

       5. The following syntax is used to determine whether a property is
       active and required based on the value of another property.
       If the property is not active it will not be displayed.

       Required|Used only if <property-name> is set to <value-1>
       (or "<value-2>")*.

       Notes:
       1. The properties "deploy_kernel" and "deploy_ramdisk" are
       assumed to accept Glance image uuids as valid values.

       2. Property names ending in _port are assumed to only accept
       positive integer values

       3. Property names ending in _address are assumed to only accept
       valid IPv4 and IPv6 addresses; and hostnames
    */

    /**
     * @description Construct a new driver property
     *
     * @class DriverProperty
     * @param {string} name - Name of property
     * @param {string} desc - Description of property
     * @param {object} propertySet - Set of properties to which this one belongs
     *
     * @property {string} defaultValue - Default value of the property
     * @property {string[]} selectOptions - If the property is limited to a
     * set of enumerated values then selectOptions will be an array of those
     * values, otherwise null
     * @property {boolean} required - Boolean value indicating whether a value
     * must be supplied for this property if it is active
     * @property {PostfixExpr} isActiveExpr - Null if this property is always
     * active; otherwise, a boolean expression that when evaluated will
     * return whether this variable is active. A property is considered
     * active if its role is not eliminated by the values of other
     * properties in the property-set.
     * @property {string} inputValue - User assigned value for this property
     * @property {regexp} validValueRegex - Regular expression used to
     * determine whether an input value is valid.
     * @returns {object} Driver property
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
      this.inputValue = this.defaultValue;

      // Infer that property is a boolean that can be represented as a
      // True/False selection
      if (this.selectOptions === null &&
          (this.defaultValue === "True" || this.defaultValue === "False")) {
        this.selectOptions = ["True", "False"];
      }

      this.validValueRegex = _determineValidValueRegex(this.name);
    }

    /**
     * @description Return a regular expression that can be used to
     * validate the value of a specified property
     *
     * @param {string} propertyName - Name of property
     * @return {regexp} Regular expression object or undefined
     */
    function _determineValidValueRegex(propertyName) {
      var regex;
      if (propertyName.endsWith("_port")) {
        regex = VALID_PORT_REGEX;
      } else if (propertyName.endsWith("_address")) {
        regex = VALID_ADDRESS_HOSTNAME_REGEX;
      } else if (propertyName === "deploy_kernel") {
        regex = VALID_IMAGE_REGEX;
      } else if (propertyName === "deploy_ramdisk") {
        regex = VALID_IMAGE_REGEX;
      }

      return regex;
    }

    DriverProperty.prototype.isActive = function() {
      if (!this.isActiveExpr) {
        return true;
      }
      var ret = this.isActiveExpr.evaluate(this.propertySet);
      return ret[0] === PostfixExpr.status.OK &&
        typeof ret[1] === "boolean" ? ret[1] : true;
    };

    /**
     * @description Get a regular expression object that can be used to
     * determine whether a value is valid for this property
     *
     * @return {regexp} Regular expression object or undefined
     */
    DriverProperty.prototype.getValidValueRegex = function() {
      return this.validValueRegex;
    };

    /**
     * @description Must a value be provided for this property
     *
     * @return {boolean} True if a value must be provided for this property
     */
    DriverProperty.prototype.isRequired = function() {
      return this.required;
    };

    DriverProperty.prototype._analyzeSelectOptions = function() {
      var match = this.desc.match(SELECT_OPTIONS_REGEX);
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
     * @description Get the list of select options for this property
     *
     * @return {string[]} null if this property is not selectable; else,
     * an array of selectable options
     */
    DriverProperty.prototype.getSelectOptions = function() {
      return this.selectOptions;
    };

    /**
     * @description Remove leading/trailing double-quotes from a string
     *
     * @param {string} str - String to be trimmed
     * @return {string} trim'd string
     */
    function trimQuotes(str) {
      return str.charAt(0) === '"'
        ? str.substring(1, str.length - 1) : str;
    }

    /**
     * @description Get the default value of this property
     *
     * @return {string} Default value of this property
     */
    DriverProperty.prototype._getDefaultValue = function() {
      var value;
      for (var i = 0; i < DEFAULT_REGEX_LIST.length; i++) {
        var match = this.desc.match(DEFAULT_REGEX_LIST[i]);
        if (match) {
          value = trimQuotes(match[1]);
          break;
        }
      }
      $log.debug("_getDefaultValue | " + this.desc + " | " + value);
      return value;
    };

    /**
     * @description Get the input value of this property
     *
     * @return {string} the input value of this property
     */
    DriverProperty.prototype.getInputValue = function() {
      return this.inputValue;
    };

    /**
     * @description Get the default value of this property
     *
     * @return {string} the default value of this property
     */
    DriverProperty.prototype.getDefaultValue = function() {
      return this.defaultValue;
    };

    /**
     * @description Get the description of this property
     *
     * @return {string} Description of this property
     */
    DriverProperty.prototype.getDescription = function() {
      return this.desc;
    };

    /**
     * @description Use the property description to build an expression
     * that will evaluate to a boolean result indicating whether the
     * property is active
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

      var i = NOT_INSIDE_MATCH;
      var j = re.lastIndex;
      while (j < this.desc.length) {
        if (i === NOT_INSIDE_MATCH && this.desc.charAt(j) === ".") {
          break;
        }

        if (this.desc.charAt(j) === '"') {
          if (i === NOT_INSIDE_MATCH) {
            i = j + 1;
          } else {
            expr.addProperty(match[2]);
            expr.addValue(this.desc.substring(i, j));
            expr.addOperator(PostfixExpr.op.EQ);
            numAdds++;
            if (numAdds > 1) {
              expr.addOperator(PostfixExpr.op.OR);
            }
            i = NOT_INSIDE_MATCH;
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
      var match = this.desc.match(ONE_OF_REGEX);
      if (!match) {
        return null;
      }

      // Build logical expression to describe under what conditions this
      // property is active
      var expr = new PostfixExpr();

      var parts = match[1].split(", or ");
      expr.addProperty(parts[1]);
      expr.addValue(undefined);
      expr.addOperator(PostfixExpr.op.EQ);

      parts = parts[0].split(", ");
      for (var i = 0; i < parts.length; i++) {
        expr.addProperty(parts[i]);
        expr.addValue(undefined);
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
     * @description Get the names of the driver-properties whose values
     * determine whether this property is active
     *
     * @return {object} Object the properties of which are names of
     * activating driver-properties or null
     */
    DriverProperty.prototype.getActivators = function() {
      return this.isActiveExpr ? this.isActiveExpr.getProperties() : null;
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

    PostfixExpr.UNDEFINED = undefined;

    PostfixExpr.status = {
      OK: 0,
      ERROR: 1,
      BAD_ARG: 2,
      UNKNOWN_OP: 3,
      MALFORMED: 4
    };

    /**
     * @description Add a property to the expression
     *
     * @param {string} propertyName - Property name
     *
     * @return {void}
     */
    PostfixExpr.prototype.addProperty = function(propertyName) {
      this.elem.push({name: propertyName});
    };

    /**
     * @description Add a value to the expression
     *
     * @param {object} value - value
     *
     * @return {void}
     */
    PostfixExpr.prototype.addValue = function(value) {
      this.elem.push({value: value});
    };

    /**
     * @description Add an operator to the expression
     *
     * @param {PostfixExpr.op} opId - operator
     *
     * @return {void}
     */
    PostfixExpr.prototype.addOperator = function(opId) {
      this.elem.push({op: opId});
    };

    /**
     * @description Get a list of property names referenced by this
     * expression
     *
     * @return {object} An object each property of which corresponds to
     * a property in the expression
     */
    PostfixExpr.prototype.getProperties = function() {
      var properties = {};
      angular.forEach(this.elem, function(elem) {
        if (angular.isDefined(elem.name)) {
          properties[elem.name] = true;
        }
      });
      return properties;
    };

    /**
     * @description Evaluate a boolean binary operation
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
     * @description Evaluate the experssion using property values from
     * a specified set
     *
     * @param {object} propertySet - Dictionary of DriverProperty instances
     *
     * @return {array} Return code and Value of the expression
     */
    PostfixExpr.prototype.evaluate = function(propertySet) {
      var resultStack = [];
      for (var i = 0, len = this.elem.length; i < len; i++) {
        var elem = this.elem[i];
        if (elem.hasOwnProperty("name")) {
          resultStack.push(propertySet[elem.name].getInputValue());
        } else if (elem.hasOwnProperty("value")) {
          resultStack.push(elem.value);
        } else if (elem.hasOwnProperty("op")) {
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

    /**
     * @description Class for representing and manipulating undirected
     * graphs
     *
     * @property {object} vertices - Associative array of vertex objects
     * indexed by property name
     * @return {object} Graph
     */
    function Graph() {
      this.vertices = {};
    }

    Graph.prototype.getVertex = function(vertexName) {
      var vertex = null;
      if (this.vertices.hasOwnProperty(vertexName)) {
        vertex = this.vertices[vertexName];
      }
      return vertex;
    };

    /**
     * @description Add a vertex to this graph
     *
     * @param {string} name - Vertex name
     * @param {object} data - Vertex data
     * @returns {object} - Newly created vertex
     */
    Graph.prototype.addVertex = function(name, data) {
      var vertex = {name: name, data: data, adjacents: []};
      this.vertices[name] = vertex;
      return vertex;
    };

    /**
     * @description Add an undirected edge between two vertices
     *
     * @param {string} vertexName1 - Name of first vertex
     * @param {string} vertexName2 - Name of second vertex
     * @returns {void}
     */
    Graph.prototype.addEdge = function(vertexName1, vertexName2) {
      this.vertices[vertexName1].adjacents.push(vertexName2);
      this.vertices[vertexName2].adjacents.push(vertexName1);
    };

    /**
     * @description Depth-first-search graph traversal utility function
     *
     * @param {object} vertex - Root vertex from which traveral will begin.
     * It is assumed that this vertex has not alreday been visited as part
     * of this traversal.
     * @param {object} visited - Associative array. Each named property
     * corresponds to a vertex with the same name, and has boolean value
     * indicating whether the vertex has been alreday visited.
     * @param {object[]} component - Array of vertices that define a strongly
     * connected component.
     * @returns {void}
     */
    Graph.prototype._dfsTraverse = function(vertex, visited, component) {
      var graph = this;
      visited[vertex.name] = true;
      component.push(vertex);

      /* eslint-disable no-unused-vars */
      angular.forEach(vertex.adjacents, function(vertexName) {
        if (!visited[vertexName]) {
          graph._dfsTraverse(graph.vertices[vertexName], visited, component);
        }
      });
      /* eslint-enable no-unused-vars */
    };

    /**
     * @description Perform a depth-first-search on a specified graph to
     * find strongly connected components. A user provided function will
     * be called to process each component.
     *
     * @param {function} componentFunc - Function called on each strongly
     * connected component. Accepts aruments: array of vertex objects, and
     * user-provided extra data that can be used in processing the component.
     * @param {object} extra - Extra data that is passed into the component
     * processing function.
     * @returns {void}
     */
    Graph.prototype.dfs = function(componentFunc, extra) {
      var graph = this;
      var visited = {};
      angular.forEach(
        graph.vertices,
        function(unused, name) {
          visited[name] = false;
        });

      angular.forEach(this.vertices, function(vertex, vertexName) {
        if (!visited[vertexName]) {
          var component = [];
          graph._dfsTraverse(vertex, visited, component);
          componentFunc(component, extra);
        }
      });
    };

    /**
     * @description Check whether a group contains required properties
     *
     * @param {DriverProperty[]} group - Property group
     * @return {boolean} Return true if the group contains required
     *   properties, false otherwise
     */
    function driverPropertyGroupHasRequired(group) {
      var hasRequired = false;
      for (var i = 0; i < group.length; i++) {
        if (group[i].required) {
          hasRequired = true;
          break;
        }
      }
      return hasRequired;
    }

    /**
     * @description Convert array of driver property groups to a string
     *
     * @param {array[]} groups - Array of driver property groups
     * @return {string} Output string
     */
    function driverPropertyGroupsToString(groups) {
      var output = [];
      angular.forEach(groups, function(group) {
        var groupStr = [];
        angular.forEach(group, function(property) {
          groupStr.push(property.name);
        });
        groupStr = groupStr.join(", ");
        output.push(['[', groupStr, ']'].join(""));
      });
      output = output.join(", ");
      return ['[', output, ']'].join("");
    }

    /**
     * @description Comaprison function used to sort driver property groups
     *
     * @param {DriverProperty[]} group1 - First group
     * @param {DriverProperty[]} group2 - Second group
     * @return {integer} Return:
     * < 0 if group1 should precede group2 in an ascending ordering
     * > 0 if group2 should precede group1
     * 0 if group1 and group2 are considered equal from ordering perpsective
     */
    function compareDriverPropertyGroups(group1, group2) {
      var group1HasRequired = driverPropertyGroupHasRequired(group1);
      var group2HasRequired = driverPropertyGroupHasRequired(group2);

      if (group1HasRequired === group2HasRequired) {
        if (group1.length === group2.length) {
          return group1[0].name.localeCompare(group2[0].name);
        } else {
          return group1.length - group2.length;
        }
      } else {
        return group1HasRequired ? -1 : 1;
      }
      return 0;
    }

    return service;
  }
})();
