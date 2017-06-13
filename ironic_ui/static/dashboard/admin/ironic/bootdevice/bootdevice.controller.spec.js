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
(function () {
  'use strict';

  describe('horizon.dashboard.admin.ironic.BootDeviceController', function () {
    var BOOT_DEVICE_CONTROLLER_PROPERTIES = [
      'bootDevice',
      'cancel',
      'modalTitle',
      'persistent',
      'setSelectedBootDevice',
      'supportedBootDevices'
    ];
    var uibModalInstance, ironicBackendMockService, node;
    var ctrl = {};

    beforeEach(module('horizon.dashboard.admin.ironic'));

    beforeEach(module('horizon.framework.util'));

    beforeEach(module(function($provide) {
      $provide.value('$uibModal', {});
    }));

    beforeEach(module(function($provide) {
      uibModalInstance = {
        close: jasmine.createSpy(),
        dismiss: jasmine.createSpy()
      };
      $provide.value('$uibModalInstance', uibModalInstance);
    }));

    beforeEach(module(function($provide) {
      $provide.value('horizon.framework.widgets.toast.service',
                     {});
    }));

    beforeEach(module('horizon.app.core.openstack-service-api'));

    beforeEach(inject(function($injector) {
      ironicBackendMockService =
        $injector.get('horizon.dashboard.admin.ironic.backend-mock.service');
      ironicBackendMockService.init();

      var ironicAPI =
        $injector.get('horizon.app.core.openstack-service-api.ironic');

      ironicAPI.createNode(
        {driver: ironicBackendMockService.params.defaultDriver})
        .then(function(response) {
          node = response.data;
          var controller = $injector.get('$controller');
          ctrl = controller('BootDeviceController', {node: node});
        });
      ironicBackendMockService.flush();
    }));

    it('controller should be defined', function () {
      expect(ctrl).toBeDefined();
      expect(Object.getOwnPropertyNames(ctrl).sort()).toEqual(
        BOOT_DEVICE_CONTROLLER_PROPERTIES.sort());
      expect(ctrl.supportedBootDevices).toEqual(
        ironicBackendMockService.getNodeSupportedBootDevices(node.uuid));
      var bootDevice = ironicBackendMockService.getNodeBootDevice(node.uuid);
      expect(ctrl.bootDevice).toEqual(bootDevice.boot_device);
      expect(ctrl.persistent).toEqual(bootDevice.persistent ? 'True' : 'False');
    });

    it('cancel', function () {
      ctrl.cancel();
      expect(uibModalInstance.dismiss).toHaveBeenCalled();
    });

    it('setSelectedBootDevice', function () {
      ctrl.bootDevice = 'pxe';
      ctrl.persistent = 'False';
      ctrl.setSelectedBootDevice();
      expect(uibModalInstance.close).toHaveBeenCalledWith(
        {device: ctrl.bootDevice,
         persistent: ctrl.persistent === 'True'});
    });
  });
})();
