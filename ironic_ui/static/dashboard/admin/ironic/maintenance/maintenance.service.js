/*
 * Copyright 2016 Cray Inc.
 * Copyright (c) 2016 Hewlett Packard Enterprise Development Company LP
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

  /*
   * @ngdoc service
   * @name horizon.dashboard.admin.ironic.maintenance.service
   * @description Service for putting nodes in, and removing them from
   * maintenance mode
   */
  angular
    .module('horizon.dashboard.admin.ironic')
    .factory('horizon.dashboard.admin.ironic.maintenance.service',
             maintenanceService);

  maintenanceService.$inject = [
    '$uibModal',
    'horizon.dashboard.admin.ironic.basePath',
    'horizon.dashboard.admin.ironic.actions'
  ];

  function maintenanceService($uibModal, basePath, actions) {
    var service = {
      putNodeInMaintenanceMode: putNodeInMaintenanceMode,
      putNodesInMaintenanceMode: putNodesInMaintenanceMode,
      removeNodeFromMaintenanceMode: removeNodeFromMaintenanceMode,
      removeNodesFromMaintenanceMode: removeNodesFromMaintenanceMode
    };
    return service;

    /*
     * @name horizon.dashboard.admin.ironic.maintenance.service.
     * putNodeInMaintenanceMode
     * @description Put a specified node in maintenance mode
     * @param {object} - Node
     *
     * @return {void}
     */
    function putNodeInMaintenanceMode(node) {
      var options = {
        controller: "MaintenanceController as ctrl",
        templateUrl: basePath + '/maintenance/maintenance.html'
      };
      $uibModal.open(options).result.then(function(maintReason) {
        actions.putNodeInMaintenanceMode(node, maintReason);
      });
    }

    /*
     * @name horizon.dashboard.admin.ironic.maintenance.service.
     * putNodesInMaintenanceMode
     * @description Put the specified nodes in maintenance mode
     * @param {Array<object>} - Nodes
     *
     * @return {void}
     */
    function putNodesInMaintenanceMode(nodes) {
      var options = {
        controller: "MaintenanceController as ctrl",
        templateUrl: basePath + '/maintenance/maintenance.html'
      };
      $uibModal.open(options).result.then(function(maintReason) {
        actions.putAllInMaintenanceMode(nodes, maintReason);
      });
    }

    /*
     * @name horizon.dashboard.admin.ironic.maintenance.service.
     * removeNodeInMaintenanceMode
     * @description Remove a specified node from maintenance mode
     * @param {object} - Node
     *
     * @return {void}
     */
    function removeNodeFromMaintenanceMode(node) {
      actions.removeNodeFromMaintenanceMode(node);
    }

    /*
     * @name horizon.dashboard.admin.ironic.maintenance.service.
     * removeNodesFromMaintenanceMode
     * @description Remove the specified nodes from maintenance mode
     * @param {Array<object>} - Nodes
     *
     * @return {void}
     */
    function removeNodesFromMaintenanceMode(nodes) {
      actions.removeAllFromMaintenanceMode(nodes);
    }
  }
})();
