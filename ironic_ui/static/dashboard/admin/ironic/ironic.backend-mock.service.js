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
    'horizon.dashboard.admin.ironic.validMacAddressPattern',
    'horizon.dashboard.admin.ironic.driverInterfaces'
  ];

  function ironicBackendMockService($httpBackend,
                                    uuidService,
                                    validMacAddressPattern,
                                    driverInterfaces) {
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
      boot_interface: null,
      console_interface: null,
      deploy_interface: null,
      inspect_interface: null,
      network_interface: "flat",
      power_interface: null,
      raid_interface: null,
      storage_interface: null,
      vendor_interface: null,
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

    // Default portgroup object.
    var defaultPortgroup = {
      address: null,
      created_at: null,
      extra: {},
      internal_info: {},
      mode: "active-backup",
      name: null,
      node_uuid: undefined,
      ports: [],
      properties: {},
      standalone_ports_supported: true,
      updated_at: null,
      uuid: undefined
    };

    var drivers = {
      ipmi: {
        details: {
          default_boot_interface: "pxe",
          default_console_interface: "no-console",
          default_deploy_interface: "iscsi",
          default_inspect_interface: "no-inspect",
          default_management_interface: "ipmitool",
          default_network_interface: "flat",
          default_power_interface: "ipmitool",
          default_raid_interface: "no-raid",
          default_vendor_interface: "ipmitool",
          enabled_boot_interfaces: ["pxe"],
          enabled_console_interfaces: ["no-console"],
          enabled_deploy_interfaces: ["iscsi", "direct"],
          enabled_inspect_interfaces: ["no-inspect"],
          enabled_management_interfaces: ["ipmitool"],
          enabled_network_interfaces: ["flat", "noop"],
          enabled_power_interfaces: ["ipmitool"],
          enabled_raid_interfaces: ["no-raid", "agent"],
          enabled_vendor_interfaces: ["ipmitool", "no-vendor"],
          hosts: ["testhost"],
          name: "ipmi",
          type: "dynamic"
        },
        properties: {
          deploy_kernel: "UUID (from Glance)",
          deploy_ramdisk: "UUID (from Glance)"
        }
      }
    };

    // Value of the next available system port
    var nextAvailableSystemPort = 1024;

    // Additional service parameters
    var params = {
      // Console info
      consoleType: "shellinabox",
      consoleUrl: "http://localhost:",
      defaultDriver: "ipmi",
      supportedBootDevices: ["pxe", "bios", "safe"]
    };

    // List of images
    var images = [];

    //list of interfaces returned by ironic node_validate API
    var defaultNodeInterfaces = [
      {
        interface: 'network',
        result: 'True',
        reason: ' '
      }
    ];

    var service = {
      params: params,
      init: init,
      flush: flush,
      postTest: postTest,
      getNode: getNode,
      getNodeBootDevice: getNodeBootDevice,
      getNodeSupportedBootDevices: getNodeSupportedBootDevices,
      nodeGetConsoleUrl: nodeGetConsoleUrl,
      getBaseDrivers: getBaseDrivers,
      getDrivers: getDrivers,
      getImages: getImages,
      getPort: getPort,
      getPortgroup: getPortgroup,
      defaultNodeInterfaces: defaultNodeInterfaces,
      defaultNode: defaultNode
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

    // Dictionary of active portgroups indexed by portgroup-uuid
    var portgroups = {};

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

      if (angular.isDefined(params.driver) &&
          angular.isDefined(drivers[params.driver])) {
        node = angular.copy(defaultNode);

        // For dynamic drivers, initialize interfaces based on
        // default values
        var details = drivers[params.driver].details;
        if (details.type === 'dynamic') {
          angular.forEach(driverInterfaces, function(interfaceName) {
            var defaultInterface = 'default_' + interfaceName + '_interface';
            if (angular.isDefined(details[defaultInterface])) {
              node[interfaceName + '_interface'] = details[defaultInterface];
            }
          });
        }

        angular.forEach(params, function(value, key) {
          node[key] = value;
        });

        if (angular.isUndefined(node.uuid)) {
          node.uuid = uuidService.generate();
        }

        var backendNode = {
          base: node,
          consolePort: getNextAvailableSystemPort(),
          ports: {}, // Indexed by port-uuid
          portgroups: {}, // Indexed by portgroup-uuid
          supportedBootDevices: service.params.supportedBootDevices,
          bootDevice: {
            boot_device: service.params.supportedBootDevices[0],
            persistent: true
          }
        };

        nodes[node.uuid] = backendNode;

        if (node.name !== null) {
          nodes[node.name] = backendNode;
        }
      }
      return node;
    }

    /**
     * @description Get a specified node.
     *
     * @param {string} nodeId - Uuid or name of the requested node.
     * @return {object|null} Base node object, or null if the node
     *   does not exist.
     */
    function getNode(nodeId) {
      return angular.isDefined(nodes[nodeId]) ? nodes[nodeId].base : null;
    }

    /**
     * @description Get the boot device of a specified node.
     *
     * @param {string} nodeId - Uuid or name of the requested node.
     * @return {object} Boot device.
     */
    function getNodeBootDevice(nodeId) {
      return angular.isDefined(nodes[nodeId])
        ? nodes[nodeId].bootDevice : undefined;
    }

    /**
     * @description Get the list of supported boot devices of
     *   a specified node.
     *
     * @param {string} nodeId - Uuid or name of the requested node.
     * @return {string []} List of supported boot devices.
     */
    function getNodeSupportedBootDevices(nodeId) {
      return angular.isDefined(nodes[nodeId])
        ? nodes[nodeId].supportedBootDevices : undefined;
    }

    /*
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
     * @description Create a portgroup.
     *   This function is not yet fully implemented.
     *
     * @param {object} params - Dictionary of parameters that define
     *   the portgroup to be created.
     * @return {object|null} Portgroup object, or null if the port could
     *   not be created.
     */
    function createPortgroup(params) {
      var portgroup = null;
      var status = responseCode.BAD_QUERY;
      if (angular.isDefined(nodes[params.node_uuid])) {
        if (angular.isDefined(params.name) &&
            params.name !== null &&
            angular.isDefined(portgroups[params.name])) {
          status = responseCode.RESOURCE_CONFLICT;
        } else {
          portgroup = angular.copy(defaultPortgroup);
          angular.forEach(params, function(value, key) {
            portgroup[key] = value;
          });

          if (angular.isUndefined(portgroup.uuid)) {
            portgroup.uuid = uuidService.generate();
          }

          portgroups[portgroup.uuid] = portgroup;
          if (portgroup.name !== null) {
            portgroups[portgroup.name] = portgroup;
          }

          nodes[portgroup.node_uuid].portgroups[portgroup.uuid] = portgroup;
        }

        status = responseCode.SUCCESS;
      }

      return [status, portgroup];
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
     * description Get a specified portgroup.
     *
     * @param {string} portgroupId - Uuid or name of the requested portgroup.
     * @return {object|null} Portgroup object, or null if the portgroup
     *   does not exist.
     */
    function getPortgroup(portgroupId) {
      return angular.isDefined(portgroups[portgroupId])
        ? portgroups[portgroupId] : null;
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
      $httpBackend.whenDELETE(/\/api\/ironic\/nodes\/([^\/]+)$/,
                              undefined,
                              ['nodeId'])
        .respond(function(method, url, data, headers, params) {
          var nodeId = params.nodeId;
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

      function _addItem(obj, path, value) {
        var pathNames = path.substring(1).split("/");
        var leaf = pathNames.pop();
        var part = obj;
        for (var i = 0; i < pathNames.length; i++) {
          var name = pathNames[i];
          if (angular.isUndefined(part[name])) {
            part[name] = {};
          }
          part = part[name];
        }
        part[leaf] = value;
      }

      function _removeItem(obj, path) {
        var pathNames = path.substring(1).split("/");
        var leaf = pathNames.pop();
        var part = obj;
        for (var i = 0; i < pathNames.length; i++) {
          part = part[pathNames[i]];
        }
        delete part[leaf];
      }

      function _replaceItem(obj, path, value, collection) {
        // Special handling for changing the name of an object
        // that is stored in a name-indexed collection.
        if (path === "/name" && obj.name !== null) {
          if (angular.isDefined(collection)) {
            delete collection[obj.name];
            if (value !== null) {
              collection[value] = obj;
            }
          }
        }

        var pathNames = path.substring(1).split("/");
        var leaf = pathNames.pop();
        var part = obj;
        for (var i = 0; i < pathNames.length; i++) {
          part = part[pathNames[i]];
        }
        part[leaf] = value;
      }

      /**
       * @description Apply a patch to a specified object.
       *
       * @param {object} obj - Object to be patched, e.g. node, port, ...
       * @param {object} patch - Patch object.
       * @param {object} collection - Optional. Collection to which the
       *  object belongs. Only required if the collection indexes the
       *  object by name.
       * @return {void}
       */
      function patchObject(obj, patch, collection) {
        angular.forEach(patch, function(operation) {
          switch (operation.op) {
            case "add":
              _addItem(obj, operation.path, operation.value);
              break;
            case "remove":
              _removeItem(obj, operation.path);
              break;
            case "replace":
              _replaceItem(obj, operation.path, operation.value, collection);
              break;
            default:
          }
        });
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
            patchObject(node, JSON.parse(data).patch, nodes);
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

      // Get boot device
      $httpBackend.whenGET(/\/api\/ironic\/nodes\/([^\/]+)\/boot_device$/,
                           undefined,
                           ['nodeId'])
        .respond(function(method, url, data, headers, params) {
          if (angular.isDefined(nodes[params.nodeId])) {
            return [responseCode.SUCCESS, nodes[params.nodeId].bootDevice];
          } else {
            return [responseCode.BAD_QUERY, null];
          }
        });

      // Get supported boot devices
      $httpBackend.whenGET(
          /\/api\/ironic\/nodes\/([^\/]+)\/boot_device\/supported$/,
          undefined,
          ['nodeId'])
        .respond(function(method, url, data, headers, params) {
          if (angular.isDefined(nodes[params.nodeId])) {
            return [responseCode.SUCCESS,
                    nodes[params.nodeId].supportedBootDevices];
          } else {
            return [responseCode.BAD_QUERY, null];
          }
        });

      // Set boot device
      $httpBackend.whenPUT(/\/api\/ironic\/nodes\/(.+)\/boot_device/,
                           undefined,
                           undefined,
                           ['nodeId'])
        .respond(function(method, url, data, headers, params) {
          data = JSON.parse(data);
          var status = responseCode.RESOURCE_NOT_FOUND;
          if (angular.isDefined(nodes[params.nodeId])) {
            var node = nodes[params.nodeId];
            if (node.supportedBootDevices.indexOf(data.boot_device) !== -1) {
              node.bootDevice.boot_device = data.boot_device;
              if (angular.isDefined(data.persistent)) {
                node.bootDevice.persistent = data.persistent;
              }
              status = responseCode.SUCCESS;
            }
          }
          return [status, null];
        });

      // Set RAID config
      $httpBackend.whenPUT(/\/api\/ironic\/nodes\/(.+)\/states\/raid/,
                           undefined,
                           undefined,
                           ['nodeId'])
        .respond(function(method, url, data, headers, params) {
          data = JSON.parse(data);
          var status = responseCode.RESOURCE_NOT_FOUND;
          if (angular.isDefined(nodes[params.nodeId])) {
            var node = nodes[params.nodeId];
            if (angular.isDefined(data.target_raid_config)) {
              node.base.target_raid_config = data.target_raid_config;
              status = responseCode.SUCCESS;
            }
          }
          return [status, null];
        });

      // Inject NMI
      $httpBackend.whenPUT(/\/api\/ironic\/nodes\/(.+)\/management\/inject_nmi/,
                           undefined,
                           undefined,
                           ['nodeId'])
        .respond(function(method, url, data, headers, params) {
          var status, response;
          if (angular.isDefined(nodes[params.nodeId])) {
            status = responseCode.EMPTY_RESPONSE;
            response = '';
          } else {
            status = responseCode.INTERNAL_SERVER_ERROR;
            response = 'Node ' + params.nodeId +
              ' could not be found. (HTTP 404)';
          }
          return [status, response];
        });

      // Validate the interfaces associated with a specified node
      $httpBackend.whenGET(/\/api\/ironic\/nodes\/([^\/]+)\/validate$/,
                           undefined,
                           ['nodeId'])
        .respond(responseCode.SUCCESS, defaultNodeInterfaces);

      // Get the currently available drivers
      $httpBackend.whenGET(/\/api\/ironic\/drivers\/$/)
        .respond(function() {
          return [responseCode.SUCCESS,
                  {drivers: service.getBaseDrivers()}];
        });

      // Get driver properties
      $httpBackend.whenGET(/\/api\/ironic\/drivers\/([^\/]+)\/properties$/,
                           undefined,
                           ['driverName'])
        .respond(function(method, url, data, headers, params) {
          return [responseCode.SUCCESS,
                  drivers[params.driverName].properties];
        });

      // Get driver details
      $httpBackend.whenGET(/\/api\/ironic\/drivers\/([^\/]+)$/,
                           undefined,
                           ['driverName'])
        .respond(function(method, url, data, headers, params) {
          return [responseCode.SUCCESS,
                  drivers[params.driverName].details];
        });

      // Get glance images
      $httpBackend.whenGET(/\/api\/glance\/images/)
        .respond(responseCode.SUCCESS, {items: images});

      // Create port
      $httpBackend.whenPOST(/\/api\/ironic\/ports\/$/)
        .respond(function(method, url, data) {
          return createPort(JSON.parse(data).port);
        });

      // Delete port
      $httpBackend.whenDELETE(/\/api\/ironic\/ports\/([^\/]+)$/,
                              undefined,
                              ['portUuid'])
        .respond(function(method, url, data, headers, params) {
          var portUuid = params.portUuid;
          var status = responseCode.RESOURCE_NOT_FOUND;
          if (angular.isDefined(ports[portUuid])) {
            delete ports[portUuid];
            status = responseCode.EMPTY_RESPONSE;
          }
          return [status, ""];
        });

      // Update port
      $httpBackend.whenPATCH(/\/api\/ironic\/ports\/([^\/]+)$/,
                             undefined,
                             undefined,
                             ['portUuid'])
        .respond(function(method, url, data, headers, params) {
          var status = responseCode.RESOURCE_NOT_FOUND;
          var port = service.getPort(params.portUuid);
          if (angular.isDefined(port)) {
            patchObject(port, JSON.parse(data).patch);
            status = responseCode.SUCCESS;
          }
          return [status, port];
        });

      // Get the ports associated with a node
      $httpBackend.whenGET(/\/api\/ironic\/nodes\/([^\/]+)\/ports\/detail$/,
                           undefined,
                           ['nodeId'])
        .respond(function(method, url, data, header, params) {
          var nodeId = params.nodeId;
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

      // Create portgroup
      $httpBackend.whenPOST(/\/api\/ironic\/portgroups$/)
        .respond(function(method, url, data) {
          return createPortgroup(JSON.parse(data));
        });

      // Get the portgroups associated with a node
      $httpBackend.whenGET(/\/api\/ironic\/nodes\/(.+)\/portgroups/,
                           undefined,
                           ['nodeId'])
        .respond(function(method, url, data, header, params) {
          var status = responseCode.RESOURCE_NOT_FOUND;
          var portgroups = [];
          if (angular.isDefined(nodes[params.nodeId])) {
            angular.forEach(nodes[params.nodeId].portgroups,
                            function(portgroup) {
                              portgroups.push(portgroup);
                            });
            status = responseCode.SUCCESS;
          }
          return [status, {portgroups: portgroups}];
        });

      // Delete portgroup.
      $httpBackend.whenDELETE(/\/api\/ironic\/portgroups\/([^\/]+)$/,
                              undefined,
                             ['portgroupId'])
        .respond(function() {
          var portgroupId = params.portgroup_id;
          var status = responseCode.RESOURCE_NOT_FOUND;
          if (angular.isDefined(portgroups[portgroupId])) {
            var portgroup = portgroups[portgroupId];
            if (portgroup.name !== null) {
              delete portgroups[portgroup.name];
              delete portgroups[portgroup.uuid];
            } else {
              delete portgroups[portgroupId];
            }
            status = responseCode.EMPTY_RESPONSE;
          }
          return [status, ""];
        });

      // Update portgroup
      $httpBackend.whenPATCH(/\/api\/ironic\/portgroups\/([^\/]+)$/,
                             undefined,
                             undefined,
                             ['portgroupId'])
        .respond(function(method, url, data, headers, params) {
          var status = responseCode.RESOURCE_NOT_FOUND;
          var portgroup = service.getPortgroup(params.portgroupId);
          if (angular.isDefined(portgroup)) {
            patchObject(portgroup, JSON.parse(data).patch, portgroups);
            status = responseCode.SUCCESS;
          }
          return [status, portgroup];
        });

      // Get portgroup ports
      $httpBackend.whenGET(/\/api\/ironic\/portgroups\/([^\/]+)\/ports$/,
                           undefined,
                           ['portgroupId'])
        .respond(function(method, url, data, headers, params) {
          var ports = [];
          var status = responseCode.RESOURCE_NOT_FOUND;
          if (angular.isDefined(portgroups[params.portgroupId])) {
            var portgroup = portgroups[params.portgroupId];
            var node = nodes[portgroup.node_uuid];
            angular.forEach(node.ports, function(port) {
              if (port.portgroup_uuid === portgroup.uuid) {
                ports.push(port);
              }
            });
            status = responseCode.SUCCESS;
          }
          return [status, {ports: ports}];
        });
    } // init()

    /**
     * @description Get the map of supported drivers
     *
     * @return {Object} Dictionary of driver objects
     */
    function getDrivers() {
      return drivers;
    }

    /**
     * @description Get list of available drivers
     *
     * @return {[]} List of drivers. Each driver contains name
     *              and type properties.
     */
    function getBaseDrivers() {
      var driverList = [];
      angular.forEach(drivers, function(driver) {
        driverList.push({name: driver.details.name,
                         type: driver.details.type});
      });
      return driverList;
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
  } // ironicBackendMockService()
})();
