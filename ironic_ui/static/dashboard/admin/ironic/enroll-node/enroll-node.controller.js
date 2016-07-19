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
    'horizon.dashboard.admin.ironic.events',
    'horizon.app.core.openstack-service-api.glance',
    'horizon.dashboard.admin.ironic.enroll-node.service',
    'horizon.dashboard.admin.ironic.validHostNamePattern',
    '$log'
  ];

  function EnrollNodeController($rootScope,
                                $modalInstance,
                                ironic,
                                ironicEvents,
                                glance,
                                enrollNodeService,
                                validHostNamePattern,
                                $log) {
    var ctrl = this;

    ctrl.validHostNameRegex = new RegExp(validHostNamePattern);
    ctrl.drivers = null;
    ctrl.images = null;
    ctrl.loadingDriverProperties = false;
    // Object containing the set of properties associated with the currently
    // selected driver
    ctrl.driverProperties = null;
    ctrl.driverPropertyGroups = null;

    // Parameter object that defines the node to be enrolled
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
      getImages();
    }

    /**
     * @description Get the list of currently active Ironic drivers
     *
     * @return {void}
     */
    function loadDrivers() {
      ironic.getDrivers().then(function(response) {
        ctrl.drivers = response.data.items;
      });
    }

    /**
     * @description Get the list of images from Glance
     *
     * @return {void}
     */
    function getImages() {
      glance.getImages().then(function(response) {
        ctrl.images = response.data.items;
      });
    }

    /**
     * @description Check whether a group contains required properties
     *
     * @param {DriverProperty[]} group - Property group
     * @return {boolean} Return true if the group contains required
     * properties, false otherwise
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
     * @param {array[]} groups - Array for driver property groups
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

    /**
     * @description Order driver properties in the form using the following
     * rules:
     *
     * (1) Properties that are related to one another should occupy adjacent
     * locations in the form
     *
     * (2) Required properties with no dependents should be located at the
     * top of the form
     *
     * @return {void}
     */
    ctrl._sortDriverProperties = function() {
      // Build dependency graph between driver properties
      var graph = new enrollNodeService.Graph();

      // Create vertices
      angular.forEach(ctrl.driverProperties, function(property, name) {
        graph.addVertex(name, property);
      });

      /* eslint-disable no-unused-vars */

      // Create edges
      angular.forEach(ctrl.driverProperties,
                      function(property, name) {
                        var activators = property.getActivators();
                        if (activators) {
                          angular.forEach(activators,
                                          function(unused, activatorName) {
                                            graph.addEdge(name, activatorName);
                                          });
                        }
                      });

      /* eslint-enable no-unused-vars */

      // Perform depth-first-search to find groups of related properties
      var groups = [];
      graph.dfs(
        function(vertexList, components) {
          // Sort properties so that those with the largest number of
          // immediate dependents are the top of the list
          vertexList.sort(function(vertex1, vertex2) {
            return vertex2.adjacents.length - vertex1.adjacents.length;
          });

          // Build component and add to list
          var component = new Array(vertexList.length);
          angular.forEach(vertexList, function(vertex, index) {
            component[index] = vertex.data;
          });
          components.push(component);
        },
        groups);
      groups.sort(compareDriverPropertyGroups);

      $log.debug("Found the following property groups: " +
                 driverPropertyGroupsToString(groups));
      return groups;
    };

    /**
     * @description Get the properties associated with a specified driver
     *
     * @param {string} driverName - Name of driver
     * @return {void}
     */
    ctrl.loadDriverProperties = function(driverName) {
      ctrl.node.driver = driverName;
      ctrl.node.driver_info = {};

      ctrl.loadingDriverProperties = true;
      ctrl.driverProperties = null;
      ctrl.driverPropertyGroups = null;

      ironic.getDriverProperties(driverName).then(function(response) {
        ctrl.driverProperties = {};
        angular.forEach(response.data, function(desc, property) {
          ctrl.driverProperties[property] =
            new enrollNodeService.DriverProperty(property,
                                                 desc,
                                                 ctrl.driverProperties);
        });
        ctrl.driverPropertyGroups = ctrl._sortDriverProperties();
        ctrl.loadingDriverProperties = false;
      });
    };

    /**
     * @description Cancel the node enrollment process
     *
     * @return {void}
     */
    ctrl.cancel = function() {
      $modalInstance.dismiss('cancel');
    };

    /**
     * @description Enroll the defined node
     *
     * @return {void}
     */
    ctrl.enroll = function() {
      $log.debug(">> EnrollNodeController.enroll()");
      angular.forEach(ctrl.driverProperties, function(property, name) {
        $log.debug(name +
                   ", required = " + property.isRequired() +
                   ", active = " + property.isActive() +
                   ", input-value = " + property.getInputValue() +
                   ", default-value = " + property.getDefaultValue());
        if (property.isActive() &&
            property.getInputValue() &&
            property.getInputValue() !== property.getDefaultValue()) {
          $log.debug("Setting driver property " + name + " to " +
                     property.inputValue);
          ctrl.node.driver_info[name] = property.inputValue;
        }
      });

      ironic.createNode(ctrl.node).then(
        function() {
          $modalInstance.close();
          $rootScope.$emit(ironicEvents.ENROLL_NODE_SUCCESS);
        },
        function() {
          // No additional error processing for now
        });
      $log.debug("<< EnrollNodeController.enroll()");
    };

    /**
     * @desription Delete a node property
     *
     * @param {string} propertyName - Name of the property
     * @return {void}
     */
    ctrl.deleteProperty = function(propertyName) {
      delete ctrl.node.properties[propertyName];
    };

    /**
     * @description Check whether the specified node property already exists
     *
     * @param {string} propertyName - Name of the property
     * @return {boolean} True if the property already exists,
     * otherwise false
     */
    ctrl.checkPropertyUnique = function(propertyName) {
      return !(propertyName in ctrl.node.properties);
    };

    /**
     * @description Delete a node metadata property
     *
     * @param {string} propertyName - Name of the property
     * @return {void}
     */
    ctrl.deleteExtra = function(propertyName) {
      delete ctrl.node.extra[propertyName];
    };

    /**
     * @description Check whether the specified node metadata property
     * already exists
     *
     * @param {string} propertyName - Name of the metadata property
     * @return {boolean} True if the property already exists,
     * otherwise false
     */
    ctrl.checkExtraUnique = function(propertyName) {
      return !(propertyName in ctrl.node.extra);
    };

    /**
     * @description Check whether a specified driver property is
     * currently active
     *
     * @param {string} property - Driver property
     * @return {boolean} True if the property is active, false otherwise
     */
    ctrl.isDriverPropertyActive = function(property) {
      return property.isActive();
    };
  }
})();
