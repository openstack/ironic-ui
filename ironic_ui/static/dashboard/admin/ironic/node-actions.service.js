/*
 * © Copyright 2015,2016 Hewlett Packard Enterprise Development Company LP
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
(function () {
  'use strict';

  var POWER_STATE_ON = 'power on';
  var POWER_STATE_OFF = 'power off';

  var DELETE_NODE_TITLE = gettext("Delete Node");
  var DELETE_NODE_MSG =
      gettext('Are you sure you want to delete node "%s"? ' +
              'This action cannot be undone.');
  var DELETE_NODE_SUCCESS = gettext('Successfully deleted node "%s"');
  var DELETE_NODE_ERROR = gettext('Unable to delete node "%s"');

  var DELETE_NODES_TITLE = gettext("Delete Nodes");
  var DELETE_NODES_MSG =
      gettext('Are you sure you want to delete nodes "%s"? ' +
              'This action cannot be undone.');
  var DELETE_NODES_SUCCESS = gettext('Successfully deleted nodes "%s"');
  var DELETE_NODES_ERROR = gettext('Error deleting nodes "%s"');

  var DELETE_PORT_TITLE = gettext("Delete Port");
  var DELETE_PORT_MSG =
      gettext('Are you sure you want to delete port "%s"? ' +
              'This action cannot be undone.');
  var DELETE_PORT_SUCCESS = gettext('Successfully deleted port "%s"');
  var DELETE_PORT_ERROR = gettext('Unable to delete port "%s"');

  var DELETE_PORTS_TITLE = gettext("Delete Ports");
  var DELETE_PORTS_MSG =
      gettext('Are you sure you want to delete ports "%s"? ' +
              'This action cannot be undone.');
  var DELETE_PORTS_SUCCESS = gettext('Successfully deleted ports "%s"');
  var DELETE_PORTS_ERROR = gettext('Error deleting ports "%s"');

  angular
    .module('horizon.dashboard.admin.ironic')
    .factory('horizon.dashboard.admin.ironic.actions', actions);

  actions.$inject = [
    'horizon.app.core.openstack-service-api.ironic',
    'horizon.framework.widgets.toast.service',
    'horizon.dashboard.admin.ironic.events',
    'horizon.framework.widgets.modal.deleteModalService',
    'horizon.dashboard.admin.ironic.create-port.service',
    '$q',
    '$rootScope'
  ];

  function actions(ironic,
                   toastService,
                   ironicEvents,
                   deleteModalService,
                   createPortService,
                   $q,
                   $rootScope) {
    var service = {
      createPort: createPort,
      deleteNode: deleteNode,
      deleteNodes: deleteNodes,
      deletePort: deletePort,
      deletePorts: deletePorts,
      powerOn: powerOn,
      powerOff: powerOff,
      powerOnAll: powerOnNodes,
      powerOffAll: powerOffNodes,
      putNodeInMaintenanceMode: putInMaintenanceMode,
      removeNodeFromMaintenanceMode: removeFromMaintenanceMode,
      putAllInMaintenanceMode: putNodesInMaintenanceMode,
      removeAllFromMaintenanceMode: removeNodesFromMaintenanceMode
    };

    return service;

    function deleteNode(node) {
      var labels = {
        title: DELETE_NODE_TITLE,
        message: DELETE_NODE_MSG,
        submit: DELETE_NODE_TITLE,
        success: DELETE_NODE_SUCCESS,
        error: DELETE_NODE_ERROR
      };
      var context = {
        labels: labels,
        deleteEntity: ironic.deleteNode,
        successEvent: ironicEvents.DELETE_NODE_SUCCESS
      };
      return deleteModalService.open($rootScope, [node], context);
    }

    function deleteNodes(nodes) {
      var labels = {
        title: DELETE_NODES_TITLE,
        message: DELETE_NODES_MSG,
        submit: DELETE_NODES_TITLE,
        success: DELETE_NODES_SUCCESS,
        error: DELETE_NODES_ERROR
      };
      var context = {
        labels: labels,
        deleteEntity: ironic.deleteNode,
        successEvent: ironicEvents.DELETE_NODE_SUCCESS
      };
      return deleteModalService.open($rootScope, nodes, context);
    }

    // power state

    function powerOn(node) {
      if (node.power_state !== POWER_STATE_OFF) {
        var msg = gettext("Node %s is not powered off.");
        return $q.reject(interpolate(msg, [node], false));
      }
      return ironic.powerOnNode(node.uuid).then(
        function() {
          // Set power state to be indeterminate
          node.power_state = null;
        }
      );
    }

    function powerOff(node) {
      if (node.power_state !== POWER_STATE_ON) {
        var msg = gettext("Node %s is not powered on.");
        return $q.reject(interpolate(msg, [node], false));
      }
      return ironic.powerOffNode(node.uuid).then(
        function() {
          // Set power state to be indeterminate
          node.power_state = null;
        }
      );
    }

    function powerOnNodes(nodes) {
      return applyFuncToNodes(powerOn, nodes);
    }

    function powerOffNodes(nodes) {
      return applyFuncToNodes(powerOff, nodes);
    }

    // maintenance

    function putInMaintenanceMode(node, maintReason) {
      if (node.maintenance !== false) {
        var msg = gettext("Node %s is already in maintenance mode.");
        return $q.reject(interpolate(msg, [node], false));
      }
      return ironic.putNodeInMaintenanceMode(node.uuid, maintReason).then(
        function () {
          node.maintenance = true;
          node.maintenance_reason = maintReason;
        }
      );
    }

    function removeFromMaintenanceMode(node) {
      if (node.maintenance !== true) {
        var msg = gettext("Node %s is not in maintenance mode.");
        return $q.reject(interpolate(msg, [node], false));
      }
      return ironic.removeNodeFromMaintenanceMode(node.uuid).then(
        function () {
          node.maintenance = false;
          node.maintenance_reason = "";
        }
      );
    }

    function putNodesInMaintenanceMode(nodes, maintReason) {
      return applyFuncToNodes(putInMaintenanceMode, nodes, maintReason);
    }

    function removeNodesFromMaintenanceMode(nodes) {
      return applyFuncToNodes(removeFromMaintenanceMode, nodes);
    }

    function createPort(node) {
      return createPortService.modal(node);
    }

    function deletePort(port) {
      var labels = {
        title: DELETE_PORT_TITLE,
        message: DELETE_PORT_MSG,
        submit: DELETE_PORT_TITLE,
        success: DELETE_PORT_SUCCESS,
        error: DELETE_PORT_ERROR
      };
      var context = {
        labels: labels,
        deleteEntity: ironic.deletePort,
        successEvent: ironicEvents.DELETE_PORT_SUCCESS
      };
      return deleteModalService.open($rootScope, [port], context);
    }

    function deletePorts(ports) {
      var labels = {
        title: DELETE_PORTS_TITLE,
        message: DELETE_PORTS_MSG,
        submit: DELETE_PORTS_TITLE,
        success: DELETE_PORTS_SUCCESS,
        error: DELETE_PORTS_ERROR
      };
      var context = {
        labels: labels,
        deleteEntity: ironic.deletePort,
        successEvent: ironicEvents.DELETE_PORT_SUCCESS
      };
      return deleteModalService.open($rootScope, ports, context);
    }

    /*
     * @name horizon.dashboard.admin.ironic.actions.applyFuncToNodes
     * @description Apply a specified function to each member of a
     * collection of nodes
     *
     * @param {function} fn – Function to be applied.
     * The function should accept a node as the first argument. An optional
     * second argument can be used to provide additional information.
     * @param {Array<node>} nodes - Collection of nodes
     * @param {object} extra - Additional argument passed to the function
     * @return {promise} - Single promise that represents the combined
     * return status from all function invocations. The promise is rejected
     * if any individual call fails.
     */
    function applyFuncToNodes(fn, nodes, extra) {
      var promises = [];
      angular.forEach(nodes,
                      function(node) {
                        promises.push(fn(node, extra));
                      });
      return $q.all(promises);
    }
  }

})();
