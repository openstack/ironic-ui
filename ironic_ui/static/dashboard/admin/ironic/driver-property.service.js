/*
 * Copyright 2017 Cray Inc.
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
    .factory('horizon.dashboard.admin.ironic.driver-property.service',
             driverPropertyService);

  driverPropertyService.$inject = [
    '$log',
    'horizon.dashboard.admin.ironic.postfix-expr.service',
    'horizon.dashboard.admin.ironic.validHostNamePattern',
    'horizon.dashboard.admin.ironic.validUuidPattern'
  ];

  function driverPropertyService($log,
                                 postfixExprService,
                                 validHostNamePattern,
                                 validUuidPattern) {
    var service = {
      DriverProperty: DriverProperty
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
      return ret[0] === postfixExprService.PostfixExpr.status.OK &&
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
      var expr = new postfixExprService.PostfixExpr();
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
            expr.addOperator(postfixExprService.PostfixExpr.op.EQ);
            numAdds++;
            if (numAdds > 1) {
              expr.addOperator(postfixExprService.PostfixExpr.op.OR);
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
      var expr = new postfixExprService.PostfixExpr();

      var parts = match[1].split(", or ");
      expr.addProperty(parts[1]);
      expr.addValue(undefined);
      expr.addOperator(postfixExprService.PostfixExpr.op.EQ);

      parts = parts[0].split(", ");
      for (var i = 0; i < parts.length; i++) {
        expr.addProperty(parts[i]);
        expr.addValue(undefined);
        expr.addOperator(postfixExprService.PostfixExpr.op.EQ);
        expr.addOperator(postfixExprService.PostfixExpr.op.AND);
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

    return service;
  }
})();
