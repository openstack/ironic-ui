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
   * Controller used to support operations on an Ironic node
   */
  angular
    .module('horizon.dashboard.admin.ironic')
    .controller('BaseNodeController', BaseNodeController);

  BaseNodeController.$inject = [
    '$uibModalInstance',
    'horizon.app.core.openstack-service-api.ironic',
    'horizon.app.core.openstack-service-api.glance',
    'horizon.dashboard.admin.ironic.form-field.service',
    'horizon.dashboard.admin.ironic.base-node.service',
    'horizon.dashboard.admin.ironic.driver-property.service',
    'horizon.dashboard.admin.ironic.graph.service',
    'horizon.dashboard.admin.ironic.validHostNamePattern',
    'horizon.dashboard.admin.ironic.driverInterfaces',
    '$log',
    '$q',
    'ctrl'
  ];

  function BaseNodeController($uibModalInstance,
                              ironic,
                              glance,
                              formFieldService,
                              baseNodeService,
                              driverPropertyService,
                              graphService,
                              validHostNamePattern,
                              driverInterfaces,
                              $log,
                              $q,
                              ctrl) {
    ctrl.validHostNameRegex = new RegExp(validHostNamePattern);
    ctrl.drivers = null;
    ctrl.images = null;
    ctrl.loadingDriverProperties = false;
    ctrl.driverType = null;
    // Object containing the set of properties associated with the currently
    // selected driver
    ctrl.driverProperties = null;
    ctrl.driverPropertyGroups = null;
    // Dictionary of form-fields for supported interfaces indexed by interface
    // name for the currently selected driver
    ctrl.driverInterfaceFields = {};

    ctrl.modalTitle = gettext("Node");
    ctrl.submitButtonTitle = gettext("Submit");

    /* A property-collection is a set of properties that will be displayed
       in the node view as a minimal browser ui that supports:
       - adding new properties
       - displaying the list of properties in the set
       - changing the value of properties

       Collection attributes:
                  id: Name of the property inside the node object that is used
                      to store the collection.
              formId: Name of the controller variable that can be used to
                      access the property collection form.
              prompt: Label used to prompt the user to add properties
                      to the collection.
         placeholder: Label used to guide the user in providiing property
                      values.
    */
    ctrl.propertyCollections = [
      {id: "properties",
       formId: "properties_form",
       title: gettext("Properties"),
       addPrompt: gettext("Add Property"),
       placeholder: gettext("Property Name")
      },
      {id: "extra",
       formId: "extra_form",
       title: gettext("Extras"),
       addPrompt: gettext("Add Extra"),
       placeholder: gettext("Extra Property Name")
      }];

    // Node object suitable for Ironic api
    ctrl.node = {
      name: null,
      driver: null,
      driver_info: {},
      resource_class: null
    };

    // Initialize hardware interfaces
    angular.forEach(driverInterfaces, function(interfaceName) {
      ctrl.node[interfaceName + '_interface'] = null;
    });

    angular.forEach(ctrl.propertyCollections, function(collection) {
      ctrl.node[collection.id] = {};
    });

    /**
     * @description Get the list of currently active Ironic drivers
     *
     * @return {void}
     */
    ctrl._loadDrivers = function() {
      return ironic.getDrivers().then(function(drivers) {
        ctrl.drivers = drivers;
      });
    };

    /**
     * @description Get the list of images from Glance
     *
     * @return {void}
     */
    ctrl._getImages = function() {
      glance.getImages().then(function(response) {
        ctrl.images = response.data.items;
      });
    };

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
     * @return {[]} Ordered list of groups of strongly related properties
     */
    ctrl._sortDriverProperties = function() {
      // Build dependency graph between driver properties
      var graph = new graphService.Graph();

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
      groups.sort(baseNodeService.compareDriverPropertyGroups);

      $log.debug("Found the following property groups: " +
                 baseNodeService.driverPropertyGroupsToString(groups));
      return groups;
    };

    /**
     * @description Get the properties associated with a specified driver
     *
     * @param {string} driverName - Name of driver
     * @return {void}
     */
    ctrl._loadDriverProperties = function(driverName) {
      ctrl.node.driver = null;
      ctrl.node.driver_info = {};

      ctrl.loadingDriverProperties = true;
      ctrl.driverProperties = null;
      ctrl.driverPropertyGroups = null;

      return ironic.getDriverProperties(driverName).then(function(properties) {
        ctrl.node.driver = driverName;
        ctrl.driverProperties = {};
        angular.forEach(properties, function(desc, property) {
          ctrl.driverProperties[property] =
            new driverPropertyService.DriverProperty(property,
                                                     desc,
                                                     ctrl.driverProperties);
        });
        ctrl.driverPropertyGroups = ctrl._sortDriverProperties();
        ctrl.loadingDriverProperties = false;
      });
    };

    /**
     * @description Cancel the current node operation
     *
     * @return {void}
     */
    ctrl.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };

    /**
     * @description Check whether the specified property already exists
     *
     * @param {string} collectionId - Collection ID
     * @param {string} propertyName - Name of the property
     * @return {boolean} True if the property already exists,
     * otherwise false
     */
    ctrl.collectionCheckPropertyUnique = function(collectionId, propertyName) {
      return !(propertyName in ctrl.node[collectionId]);
    };

    /**
     * @description Delete a node metadata property
     *
     * @param {string} collectionId - Collection ID
     * @param {string} propertyName - Name of the property
     * @return {void}
     */
    ctrl.collectionDeleteProperty = function(collectionId, propertyName) {
      delete ctrl.node[collectionId][propertyName];
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

    /**
     * @description Check whether the node definition form is ready for
     *              to be submitted.
     *
     * @return {boolean} True if the form is ready to be submitted,
     *                   otherwise false.
     */
    ctrl.readyToSubmit = function() {
      var ready = true;
      if (ctrl.driverProperties) {
        for (var i = 0; i < ctrl.propertyCollections.length; i++) {
          var collection = ctrl.propertyCollections[i];
          if (ctrl[collection.formId].$invalid) {
            ready = false;
            break;
          }
        }
      } else {
        ready = false;
      }
      return ready;
    };

    /**
     * @description Load details for a specified driver.
     *   Includes driver type and supported interfaces.
     *
     * @param {string} driverName - driver name
     * @return {void}
     */
    ctrl._loadDriverDetails = function(driverName) {
      // Re-initialize driver related properties
      ctrl.driverType = null;
      angular.forEach(driverInterfaces, function(interfaceName) {
        ctrl.node[interfaceName + '_interface'] = null;
      });

      ctrl.driverInterfaceFields = {};
      return ironic.getDriverDetails(driverName).then(function(details) {
        ctrl.driverType = details.type;

        // Extract interface information for dynamic drivers
        angular.forEach(driverInterfaces, function(interfaceName) {
          var enabled = 'enabled_' + interfaceName + '_interfaces';
          if (angular.isDefined(details[enabled]) && details[enabled] !== null) {
            var options = [];
            angular.forEach(details[enabled], function(value) {
              options.push({label: value, value: value});
            });

            ctrl.driverInterfaceFields[interfaceName] =
              new formFieldService.FormField(
                {type: 'radio',
                 id: interfaceName,
                 title: interfaceName,
                 options: options,
                 value: details['default_' + interfaceName + '_interface']});
          }
        });
      });
    };

    /**
     * @description Load a specified driver.
     *
     * @param {string} driverName - driver name
     * @return {promise} Promise that completes
     *  when both properties and details are loaded.
     */
    ctrl.loadDriver = function(driverName) {
      var promises = [];
      promises.push(ctrl._loadDriverProperties(driverName));
      promises.push(ctrl._loadDriverDetails(driverName));
      return $q.all(promises);
    };
  }
})();
