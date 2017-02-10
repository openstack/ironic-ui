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
      powerOffNode: powerOffNode,
      powerOnNode: powerOnNode,
      putNodeInMaintenanceMode: putNodeInMaintenanceMode,
      removeNodeFromMaintenanceMode: removeNodeFromMaintenanceMode,
      setNodeProvisionState: setNodeProvisionState,
      updateNode: updateNode,
      updatePort: updatePort,
      validateNode: validateNode
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
     * @description Put the node in maintenance mode.
     *
     * http://developer.openstack.org/api-ref/baremetal/#set-maintenance-flag
     *
     * @param {string} uuid – UUID or logical name of a node.
     * @param {string} reason – Reason for why node is being put into
     * maintenance mode
     * @return {promise} Promise
     */
    function putNodeInMaintenanceMode(uuid, reason) {
      return apiService.patch('/api/ironic/nodes/' + uuid + '/maintenance',
                              {maint_reason: reason
                               ? reason
                               : gettext("No reason given.")})
        .catch(function(response) {
          var msg = interpolate(
            gettext('Unable to put the Ironic node %s in maintenance mode: %s'),
            [uuid, response.data],
            false);
          toastService.add('error', msg);
          return $q.reject(msg);
        });
    }

    /**
     * @description Remove the node from maintenance mode.
     *
     * http://developer.openstack.org/api-ref/baremetal/#clear-maintenance-flag
     *
     * @param {string} uuid – UUID or logical name of a node.
     * @return {promise} Promise
     */
    function removeNodeFromMaintenanceMode(uuid) {
      return apiService.delete('/api/ironic/nodes/' + uuid + '/maintenance')
        .catch(function(response) {
          var msg = interpolate(
            gettext(
              'Unable to remove the Ironic node %s from maintenance mode: %s'),
            [uuid, response.data],
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
     * @return {promise} Promise
     */
    function powerOnNode(uuid) {
      var data = {
        state: 'on'
      };
      return apiService.patch('/api/ironic/nodes/' + uuid + '/states/power',
                              data)
        .then(function() {
          toastService.add('success',
                           gettext('Refresh page to see updated power status'));
        })
        .catch(function(response) {
          var msg = interpolate(gettext('Unable to power on the node: %s'),
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
     * @return {promise} Promise
     */
    function powerOffNode(uuid) {
      var data = {
        state: 'off'
      };
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
  }

}());
