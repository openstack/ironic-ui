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
    'horizon.framework.util.uuid.service',
    'horizon.dashboard.admin.ironic.validMacAddressPattern'
  ];

  function ironicBackendMockService($httpBackend,
                                    uuidService,
                                    validMacAddressPattern) {
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

    // Default port object.
    var defaultPort = {
      address: undefined,
      created_at: null,
      extra: {},
      internal_info: {},
      local_link_connection: {},
      node_uuid: undefined,
      portgroup_uuid: null,
      pxe_enabled: true,
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
      getImages: getImages,
      getPort: getPort
    };

    var responseCode = {
      SUCCESS: 200,
      EMPTY_RESPONSE: 204,
      BAD_QUERY: 400,
      RESOURCE_NOT_FOUND: 404,
      RESOURCE_CONFLICT: 409
    };

    // Dictionary of active nodes indexed by node-id (uuid and name)
    var nodes = {};

    // Dictionary of active ports indexed by port-uuid
    var ports = {};

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
     * @return {object|null} Node object, or null if the node could
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
          consolePort: getNextAvailableSystemPort(),
          ports: {} // Indexed by port-uuid
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
     * @return {object|null} Base node object, or null if the node
     *   does not exist.
     */
    function getNode(nodeId) {
      return angular.isDefined(nodes[nodeId]) ? nodes[nodeId].base : null;
    }

    /**
     * @description Get the console-url for a specified node.
     *
     * @param {string} nodeId - Uuid or name of the node.
     * @return {string|null} Console url if the console is enabled,
     *   null otherwise.
     */
    function nodeGetConsoleUrl(nodeId) {
      return nodes[nodeId].base.console_enabled
        ? service.params.consoleUrl + nodes[nodeId].consolePort
        : null;
    }

    /**
     * @description Test whether a mac address is being used by an
     *  existing port.
     *
     * @param {string} address - Mac address.
     * @return {boolean} True if the mac address is being used by
     *  another port, otherwise false.
     */
    function macAddressInUse(address) {
      for (var uuid in ports) {
        if (ports.hasOwnProperty(uuid) &&
            angular.isDefined(ports[uuid].address)) {
          if (ports[uuid].address === address) {
            return true;
          }
        }
      }
      return false;
    }

    /**
     * @description Create a backend managed port.
     *
     * @param {object} params - Dictionary of parameters that define
     *   the port to be created.
     * @return {object|null} Port object, or null if the port could
     *   not be created.
     */
    function createPort(params) {
      var port = null;
      var status = responseCode.BAD_QUERY;
      if (angular.isDefined(params.address) &&
          angular.isDefined(params.node_uuid) &&
          params.address.match(validMacAddressPattern) &&
          angular.isDefined(nodes[params.node_uuid])) {
        if (macAddressInUse(params.address)) {
          status = responseCode.RESOURCE_CONFLICT;
        } else {
          port = angular.copy(defaultPort);
          angular.forEach(params, function(value, key) {
            port[key] = value;
          });

          if (angular.isUndefined(port.uuid)) {
            port.uuid = uuidService.generate();
          }

          ports[port.uuid] = port;

          nodes[port.node_uuid].ports[port.uuid] = port;

          status = responseCode.SUCCESS;
        }
      }

      return [status, port];
    }

    /**
     * description Get a specified port.
     *
     * @param {string} portUuid - Uuid of the requested port.
     * @return {object|null} Port object, or null if the port
     *   does not exist.
     */
    function getPort(portUuid) {
      return angular.isDefined(ports[portUuid]) ? ports[portUuid] : null;
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
          return [node ? responseCode.SUCCESS : responseCode.BAD_QUERY, node];
        });

      // Delete node
      $httpBackend.whenDELETE(/\/api\/ironic\/nodes\/$/)
        .respond(function(method, url, data) {
          var nodeId = JSON.parse(data).node;
          var status = responseCode.RESOURCE_NOT_FOUND;
          if (angular.isDefined(nodes[nodeId])) {
            var node = nodes[nodeId].base;
            if (node.name !== null) {
              delete nodes[node.name];
              delete nodes[node.uuid];
            } else {
              delete nodes[nodeId];
            }
            status = responseCode.EMPTY_RESPONSE;
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
          delete nodes[node.name];
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
          var status = responseCode.RESOURCE_NOT_FOUND;
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
            status = responseCode.SUCCESS;
          }
          return [status, node];
        });

      // Get node
      $httpBackend.whenGET(/\/api\/ironic\/nodes\/([^\/]+)$/,
                           undefined,
                           ['nodeId'])
        .respond(function(method, url, data, headers, params) {
          if (angular.isDefined(nodes[params.nodeId])) {
            return [responseCode.SUCCESS, nodes[params.nodeId].base];
          } else {
            return [responseCode.RESOURCE_NOT_FOUND, null];
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
          return [responseCode.SUCCESS, info];
        });

      // Set console
      $httpBackend.whenPUT(/\/api\/ironic\/nodes\/(.+)\/states\/console/,
                           undefined,
                           undefined,
                           ['nodeId'])
        .respond(function(method, url, data, headers, params) {
          data = JSON.parse(data);
          nodes[params.nodeId].base.console_enabled = data.enabled;
          return [responseCode.SUCCESS, {}];
        });

      // Get the ports belonging to a specified node
      $httpBackend.whenGET(/\/api\/ironic\/ports/)
        .respond(responseCode.SUCCESS, []);

      // Get boot device
      $httpBackend.whenGET(/\/api\/ironic\/nodes\/([^\/]+)\/boot_device$/,
                           undefined,
                           ['nodeId'])
        .respond(responseCode.SUCCESS, service.params.bootDevice);

      // Validate the interfaces associated with a specified node
      $httpBackend.whenGET(/\/api\/ironic\/nodes\/([^\/]+)\/validate$/,
                           undefined,
                           ['nodeId'])
        .respond(responseCode.SUCCESS, []);

      // Get the currently available drivers
      $httpBackend.whenGET(/\/api\/ironic\/drivers\/$/)
        .respond(responseCode.SUCCESS, {drivers: drivers});

      // Get driver properties
      $httpBackend.whenGET(/\/api\/ironic\/drivers\/([^\/]+)\/properties$/,
                           undefined,
                           ['driverName'])
        .respond(responseCode.SUCCESS, []);

      // Get glance images
      $httpBackend.whenGET(/\/api\/glance\/images/)
        .respond(responseCode.SUCCESS, {items: images});

      // Create port
      $httpBackend.whenPOST(/\/api\/ironic\/ports\/$/)
        .respond(function(method, url, data) {
          return createPort(JSON.parse(data).port);
        });

      // Delete port
      $httpBackend.whenDELETE(/\/api\/ironic\/ports\/$/)
        .respond(function(method, url, data) {
          var portUuid = JSON.parse(data).port_uuid;
          var status = responseCode.RESOURCE_NOT_FOUND;
          if (angular.isDefined(ports[portUuid])) {
            delete ports[portUuid];
            status = responseCode.EMPTY_RESPONSE;
          }
          return [status, ""];
        });

      // Get ports
      $httpBackend.whenGET(/\/api\/ironic\/ports\/$/)
        .respond(function(method, url, data) {
          var nodeId = JSON.parse(data).node_id;
          var status = responseCode.RESOURCE_NOT_FOUND;
          var ports = [];
          if (angular.isDefined(nodes[nodeId])) {
            angular.forEach(nodes[nodeId].ports, function(port) {
              ports.push(port);
            });
            status = responseCode.SUCCESS;
          }
          return [status, {ports: ports}];
        });
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
