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

  /**
   * @ngdoc controller
   * @name horizon.dashboard.admin.ironic:BootDeviceController
   * @ngController
   *
   * @description
   * Controller used to prompt the user for information associated with
   * setting the boot device of a node
   */
  angular
    .module('horizon.dashboard.admin.ironic')
    .controller('BootDeviceController', BootDeviceController);

  BootDeviceController.$inject = [
    '$uibModalInstance',
    'horizon.app.core.openstack-service-api.ironic',
    'node'
  ];

  function BootDeviceController($uibModalInstance, ironic, node) {
    var ctrl = this;

    ctrl.modalTitle = gettext("Set Boot Device");

    ironic.getSupportedBootDevices(node.uuid).then(
      function(bootDevices) {
        ctrl.supportedBootDevices = bootDevices;
      });

    // Initialize form fields to current values
    ctrl.bootDevice = null;
    ctrl.persistent = 'False';
    ironic.getBootDevice(node.uuid).then(function(device) {
      ctrl.bootDevice = device.boot_device;
      ctrl.persistent = device.persistent ? 'True' : 'False';
    });

    ctrl.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };

    ctrl.setSelectedBootDevice = function() {
      $uibModalInstance.close({device: ctrl.bootDevice,
                               persistent: ctrl.persistent === 'True'});
    };
  }
})();
