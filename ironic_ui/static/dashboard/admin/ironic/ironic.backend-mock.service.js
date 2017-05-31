/*
 * © Copyright 2015,2016 Hewlett Packard Enterprise Development Company LP
 * © Copyright 2016 Cray Inc.
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

(function () {
  'use strict';

  /**
   * @description Service that provides a mock for the Ironic backend.
   */

  angular
    .module('horizon.dashboard.admin.ironic')
    .factory('horizon.dashboard.admin.ironic.backend-mock.service',
             ironicBackendMockService);

  ironicBackendMockService.$inject = [
    '$httpBackend',
    'horizon.framework.util.uuid.service'
  ];

  function ironicBackendMockService($httpBackend, uuidService) {
    // Default node object.
    var defaultNode = {
      chassis_uuid: null,
      clean_step: {},
      console_enabled: false,
      driver: undefined,
      driver_info: {},
      driver_internal_info: {},
      extra: {},
      inspection_finished_at: null,
      inspection_started_at: null,
      instance_info: {},
      instance_uuid: null,
      last_error: null,
      maintenance: false,
      maintenance_reason: null,
      name: null,
      network_interface: "flat",
      power_state: null,
      properties: {},
      provision_state: "enroll",
      provision_updated_at: null,
      raid_config: {},
      reservation: null,
      resource_class: null,
      target_power_state: null,
      target_provision_state: null,
      target_raid_config: {},
      updated_at: null,
      uuid: undefined
    };

    // Value of the next available system port
    var nextAvailableSystemPort = 1024;

    // Additional service parameters
    var params = {
      // Currently, all nodes have the same boot device.
      bootDevice: {boot_device: 'pxe', persistent: true},
      // Console info
      consoleType: "shellinabox",
      consoleUrl: "http://localhost:",
      defaultDriver: "agent_ipmitool"
    };

    // List of supported drivers
    var drivers = [{name: params.defaultDriver}];

    // List of images
    var images = [];

    var service = {
      params: params,
      init: init,
      flush: flush,
      postTest: postTest,
      getNode: getNode,
      nodeGetConsoleUrl: nodeGetConsoleUrl,
      getDrivers: getDrivers,
      getImages: getImages
    };

    // Dictionary of active nodes indexed by node-id (uuid and name)
    var nodes = {};

    return service;

    /**
     * @description Get and reserve the next available system port.
     *
     * @return {int} Port number.
     */
    function getNextAvailableSystemPort() {
      return nextAvailableSystemPort++;
    }

    /**
     * @description Create a backend managed node.
     *
     * @param {object} params - Dictionary of parameters that define
     *   the node to be created.
     * @return {object | null} Node object, or null if the nde could
     *   not be created.
     */
    function createNode(params) {
      var node = null;

      if (angular.isDefined(params.driver)) {
        node = angular.copy(defaultNode);
        angular.forEach(params, function(value, key) {
          node[key] = value;
        });

        if (angular.isUndefined(node.uuid)) {
          node.uuid = uuidService.generate();
        }

        var backendNode = {
          base: node,
          consolePort: getNextAvailableSystemPort()
        };

        nodes[node.uuid] = backendNode;

        if (node.name !== null) {
          nodes[node.name] = backendNode;
        }
      }
      return node;
    }

    /**
     * description Get a specified node.
     *
     * @param {string} nodeId - Uuid or name of the requested node.
     * @return {object} Base node object.
     */
    function getNode(nodeId) {
      return angular.isDefined(nodes[nodeId]) ? nodes[nodeId].base : undefined;
    }

    /*
     * @description Get the console-url for a specified node.
     *
     * @param {string} nodeId - Uuid or name of the node.
     * @return {string} Console url if the console is enabled, null otherwise.
     */
    function nodeGetConsoleUrl(nodeId) {
      return nodes[nodeId].base.console_enabled
        ? service.params.consoleUrl + nodes[nodeId].consolePort
        : undefined;
    }

    /**
     * @description Initialize the Backend-Mock service.
     *   Create the handlers that intercept http requests.
     *
     * @return {void}
     */
    function init() {
      // Create node
      $httpBackend.whenPOST(/\/api\/ironic\/nodes\/$/)
        .respond(function(method, url, data) {
          var node = createNode(JSON.parse(data).node);
          return [node ? 200 : 400, node];
        });

      // Delete node
      $httpBackend.whenDELETE(/\/api\/ironic\/nodes\/$/)
        .respond(function(method, url, data) {
          var nodeId = JSON.parse(data).node;
          var status = 400;
          if (angular.isDefined(nodes[nodeId])) {
            var node = nodes[nodeId].base;
            if (node.name !== null) {
              delete nodes[node.name];
              delete nodes[node.uuid];
            } else {
              delete nodes[nodeId];
            }
            status = 204;
          }
          return [status, ""];
        });

      function _addItem(node, path, value) {
        var parts = path.substring(1).split("/");
        var leaf = parts.pop();
        var obj = node;
        for (var i = 0; i < parts.length; i++) {
          var part = parts[i];
          if (angular.isUndefined(obj[part])) {
            obj[part] = {};
          }
          obj = obj[part];
        }
        obj[leaf] = value;
      }

      function _removeItem(node, path) {
        var parts = path.substring(1).split("/");
        var leaf = parts.pop();
        var obj = node;
        for (var i = 0; i < parts.length; i++) {
          obj = obj[parts[i]];
        }
        delete obj[leaf];
      }

      function _replaceItem(node, path, value) {
        if (path === "/name" &&
            node.name !== null) {
          delete nodes[name];
          if (value !== null) {
            nodes[value] = node;
          }
        }

        var parts = path.substring(1).split("/");
        var leaf = parts.pop();
        var obj = node;
        for (var i = 0; i < parts.length; i++) {
          obj = obj[parts[i]];
        }
        obj[leaf] = value;
      }

      // Update node
      $httpBackend.whenPATCH(/\/api\/ironic\/nodes\/([^\/]+)$/,
                             undefined,
                             undefined,
                             ['nodeId'])
        .respond(function(method, url, data, headers, params) {
          var status = 400;
          var node = service.getNode(params.nodeId);
          if (angular.isDefined(node)) {
            var patch = JSON.parse(data).patch;
            angular.forEach(patch, function(operation) {
              switch (operation.op) {
                case "add":
                  _addItem(node, operation.path, operation.value);
                  break;
                case "remove":
                  _removeItem(node, operation.path);
                  break;
                case "replace":
                  _replaceItem(node, operation.path, operation.value);
                  break;
                default:
              }
            });
            status = 200;
          }
          return [status, node];
        });

      // Get node
      $httpBackend.whenGET(/\/api\/ironic\/nodes\/([^\/]+)$/,
                           undefined,
                           ['nodeId'])
        .respond(function(method, url, data, headers, params) {
          if (angular.isDefined(nodes[params.nodeId])) {
            return [200, nodes[params.nodeId].base];
          } else {
            return [400, null];
          }
        });

      // Get console
      $httpBackend.whenGET(/\/api\/ironic\/nodes\/(.+)\/states\/console/,
                           undefined,
                           ['nodeId'])
        .respond(function(method, url, data, headers, params) {
          var node = nodes[params.nodeId];
          var consoleEnabled = node.base.console_enabled;
          var consoleInfo = consoleEnabled
            ? {console_type: service.params.consoleType,
               url: service.params.consoleUrl + node.consolePort}
            : null;

          var info = {
            console_enabled: consoleEnabled,
            console_info: consoleInfo};
          return [200, info];
        });

      // Set console
      $httpBackend.whenPUT(/\/api\/ironic\/nodes\/(.+)\/states\/console/,
                           undefined,
                           undefined,
                           ['nodeId'])
        .respond(function(method, url, data, headers, params) {
          data = JSON.parse(data);
          nodes[params.nodeId].base.console_enabled = data.enabled;
          return [200, {}];
        });

      // Get the ports belonging to a specified node
      $httpBackend.whenGET(/\/api\/ironic\/ports/)
        .respond(200, []);

      // Get boot device
      $httpBackend.whenGET(/\/api\/ironic\/nodes\/([^\/]+)\/boot_device$/,
                           undefined,
                           ['nodeId'])
        .respond(200, service.params.bootDevice);

      // Validate the interfaces associated with a specified node
      $httpBackend.whenGET(/\/api\/ironic\/nodes\/([^\/]+)\/validate$/,
                           undefined,
                           ['nodeId'])
        .respond(200, []);

      // Get the currently available drivers
      $httpBackend.whenGET(/\/api\/ironic\/drivers\/$/)
        .respond(200, {drivers: drivers});

      // Get driver properties
      $httpBackend.whenGET(/\/api\/ironic\/drivers\/([^\/]+)\/properties$/,
                           undefined,
                           ['driverName'])
        .respond(200, []);

      // Get glance images
      $httpBackend.whenGET(/\/api\/glance\/images/)
        .respond(200, {items: images});
    }

    /**
     * @description Get the list of supported drivers
     *
     * @return {[]} Array of driver objects
     */
    function getDrivers() {
      return drivers;
    }

    /**
     * @description Get the list of images
     *
     * @return {[]} Array of image objects
     */
    function getImages() {
      return images;
    }

    /**
     * @description Flush pending requests
     *
     * @return {void}
     */
    function flush() {
      $httpBackend.flush();
    }

    /**
     * @description Post test verifications.
     *   This function should be called after completion of a unit test.
     *
     * @return {void}
     */
    function postTest() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    }
  }

}());
