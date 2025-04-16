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

  function PowerTransition(label, state, soft) {
    this.label = label;
    this.state = state;
    this.soft = soft;
  }

  var POWER_ON_TRANSITIONS = [
    new PowerTransition(gettext('Power on'), 'on', false)
  ];

  var POWER_OFF_TRANSITIONS = [
    new PowerTransition(gettext('Power off'), 'off', false),
    new PowerTransition(gettext('Soft power off'), 'off', true),
    new PowerTransition(gettext('Reboot'), 'reboot', false),
    new PowerTransition(gettext('Soft reboot'), 'reboot', true)
  ];

  var ALL_POWER_TRANSITIONS =
    POWER_ON_TRANSITIONS.concat(POWER_OFF_TRANSITIONS);

  angular
    .module('horizon.dashboard.admin.ironic')
    .factory('horizon.dashboard.admin.ironic.actions', actions);

  actions.$inject = [
    'horizon.app.core.openstack-service-api.ironic',
    'horizon.dashboard.admin.ironic.events',
    'horizon.framework.widgets.modal.deleteModalService',
    'horizon.dashboard.admin.ironic.clean-node.service',
    '$q',
    '$rootScope'
  ];

  function actions(ironic,
                   ironicEvents,
                   deleteModalService,
                   cleanNodeService,
                   $q,
                   $rootScope) {
    var service = {
      deleteNode: deleteNode,
      deletePort: deletePort,
      deletePortgroups: deletePortgroups,
      setPowerState: setPowerState,
      setMaintenance: setMaintenance,
      setProvisionState: setProvisionState,
      getPowerTransitions : getPowerTransitions
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

    /**
     * @description Set the power state of a list of nodes
     *
     * @param {object[]} nodes - List of node objects
     * @param {string} state - Target power state
     * @param {boolean} [soft] - Flag for graceful power 'off' or reboot
     * @return {promise} promise
     */
    function setPowerState(nodes, state, soft) {
      var promises = [];
      angular.forEach(nodes,
                      function(node) {
                        promises.push(
                          ironic.nodeSetPowerState(node.uuid,
                                                   state,
                                                   soft)
                        );
                      });
      return $q.all(promises);
    }

    // maintenance

    /**
     * @description Set the maintenance state of a list of nodes
     *
     * @param {object[]} nodes - List of node objects
     * @param {boolean} mode - True if the nodes are to be put in
     *   maintenance mode, otherwise false.
     * @param {string} [reason] - Optional reason for putting nodes in
     *   maintenance mode.
     * @return {promise} promise
     */
    function setMaintenance(nodes, mode, reason) {
      var promises = [];
      angular.forEach(nodes, function(node) {
        var promise;
        if (node.maintenance === mode) {
          var msg = gettext(
            "Node %s is already in target maintenance state.");
          promise = $q.reject(interpolate(msg, [node.uuid], false));
        } else {
          promise = ironic.nodeSetMaintenance(node.uuid, mode, reason).then(
            function (result) {
              node.maintenance = mode;
              node.maintenance_reason =
                mode && angular.isDefined(reason) ? reason : "";
              return result;
            }
          );
        }
        promises.push(promise);
      });
      return $q.all(promises);
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
      if (args.verb === 'clean') {
        cleanNodeService.clean(args.node);
      } else {
        ironic.setNodeProvisionState(args.node.uuid, args.verb);
      }
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
                          'Unable to delete ports "%s"',
                          ports.length)
        },
        deleteEntity: ironic.deletePort,
        successEvent: ironicEvents.DELETE_PORT_SUCCESS
      };
      return deleteModalService.open($rootScope, ports, context);
    }

    function deletePortgroups(portgroups) {
      var context = {
        labels: {
          title: ngettext("Delete Portgroup",
                          "Delete Portgroups",
                          portgroups.length),
          message: ngettext('Are you sure you want to delete portgroup "%s"? ' +
                            'This action cannot be undone.',
                            'Are you sure you want to delete portgroups "%s"? ' +
                            'This action cannot be undone.',
                            portgroups.length),
          submit: ngettext("Delete Portgroup",
                           "Delete Portgroups",
                           portgroups.length),
          success: ngettext('Successfully deleted portgroup "%s"',
                            'Successfully deleted portgroups "%s"',
                            portgroups.length),
          error: ngettext('Unable to delete portgroup "%s"',
                          'Unable to delete portgroups "%s"',
                          portgroups.length)
        },
        deleteEntity: ironic.deletePortgroup
      };
      return deleteModalService.open($rootScope, portgroups, context);
    }

    /*
     * @name horizon.dashboard.admin.ironic.actions.getPowerTransitions
     * @description Get the list of power transitions for a specified
     * node, or all power transitions if the node is not specified.
     *
     * @param {object} node – Node object for which power transitions
     * are requested. If node is undefined all possible power transitions
     * are returned.
     * @return {object[]} - List of PowerTransition objects
     */
    function getPowerTransitions(node) {
      return angular.isUndefined(node) ? ALL_POWER_TRANSITIONS
        : node.power_state === 'power on'
        ? POWER_OFF_TRANSITIONS : POWER_ON_TRANSITIONS;
    }
  }

})();
