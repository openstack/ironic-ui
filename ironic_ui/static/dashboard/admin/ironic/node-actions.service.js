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
  
  var POWER_STATE_ON ='power on';
  var POWER_STATE_OFF = 'power off';

  angular
    .module('horizon.dashboard.admin.ironic')
    .factory('horizon.dashboard.admin.ironic.actions', actions);

  actions.$inject = [
    'horizon.app.core.openstack-service-api.ironic',
    'horizon.framework.widgets.toast.service',
    '$q'
  ];

  function actions(ironic, toastService, $q) {
    var service = {
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

    // power state

    function powerOn(node) {
      if (node.power_state !== POWER_STATE_OFF) {
        return $q.reject(gettext("Node is not powered off."));
      }
      return ironic.powerOnNode(node.uuid).then(
        function(response) {
          // Set power state to be indeterminate
          node.power_state = null;
        },
        function(reason) {
          toastService.add('error', gettext(reason));
        });
    }

    function powerOff(node) {
      if (node.power_state !== POWER_STATE_ON) {
        return $q.reject(gettext("Node is not powered on."));
      }
      return ironic.powerOffNode(node.uuid).then(
        function(response) {
          // Set power state to be indeterminate
          node.power_state = null;
        },
        function(reason) {
          toastService.add('error', gettext(reason));
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

    function putInMaintenanceMode(node) {
      if (node.maintenance !== false) {
        return $q.reject(gettext("Node is already in maintenance mode."));
      }
      return ironic.putNodeInMaintenanceMode(node.uuid, "").then(
        function () {
          node.maintenance = true;
        },
        function(reason) {
          toastService.add('error', gettext(reason));
        }
      );
    }

    function removeFromMaintenanceMode(node) {
      if (node.maintenance !== true) {
        return $q.reject(gettext("Node is not in maintenance mode."));
      }
      return ironic.removeNodeFromMaintenanceMode(node.uuid).then(
        function () {
          node.maintenance = false;
        },
        function (reason) {
          toastService.add('error', gettext(reason));
        }
      );
    }

    function putNodesInMaintenanceMode(nodes) {
      return applyFuncToNodes(putInMaintenanceMode, nodes);
    }

    function removeNodesFromMaintenanceMode(nodes) {
      return applyFuncToNodes(removeFromMaintenanceMode, nodes);
    }

    function applyFuncToNodes(fn, nodes) {
      var promises = [];
      angular.forEach(nodes,
                      function(node) {
                        promises.push(fn(node));
                      });
      return $q.all(promises);
    }
  }

})();
