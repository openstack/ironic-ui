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

  /**
   * Controller used to support operations on an Ironic port
   */
  angular
    .module('horizon.dashboard.admin.ironic')
    .controller('BasePortController', BasePortController);

  BasePortController.$inject = [
    '$uibModalInstance',
    'horizon.dashboard.admin.ironic.validMacAddressPattern',
    'horizon.dashboard.admin.ironic.validDatapathIdPattern',
    'ctrl'
  ];

  /**
   * Utility class for managing form fields
   *
   * @param {object} args - Valid properties are:
   *   value - Initial value of the field
   *   required - Does the field require a value
   *   desc - Field description
   *   pattern - Regular expression pattern used to match
   *   valid input values
   *   disabled - Is the field disabled
   *   info - Additional information about the current state of
   *   the field. It will be displayed in a tooltip associated
   *   with the field.
   *
   * @return {void}
   */
  function Field(args) {
    this.value = angular.isDefined(args.value) ? args.value : undefined;
    this.required = angular.isDefined(args.required) ? args.required : false;
    this.desc = angular.isDefined(args.desc) ? args.desc : undefined;
    this.pattern = angular.isDefined(args.pattern)
      ? new RegExp(args.pattern) : undefined;
    this.disabled = angular.isDefined(args.disabled) ? args.disabled : false;
    this.info = angular.isDefined(args.info) ? args.info : undefined;

    /**
     * Test whether the field has a non-empty value. Note that an
     * empty value can be either '' or undefined in the case of a
     * required field
     *
     * @return {boolean} Return true if the field has a value
     */
    this.hasValue = function() {
      return angular.isDefined(this.value) && this.value !== '';
    };

    /**
     * Test whether the field has help-text
     *
     * @return {boolean} Return true if the field has help text
     */
    this.hasHelpText = function() {
      return this.desc || this.info;
    };

    /**
     * Get the help-text associated with this field
     *
     * @return {string} Return true if the field has help text
     */
    this.getHelpText = function() {
      var text = angular.isDefined(this.desc) ? this.desc : '';
      if (angular.isDefined(this.info)) {
        if (text !== '') {
          text += '<br><br>';
        }
        text += this.info;
      }
      return text;
    };
  }

  function BasePortController($uibModalInstance,
                              validMacAddressPattern,
                              validDatapathIdPattern,
                              ctrl) {
    ctrl.port = {
      address: null,
      extra: {}
    };

    ctrl.pxeEnabled = new Field({value: 'True'});

    // Object used to manage local-link-connection form fields
    ctrl.localLinkConnection = {
      port_id: new Field({}),
      switch_id: new Field({
        desc: gettext("MAC address or OpenFlow datapath ID"),
        pattern: validMacAddressPattern + '|' + validDatapathIdPattern}),
      switch_info: new Field({}),

      /**
       * Update the required property of each field based on current values
       *
       * @return {void}
       */
      $update: function() {
        var required = this.port_id.hasValue() || this.switch_id.hasValue();

        this.port_id.required = required;
        this.switch_id.required = required;
      },

      /**
       * Generate an attribute object that conforms to the format
       * required for port creation using the Ironic client
       *
       * @return {object} local_link_connection attribute object.
       * A value of null is returned if the local-link-connection
       * information is incomplete.
       */
      $toPortAttr: function() {
        var attr = {};
        if (this.port_id.hasValue() &&
            this.switch_id.hasValue()) {
          attr.port_id = this.port_id.value;
          attr.switch_id = this.switch_id.value;

          if (this.switch_info.hasValue()) {
            attr.switch_info = this.switch_info.value;
          }
        }
        return attr;
      },

      /**
       * dis/enable the local-link-connection form fields
       *
       * @param {boolean} disabled - True if the local-link-connection form
       * fields should be disabled
       * @param {string} reason - Optional reason for the state change
       * @return {void}
       */
      $setDisabled: function(disabled, reason) {
        angular.forEach(this, function(item) {
          if (item instanceof Field) {
            item.disabled = disabled;
            item.info = reason;
          }
        });
      }
    };

    /**
     * Cancel the modal
     *
     * @return {void}
     */
    ctrl.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };

    /**
     * Delete a port metadata property
     *
     * @param {string} propertyName - Name of the property
     * @return {void}
     */
    ctrl.deleteExtra = function(propertyName) {
      delete ctrl.port.extra[propertyName];
    };

    /**
     * Check whether the specified port metadata property already exists
     *
     * @param {string} propertyName - Name of the metadata property
     * @return {boolean} True if the property already exists,
     * otherwise false
     */
    ctrl.checkExtraUnique = function(propertyName) {
      return !(propertyName in ctrl.port.extra);
    };
  }
})();
