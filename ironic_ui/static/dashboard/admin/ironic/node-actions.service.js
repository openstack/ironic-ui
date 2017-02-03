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
      deletePort: deletePort,
      powerOn: powerOn,
      powerOff: powerOff,
      powerOnAll: powerOnNodes,
      powerOffAll: powerOffNodes,
      putNodeInMaintenanceMode: putInMaintenanceMode,
      removeNodeFromMaintenanceMode: removeFromMaintenanceMode,
      putAllInMaintenanceMode: putNodesInMaintenanceMode,
      removeAllFromMaintenanceMode: removeNodesFromMaintenanceMode,
      setProvisionState: setProvisionState
    };

    return service;

    function deleteNode(nodes) {
      var context = {
        labels: {
          title: ngettext("Delete Node",
                          "Delete Nodes",
                          nodes.length),
          message: ngettext('Are you sure you want to delete node "%s"? ' +
                            'This action cannot be undone.',
                            'Are you sure you want to delete nodes "%s"? ' +
                            'This action cannot be undone.',
                            nodes.length),
          submit: ngettext("Delete Node",
                           "Delete Nodes",
                           nodes.length),
          success: ngettext('Successfully deleted node "%s"',
                            'Successfully deleted nodes "%s"',
                            nodes.length),
          error: ngettext('Unable to delete node "%s"',
                          'Unable to delete nodes "%s"',
                          nodes.length)
        },
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

    /*
     * @name horizon.dashboard.admin.ironic.actions.setProvisionState
     * @description Set the provisioning state of a specified node
     *
     * @param {object} args - Object with two properties named 'node'
     * and 'verb'.
     *  node: node object.
     *  verb: string the value of which is the verb used to move
     *  the node to the desired target state for the node.
     */
    function setProvisionState(args) {
      ironic.setNodeProvisionState(args.node.uuid, args.verb);
    }

    function createPort(node) {
      return createPortService.modal(node);
    }

    function deletePort(ports) {
      var context = {
        labels: {
          title: ngettext("Delete Port",
                          "Delete Ports",
                          ports.length),
          message: ngettext('Are you sure you want to delete port "%s"? ' +
                            'This action cannot be undone.',
                            'Are you sure you want to delete ports "%s"? ' +
                            'This action cannot be undone.',
                            ports.length),
          submit: ngettext("Delete Port",
                           "Delete Ports",
                           ports.length),
          success: ngettext('Successfully deleted port "%s"',
                            'Successfully deleted ports "%s"',
                            ports.length),
          error: ngettext('Unable to delete port "%s"',
                          'Unable to delete portss "%s"',
                          ports.length)
        },
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
