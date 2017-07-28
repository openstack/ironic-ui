/*
 * Copyright 2017 Cray Inc.
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

  angular
    .module('horizon.dashboard.admin.ironic')
    .factory('horizon.dashboard.admin.ironic.edit-portgroup.service',
             editPortgroupService);

  editPortgroupService.$inject = [
    '$uibModal',
    'horizon.dashboard.admin.ironic.basePath'
  ];

  function editPortgroupService($uibModal, basePath) {
    var service = {
      editPortgroup: editPortgroup
    };

    /**
     * @description: Edit a specified portgroup
     *
     * @param {object} portgroup - Portgroup to be edited
     * @return {promise} Promise containing the updated portgroup
     */
    function editPortgroup(portgroup) {
      var options = {
        controller: 'EditPortgroupController as ctrl',
        backdrop: 'static',
        resolve: {
          portgroup: function() {
            return portgroup;
          }
        },
        templateUrl: basePath + '/base-portgroup/base-portgroup.html'
      };
      return $uibModal.open(options).result;
    }

    return service;
  }
})();
