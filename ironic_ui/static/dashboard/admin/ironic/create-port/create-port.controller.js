/*
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
(function() {
  'use strict';

  /**
   * Controller used to create a network port on a specified node
   */
  angular
    .module('horizon.dashboard.admin.ironic')
    .controller('CreatePortController', CreatePortController);

  CreatePortController.$inject = [
    '$rootScope',
    '$modalInstance',
    'horizon.app.core.openstack-service-api.ironic',
    'horizon.dashboard.admin.ironic.events',
    '$log',
    'node'
  ];

  function CreatePortController($rootScope,
                                $modalInstance,
                                ironic,
                                ironicEvents,
                                $log,
                                node) {
    var ctrl = this;

    // Paramater object that defines the port to be created
    ctrl.port = {
      node_uuid: node.id,
      address: null,
      extra: {}
    };

    /**
     * Cancel the port creation process
     *
     * @return {void}
     */
    ctrl.cancel = function() {
      $modalInstance.dismiss('cancel');
    };

    /**
     * Create the defined port
     *
     * @return {void}
     */
    ctrl.createPort = function() {
      ironic.createPort(ctrl.port).then(
        function() {
          $modalInstance.close();
          $rootScope.$emit(ironicEvents.CREATE_PORT_SUCCESS);
        },
        function() {
        });
    };

    /**
     * Delete a port metadata property
     *
     * @param {string} propertyName - Name of the property
     * @return {void}
     */
    ctrl.deleteExtra = function(propertyName) {
      delete ctrl.port.extra[propertyName];
    };

    /**
     * Check whether the specified port metadata property already exists
     *
     * @param {string} propertyName - Name of the metadata property
     * @return {boolean} True if the property already exists,
     * otherwise false
     */
    ctrl.checkExtraUnique = function(propertyName) {
      return !(propertyName in ctrl.port.extra);
    };
  }
})();
