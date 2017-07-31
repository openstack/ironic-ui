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

  angular
    .module('horizon.dashboard.admin.ironic')
    .factory('horizon.dashboard.admin.ironic.form-field.service',
             formFieldService);

  function formFieldService() {
    var service = {
      FormField: FormField
    };

    /**
     * @description Utility class for managing form fields.
     *              Used is association with the form-field directive.
     *
     * @param {object} args  - Base properties are:
     *   type [string]       - Field type. One of: 'input', 'radio', 'select'
     *   id [string]         - id/name of the DOM value element
     *   title [string]      - Label used to identify the field to the user
     *   options             - type == radio [array of object]:
     *                           List of option objects for a radio field.
     *                           Each object has 'label' and 'value'
     *                           properties.
     *                         type == select [string]:
     *                           String expression that is passed to ng-options
     *   value               - Initial value of the field
     *   required [boolean]  - Does the field require a value
     *   desc [string]       - Field description
     *   pattern [RegExp]    - Regular expression pattern used to match
     *                           valid input values
     *   disabled [boolean]  - Is the field disabled
     *   info [string]       - Additional information about the current state
     *                           of the field. It will be displayed in a tooltip
     *                           associated with the field.
     *   autoFocus [boolean] - True if the focus should be set to this field.
     *                           Only applies to fields of type input.
     *   change [string]     - Expression to be evaluated when the value of
     *                           this field changes. Only applies to fields of
     *                           type input.
     *
     * @return {void}
     */
    function FormField(args) {
      var field = this;
      field.type = 'input';
      field.id = undefined;
      field.title = undefined;
      field.options = undefined;
      field.value = undefined;
      field.required = false;
      field.desc = undefined;
      field.pattern = undefined;
      field.disabled = false;
      field.info = undefined;
      field.autoFocus = false;
      field.change = undefined;

      angular.forEach(args, function(value, arg) {
        field[arg] = value;
      });

      /**
       * @description Test whether the field has a non-empty value.
       *   Note that an empty value can be either '' or undefined in the
       *   case of a required field
       *
       * @return {boolean} Return true if the field has a value
       */
      this.hasValue = function() {
        return angular.isDefined(this.value) && this.value !== '';
      };

      /**
       * @description Disable this field.
       *
       * @param {string} reason - Optional reason for disabling this field.
       * @return {void}
       */
      this.disable = function(reason) {
        this.disabled = true;
        if (angular.isDefined(reason)) {
          this.info = reason;
        }
      };
    }

    return service;
  }
})();
