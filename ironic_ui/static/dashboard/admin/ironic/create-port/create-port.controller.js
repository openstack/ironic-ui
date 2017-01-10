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
    '$controller',
    '$uibModalInstance',
    'horizon.app.core.openstack-service-api.ironic',
    'horizon.dashboard.admin.ironic.events',
    'node'
  ];

  function CreatePortController($rootScope,
                                $controller,
                                $uibModalInstance,
                                ironic,
                                ironicEvents,
                                node) {
    var ctrl = this;

    $controller('BasePortController',
                {ctrl: ctrl,
                 $uibModalInstance: $uibModalInstance});

    ctrl.modalTitle = gettext("Create Port");
    ctrl.submitButtonTitle = ctrl.modalTtile;

    /**
     * Create the defined port
     *
     * @return {void}
     */
    ctrl.createPort = function() {
      ctrl.port.node_uuid = node.id;
      ironic.createPort(ctrl.port).then(
        function() {
          $uibModalInstance.close();
          $rootScope.$emit(ironicEvents.CREATE_PORT_SUCCESS);
        },
        function() {
        });
    };

    ctrl.submit = function() {
      ctrl.createPort();
    };
  }
})();
