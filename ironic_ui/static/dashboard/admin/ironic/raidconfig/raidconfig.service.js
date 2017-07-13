/*
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
(function() {
  'use strict';

  /*
   * @ngdoc service
   * @name  horizon.dashboard.admin.ironic.raidconfig.service
   * @description Service for setting the target raid configuration of a node
   */
  angular
    .module('horizon.dashboard.admin.ironic')
    .factory('horizon.dashboard.admin.ironic.raidconfig.service',
             raidConfigService);

  raidConfigService.$inject = [
    '$uibModal',
    'horizon.dashboard.admin.ironic.basePath',
    'horizon.app.core.openstack-service-api.ironic'
  ];

  function raidConfigService($uibModal, basePath, ironic) {
    var service = {
      setRaidConfig: setRaidConfig
    };
    return service;

    /*
     * @description Set the target raid configuration of a specified node
     *
     * @param {object} node - node object
     * @return {promise}
     */
    function setRaidConfig(node) {
      var promise;
      var options = {
        controller: "RaidConfigController as ctrl",
        backdrop: 'static',
        resolve: {
          node: function() {
            return node;
          }
        },
        templateUrl: basePath + '/raidconfig/raidconfig.html'
      };
      promise = $uibModal.open(options).result.then(
        function(result) {
          return ironic.nodeSetRaidConfig(node.uuid,
                                          result.target_raid_config);
        });
      return promise;
    }
  }
})();

