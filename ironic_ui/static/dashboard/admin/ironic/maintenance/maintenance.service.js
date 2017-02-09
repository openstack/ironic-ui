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

  function maintenanceService($uibModal, basePath, nodeActions) {
    var service = {
      putNodeInMaintenanceMode: putNodeInMaintenanceMode,
      removeNodeFromMaintenanceMode: removeNodeFromMaintenanceMode
    };
    return service;

    /*
     * @description Put a specified list of nodes into mainenance
     *
     * @param {object[]} nodes - List of node objects
     * @return {promise}
     */
    function putNodeInMaintenanceMode(nodes) {
      var options = {
        controller: "MaintenanceController as ctrl",
        templateUrl: basePath + '/maintenance/maintenance.html'
      };
      return $uibModal.open(options).result.then(function(reason) {
        return nodeActions.putNodeInMaintenanceMode(nodes, reason);
      });
    }

    /*
     * @description Take a specified list of nodes out of mainenance
     *
     * @param {object[]} nodes - List of node objects
     * @return {promise}
     */
    function removeNodeFromMaintenanceMode(nodes) {
      return nodeActions.removeNodeFromMaintenanceMode(nodes);
    }
  }
})();
