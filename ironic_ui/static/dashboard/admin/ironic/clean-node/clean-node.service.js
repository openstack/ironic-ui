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
    .factory('horizon.dashboard.admin.ironic.clean-node.service',
             cleanNodeService);

  cleanNodeService.$inject = [
    '$uibModal',
    'horizon.dashboard.admin.ironic.basePath',
    'horizon.app.core.openstack-service-api.ironic'
  ];

  function cleanNodeService($uibModal, basePath, ironic) {
    var service = {
      clean: clean
    };
    return service;

    /*
     * @description Initiate manual cleaning of an Ironic node.
     * The user is prompted for a list of steps that are then
     * used to clean the node.
     *
     * @param {object} node - Node to be cleaned
     * @return {void}
     */
    function clean(node) {
      var options = {
        controller: 'CleanNodeController as ctrl',
        backdrop: 'static',
        templateUrl: basePath + '/clean-node/clean-node.html'
      };
      $uibModal.open(options).result.then(function(cleanSteps) {
        return ironic.setNodeProvisionState(node.uuid,
                                            'clean',
                                            cleanSteps);
      });
    }
  }
})();
