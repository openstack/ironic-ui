/*
 * © Copyright 2015,2016 Hewlett Packard Enterprise Development Company LP
 * © Copyright 2016 Cray Inc.
 * Copyright 2017 Intel Corporation
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

  angular
    .module('horizon.app.core.openstack-service-api')
    .factory('horizon.app.core.openstack-service-api.ironic', ironicAPI);

  ironicAPI.$inject = [
    '$q',
    'horizon.framework.util.http.service',
    'horizon.framework.widgets.toast.service',
    'horizon.dashboard.admin.ironic.node-error.service'
  ];

  /**
   * @description Service that provides access to the Ironic client API
   *
   * @param {object} $q - Promise provider
   * @param {object} apiService - HTTP service
   * @param {object} toastService - User message service
   * @param {object} nodeErrorService - Node error service
   * @return {object} Ironic API service
   */
  function ironicAPI($q, apiService, toastService, nodeErrorService) {
    var service = {
      createNode: createNode,
      createPort: createPort,
      deleteNode: deleteNode,
      deletePort: deletePort,
      getDrivers: getDrivers,
      getDriverProperties: getDriverProperties,
      getNode: getNode,
      getNodes: getNodes,
      getPortsWithNode: getPortsWithNode,
      getBootDevice: getBootDevice,
      getSupportedBootDevices: getSupportedBootDevices,
      nodeGetConsole: nodeGetConsole,
      nodeSetConsoleMode: nodeSetConsoleMode,
      nodeSetMaintenance: nodeSetMaintenance,
      nodeSetBootDevice: nodeSetBootDevice,
      nodeSetPowerState: nodeSetPowerState,
      setNodeProvisionState: setNodeProvisionState,
      updateNode: updateNode,
      updatePort: updatePort,
      updatePortgroup: updatePortgroup,
      validateNode: validateNode,
      createPortgroup: createPortgroup,
      getPortgroups: getPortgroups,
      deletePortgroup: deletePortgroup,
      getPortgroupPorts: getPortgroupPorts
    };

    return service;

    /**
     * @description Retrieve a list of nodes
     * http://developer.openstack.org/api-ref/baremetal/?
     * expanded=create-node-detail#list-nodes-detailed
     *
     * @return {promise} Node collection in JSON
     */
    function getNodes() {
      return apiService.get('/api/ironic/nodes/')
        .then(function(response) {
          angular.forEach(response.data.nodes, function(node) {
            nodeErrorService.checkNodeError(node);
          });
          return response.data.nodes;
        })
        .catch(function(response) {
          var msg = interpolate(
            gettext('Unable to retrieve Ironic nodes. %s'),
            [response.data],
            false);
          toastService.add('error', msg);
          return $q.reject(msg);
        });
    }

    /**
     * @description Retrieve information about the given node.
     *
     * http://developer.openstack.org/api-ref/baremetal/?
     * expanded=create-node-detail#list-nodes-detailed
     *
     * @param {string} uuid – UUID or logical name of a node.
     * @return {promise} Node
     */
    function getNode(uuid) {
      return apiService.get('/api/ironic/nodes/' + uuid)
        .then(function(response) {
          nodeErrorService.checkNodeError(response.data);
          return response.data; // The node
        })
        .catch(function(response) {
          var msg = interpolate(
            gettext('Unable to retrieve the Ironic node: %s'),
            [response.data],
            false);
          toastService.add('error', msg);
          return $q.reject(msg);
        });
    }

    /**
     * @description Retrieve the boot device for a node
     * https://developer.openstack.org/api-ref/baremetal/#get-boot-device
     *
     * @param {string} nodeId – UUID or logical name of a node.
     * @return {promise} Dictionary describing the current boot device
     */
    function getBootDevice(nodeId) {
      return apiService.get('/api/ironic/nodes/' + nodeId + '/boot_device')
        .then(function(response) {
          return response.data;
        })
        .catch(function(response) {
          var msg = interpolate(
            gettext('Unable to retrieve boot device for Ironic node. %s'),
            [response.data],
            false);
          toastService.add('error', msg);
          return $q.reject(msg);
        });
    }

    /**
     * @description Retrieve the supported boot devices for a node
     * https://developer.openstack.org/api-ref/baremetal/#get-supported-boot-devices
     *
     * @param {string} nodeId – UUID or logical name of a node.
     * @return {promise} List of supported boot devices
     */
    function getSupportedBootDevices(nodeId) {
      return apiService.get('/api/ironic/nodes/' + nodeId +
                            '/boot_device/supported')
        .then(function(response) {
          return response.data; // List of supported boot devices
        })
        .catch(function(response) {
          var msg = interpolate(
            gettext(
              'Unable to retrieve supported boot devices for Ironic node. %s'),
            [response.data],
            false);
          toastService.add('error', msg);
          return $q.reject(msg);
        });
    }

    /**
     * @description Retrieve a list of ports associated with a node.
     *
     * http://developer.openstack.org/api-ref/baremetal/#list-detailed-ports
     *
     * @param {string} uuid – UUID or logical name of a node.
     * @return {promise} List of ports
     */
    function getPortsWithNode(uuid) {
      var config = {
        params : {
          node_id: uuid
        }
      };
      return apiService.get('/api/ironic/ports/', config)
        .then(function(response) {
          // Add id and name properties to support delete operations
          // using the deleteModalService
          angular.forEach(response.data.ports, function(port) {
            port.id = port.uuid;
            port.name = port.address;
          });
          return response.data.ports;
        })
        .catch(function(response) {
          var msg = interpolate(
            gettext('Unable to retrieve the Ironic node ports: %s'),
            [response.data],
            false);
          toastService.add('error', msg);
          return $q.reject(msg);
        });
    }

    /**
     * @description Set the maintenance state of a node
     *
     * http://developer.openstack.org/api-ref/baremetal/#set-maintenance-flag
     *
     * @param {string} nodeId – UUID or logical name of a node.
     * @param {boolean} mode - True to put the node in maintenance mode,
     *   false to remove it from maintenance mode.
     * @param {string} reason - Reason for putting the node in maintenance.
     * @return {promise} Promise
     */
    function nodeSetMaintenance(nodeId, mode, reason) {
      var url = '/api/ironic/nodes/' + nodeId + '/maintenance';
      var promise = mode
        ? apiService.patch(url,
                           {maint_reason: reason ? reason
                            : gettext("No reason given.")})
        : apiService.delete(url);

      return promise.catch(function(response) {
        var msg = interpolate(
          gettext('Unable to set Ironic node %s maintenance state: %s'),
          [nodeId, response.data],
          false);
        toastService.add('error', msg);
        return $q.reject(msg);
      });
    }

    /**
     * @description Set the boot device of a node
     *
     * http://developer.openstack.org/api-ref/baremetal/#set-boot-device
     *
     * @param {string} nodeId – UUID or logical name of a node.
     * @param {string} bootDevice - Selected boot device.
     * @param {Boolean} persistent - True or False.
     * @return {promise} Promise
     */
    function nodeSetBootDevice(nodeId, bootDevice, persistent) {
      return apiService.put('/api/ironic/nodes/' + nodeId + '/boot_device',
                            {boot_device: bootDevice,
                             persistent: persistent})
        .then(function() {
          toastService.add('success',
                           gettext('Refresh page to see set boot device'));
        })
        .catch(function(response) {
          var msg = interpolate(gettext('Unable to set boot device: %s'),
                                [response.data],
                                false);
          toastService.add('error', msg);
          return $q.reject(msg);
        });
    }

    /**
     * @description Set the power state of the node.
     *
     * http://developer.openstack.org/api-ref/baremetal/#change-node-power-state
     *
     * @param {string} uuid – UUID or logical name of a node.
     * @param {string} state - Target power state ['on', 'off', 'reboot']
     * @param {boolean} soft - Flag for graceful power 'off' or reboot
     * @return {promise} Promise
     */
    function nodeSetPowerState(uuid, state, soft) {
      var data = {
        state: state
      };
      if (angular.isDefined(soft)) {
        data.soft = soft;
      }
      return apiService.patch('/api/ironic/nodes/' + uuid + '/states/power',
                              data)
        .then(function() {
          toastService.add('success',
                           gettext('Refresh page to see updated power status'));
        })
        .catch(function(response) {
          var msg = interpolate(gettext('Unable to power off the node: %s'),
                                [response.data],
                                false);
          toastService.add('error', msg);
          return $q.reject(msg);
        });
    }

    /**
     * @description Set the target provision state of the node.
     *
     * http://developer.openstack.org/api-ref/baremetal/#change-node-provision-state
     *
     * @param {string} uuid – UUID of a node.
     * @param {string} verb – Provisioning verb used to move node to desired
     *                        target state
     * @param {object []} cleanSteps - List of cleaning steps. Only used
     * when the value of verb is 'clean'
     * @return {promise} Promise
     */
    function setNodeProvisionState(uuid, verb, cleanSteps) {
      return apiService.put('/api/ironic/nodes/' + uuid + '/states/provision',
                            {verb: verb,
                             clean_steps: cleanSteps})
        .then(function() {
          var msg = gettext(
            'A request has been made to change the provisioning state of node %s');
          toastService.add('success', interpolate(msg, [uuid], false));
        })
        .catch(function(response) {
          var msg = interpolate(
            gettext('Unable to set node provision state: %s'),
            [response.data],
            false);
          toastService.add('error', msg);
          return $q.reject(msg);
        });
    }

    /**
     * @description Create an Ironic node
     *
     * http://developer.openstack.org/api-ref/baremetal/#create-node
     *
     * @param {object} params – Object containing parameters that define
     * the node to be created
     * @return {promise} Promise
     */
    function createNode(params) {
      var data = {
        node: params
      };
      return apiService.post('/api/ironic/nodes/', data)
        .catch(function(response) {
          var msg = interpolate(gettext('Unable to create node: %s'),
                                [response.data],
                                false);
          toastService.add('error', msg);
          return $q.reject(msg);
        });
    }

    /**
     * @description Delete the specified node from inventory
     *
     * http://developer.openstack.org/api-ref/baremetal/#delete-node
     *
     * @param {string} nodeIdent – UUID or logical name of a node.
     * @return {promise} Promise
     */
    function deleteNode(nodeIdent) {
      var data = {
        node: nodeIdent
      };
      return apiService.delete('/api/ironic/nodes/', data)
        .catch(function(response) {
          var msg = interpolate(gettext('Unable to delete node %s: %s'),
                                [nodeIdent, response.data],
                                false);
          toastService.add('error', msg);
          return $q.reject(msg);
        });
    }

    /**
     * @description Update the definition of a specified node.
     *
     * http://developer.openstack.org/api-ref/baremetal/#update-node
     *
     * @param {string} uuid – UUID of a node.
     * @param {object[]} patch – Sequence of update operations
     * @return {promise} Promise
     */
    function updateNode(uuid, patch) {
      var data = {
        patch: patch
      };
      return apiService.patch('/api/ironic/nodes/' + uuid, data)
        .then(function(response) {
          var msg = gettext('Successfully updated node %s');
          toastService.add('success', interpolate(msg, [uuid], false));
          return response.data; // The updated node
        })
        .catch(function(response) {
          var msg = interpolate(gettext('Unable to update node %s: %s'),
                                [uuid, response.data],
                                false);
          toastService.add('error', msg);
          return $q.reject(msg);
        });
    }

    /**
     * @description Validate the specified node
     *
     * http://developer.openstack.org/api-ref/baremetal/#validate-node
     *
     * @param {string} nodeId – UUID or logical name of a node.
     * @return {promise} Promise. success: list of interface validation
     * records, error: failure response
     */
    function validateNode(nodeId) {
      return apiService.get('/api/ironic/nodes/' + nodeId + '/validate',
                            {node: nodeId})
        .catch(function(response) {
          var msg = interpolate(gettext('Unable to validate node %s: %s'),
                                [nodeId, response.data],
                                false);
          toastService.add('error', msg);
          return $q.reject(msg);
        });
    }

    /**
     * @description Retrieve the list of Ironic drivers
     *
     * http://developer.openstack.org/api-ref/baremetal/#list-drivers
     *
     * @return {promise} Driver collection in JSON
     */
    function getDrivers() {
      return apiService.get('/api/ironic/drivers/')
        .then(function(response) {
          return response.data.drivers;
        })
        .catch(function(response) {
          var msg = interpolate(
            gettext('Unable to retrieve Ironic drivers: %s'),
            [response.data],
            false);
          toastService.add('error', msg);
          return $q.reject(msg);
        });
    }

    /**
     * @description Retrieve properities of a specified driver
     *
     * http://developer.openstack.org/api-ref/baremetal/#show-driver-properties
     *
     * @param {string} driverName - Driver name
     * @returns {promise} Property list
     */
    function getDriverProperties(driverName) {
      return apiService.get(
        '/api/ironic/drivers/' + driverName + '/properties')
        .then(function(response) {
          return response.data; // Driver properties
        })
        .catch(function(response) {
          var msg = interpolate(
            gettext('Unable to retrieve driver properties: %s'),
            [response.data],
            false);
          toastService.add('error', msg);
          return $q.reject(msg);
        });
    }

    /**
     * @description Create a network port
     *
     * http://developer.openstack.org/api-ref/baremetal/#create-port
     *
     * @param {object} port – Object containing parameters that define
     * the port to be created
     * @return {promise} Promise
     */
    function createPort(port) {
      var data = {
        port: port
      };
      return apiService.post('/api/ironic/ports/', data)
        .then(function(response) {
          toastService.add('success',
                           gettext('Port successfully created'));
          return response.data; // The newly created port
        })
        .catch(function(response) {
          var msg = interpolate(gettext('Unable to create port: %s'),
                                [response.data],
                                false);
          toastService.add('error', msg);
          return $q.reject(msg);
        });
    }

    /**
     * @description Delete a network port
     *
     * http://developer.openstack.org/api-ref/baremetal/#delete-port
     *
     * @param {string} portUuid – UUID of the port to be deleted
     * @return {promise} Promise
     */
    function deletePort(portUuid) {
      var data = {
        port_uuid: portUuid
      };
      return apiService.delete('/api/ironic/ports/', data)
        .catch(function(response) {
          var msg = interpolate(gettext('Unable to delete port: %s'),
                                [response.data],
                                false);
          toastService.add('error', msg);
          return $q.reject(msg);
        });
    }

    /**
     * @description Update the definition of a specified port.
     *
     * http://developer.openstack.org/api-ref/baremetal/#update-a-port
     *
     * @param {string} portUuid – UUID of a port.
     * @param {object[]} patch – Sequence of update operations
     * @return {promise} Promise
     */
    function updatePort(portUuid, patch) {
      return apiService.patch('/api/ironic/ports/' + portUuid,
                              {patch: patch})
        .then(function(response) {
          var msg = gettext('Successfully updated port %s');
          toastService.add('success', interpolate(msg, [portUuid], false));
          return response.data; // The updated port
        })
        .catch(function(response) {
          var msg = interpolate(gettext('Unable to update port %s: %s'),
                                [portUuid, response.data],
                                false);
          toastService.add('error', msg);
          return $q.reject(msg);
        });
    }

    /**
     * @description Set the console mode of the node.
     *
     * http://developer.openstack.org/api-ref/baremetal/?
     * expanded=start-stop-console-detail#start-stop-console
     *
     * @param {string} uuid – UUID of a node.
     * @param {boolean} enabled – true to start the console, false to stop it
     * @return {promise} Promise
     */
    function nodeSetConsoleMode(uuid, enabled) {
      return apiService.put('/api/ironic/nodes/' + uuid + '/states/console',
                            {enabled: enabled})
        .then(function(response) {
          var msg = gettext('Refresh page to see updated console details');
          toastService.add('success', interpolate(msg, [uuid], false));
          return response.data;
        })
        .catch(function(response) {
          var msg = gettext('Unable to set console mode: %s');
          toastService.add('error', interpolate(msg, [response.data], false));
          return $q.reject(msg);
        });
    }

    function nodeGetConsole(uuid) {
      return apiService.get('/api/ironic/nodes/' + uuid + '/states/console')
        .then(function(response) {
          return response.data; // Object containing console information
        })
        .catch(function(response) {
          var msg = gettext('Unable to get console for node %s: %s');
          toastService.add('error',
                           interpolate(msg, [uuid, response.data], false));
          return $q.reject(msg);
        });
    }

    /**
     * @description Retrieve a list of portgroups associated with a node.
     *
     * http://developer.openstack.org/api-ref/baremetal/#list-detailed-portgroups
     *
     * @param {string} nodeId – UUID or logical name of a node.
     * @return {promise} List of portgroups.
     */
    function getPortgroups(nodeId) {
      return apiService.get('/api/ironic/portgroups/',
                            {params: {node_id: nodeId}})
        .then(function(response) {
          // Add id property to support delete operations
          // using the deleteModalService
          angular.forEach(response.data.portgroups, function(portgroup) {
            portgroup.id = portgroup.uuid;
          });
          return response.data.portgroups;
        })
        .catch(function(response) {
          var msg = interpolate(
            gettext('Unable to retrieve Ironic node portgroups: %s'),
            [response.data],
            false);
          toastService.add('error', msg);
          return $q.reject(msg);
        });
    }

    /**
     * @description Create a protgroup.
     *
     * http://developer.openstack.org/api-ref/baremetal/#create-portgroup
     *
     * @param {object} params – Object containing parameters that define
     *   the portgroup to be created.
     * @return {promise} Promise containing the portgroup.
     */
    function createPortgroup(params) {
      return apiService.post('/api/ironic/portgroups/', params)
        .then(function(response) {
          toastService.add('success',
                           gettext('Portgroup successfully created'));
          return response.data; // The newly created portgroup
        })
        .catch(function(response) {
          var msg = interpolate(gettext('Unable to create portgroup: %s'),
                                [response.data],
                                false);
          toastService.add('error', msg);
          return $q.reject(msg);
        });
    }

    /**
     * @description Delete a portgroup.
     *
     * http://developer.openstack.org/api-ref/baremetal/#delete-portgroup
     *
     * @param {string} portgroupId – UUID or name of the portgroup to be deleted.
     * @return {promise} Promise.
     */
    function deletePortgroup(portgroupId) {
      return apiService.delete('/api/ironic/portgroups/',
                               {portgroup_id: portgroupId})
        .catch(function(response) {
          var msg = interpolate(gettext('Unable to delete portgroup: %s'),
                                [response.data],
                                false);
          toastService.add('error', msg);
          return $q.reject(msg);
        });
    }

    /**
     * @description Update the definition of a specified portgroup.
     *
     * http://developer.openstack.org/api-ref/baremetal/#update-a-portgroup
     *
     * @param {string} portgroupId – UUID or name of a portgroup.
     * @param {object[]} patch – Sequence of update operations
     * @return {promise} Promise
     */
    function updatePortgroup(portgroupId, patch) {
      return apiService.patch('/api/ironic/portgroups/' + portgroupId,
                              {patch: patch})
        .then(function(response) {
          var msg = gettext('Successfully updated portgroup %s');
          toastService.add('success', interpolate(msg, [portgroupId], false));
          return response.data; // The updated portgroup
        })
        .catch(function(response) {
          var msg = interpolate(gettext('Unable to update portgroup %s: %s'),
                                [portgroupId, response.data],
                                false);
          toastService.add('error', msg);
          return $q.reject(msg);
        });
    }

    /**
     * @description Get the ports associated with a specified portgroup.
     *
     * http://developer.openstack.org/api-ref/baremetal/#list-ports-by-portgroup
     *
     * @param {string} portgroupId – UUID or name of the portgroup.
     * @return {promise} Promise containing a list of ports.
     */
    function getPortgroupPorts(portgroupId) {
      return apiService.get(
        '/api/ironic/portgroups/' + portgroupId + '/ports')
        .then(function(response) {
          return response.data.ports; // List of ports
        })
        .catch(function(response) {
          var msg = interpolate(
            gettext('Unable to retrieve portgroup ports: %s'),
            [response.data],
            false);
          toastService.add('error', msg);
          return $q.reject(msg);
        });
    }
  }
}());
