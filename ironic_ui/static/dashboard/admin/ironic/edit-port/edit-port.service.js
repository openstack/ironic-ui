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
    .factory('horizon.dashboard.admin.ironic.edit-port.service',
             editPortService);

  editPortService.$inject = [
    '$uibModal',
    'horizon.dashboard.admin.ironic.basePath'
  ];

  function editPortService($uibModal, basePath) {
    var service = {
      editPort: editPort
    };

    /**
     * @description: Edit a specified port
     *
     * @param {object} port - Port to be edited
     * @param {object} node - Node to which the port is attached
     * @return {promise} Promise containing the updated port
     */
    function editPort(port, node) {
      var options = {
        controller: 'EditPortController as ctrl',
        backdrop: 'static',
        resolve: {
          port: function() {
            return port;
          },
          node: function() {
            return node;
          }
        },
        templateUrl: basePath + '/base-port/base-port.html'
      };
      return $uibModal.open(options).result;
    }

    return service;
  }
})();
