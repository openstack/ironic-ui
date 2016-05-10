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
   * Controller used to enroll a node in the Ironic database
   */
  angular
    .module('horizon.dashboard.admin.ironic')
    .controller('EnrollNodeController', EnrollNodeController);

  EnrollNodeController.$inject = [
    '$rootScope',
    '$modalInstance',
    'horizon.app.core.openstack-service-api.ironic',
    'horizon.dashboard.admin.ironic.enroll-node.service',
    '$log'
  ];

  function EnrollNodeController($rootScope,
                                $modalInstance,
                                ironic,
                                enrollNodeService,
                                $log) {
    var ctrl = this;

    ctrl.drivers = null;
    ctrl.loadingDriverProperties = false;
    // Object containing the set of properties associated with the currently
    // selected driver
    ctrl.driverProperties = null;

    // Paramater object that defines the node to be enrolled
    ctrl.node = {
      name: null,
      driver: null,
      driver_info: {},
      properties: {},
      extra: {}
    };

    init();

    function init() {
      loadDrivers();
    }

    /**
     * Get the list of currently active Ironic drivers
     *
     * @return {void}
     */
    function loadDrivers() {
      ironic.getDrivers().then(function(response) {
        ctrl.drivers = response.data.items;
      });
    }

    /**
     * Get the properties associated with a specified driver
     *
     * @param {string} driverName - Name of driver
     * @return {void}
     */
    ctrl.loadDriverProperties = function(driverName) {
      ctrl.node.driver = driverName;
      ctrl.node.driver_info = {};

      ctrl.loadingDriverProperties = true;
      ctrl.driverProperties = null;

      ironic.getDriverProperties(driverName).then(function(response) {
        ctrl.driverProperties = {};
        angular.forEach(response.data, function(desc, property) {
          ctrl.driverProperties[property] =
            new enrollNodeService.DriverProperty(property,
                                                 desc,
                                                 ctrl.driverProperties);
        });
        ctrl.loadingDriverProperties = false;
      });
    };

    /**
     * Cancel the node enrollment process
     *
     * @return {void}
     */
    ctrl.cancel = function() {
      $modalInstance.dismiss('cancel');
    };

    /**
     * Enroll the defined node
     *
     * @return {void}
     */
    ctrl.enroll = function() {
      $log.debug(">> EnrollNodeController.enroll()");
      angular.forEach(ctrl.driverProperties, function(property, name) {
        $log.debug(name +
                   ", required = " + property.isRequired() +
                   ", active = " + property.isActive() +
                   ", input value = " + property.inputValue);
        if (property.isActive() && property.inputValue) {
          $log.debug("Setting driver property " + name + " to " +
                     property.inputValue);
          ctrl.node.driver_info[name] = property.inputValue;
        }
      });

      ironic.createNode(ctrl.node).then(
        function() {
          $modalInstance.close();
          $rootScope.$emit('ironic-ui:new-node');
        },
        function() {
          // No additional error processing for now
        });
      $log.debug("<< EnrollNodeController.enroll()");
    };

    /**
     * Delete a node property
     *
     * @param {string} propertyName - Name of the property
     * @return {void}
     */
    ctrl.deleteProperty = function(propertyName) {
      delete ctrl.node.properties[propertyName];
    };

    /**
     * Check whether the specified node property already exists
     *
     * @param {string} propertyName - Name of the property
     * @return {boolean} True if the property already exists,
     * otherwise false
     */
    ctrl.checkPropertyUnique = function(propertyName) {
      return !(propertyName in ctrl.node.properties);
    };

    /**
     * Delete a node metadata property
     *
     * @param {string} propertyName - Name of the property
     * @return {void}
     */
    ctrl.deleteExtra = function(propertyName) {
      delete ctrl.node.extra[propertyName];
    };

    /**
     * Check whether the specified node metadata property already exists
     *
     * @param {string} propertyName - Name of the metadata property
     * @return {boolean} True if the property already exists,
     * otherwise false
     */
    ctrl.checkExtraUnique = function(propertyName) {
      return !(propertyName in ctrl.node.extra);
    };
  }
})();
