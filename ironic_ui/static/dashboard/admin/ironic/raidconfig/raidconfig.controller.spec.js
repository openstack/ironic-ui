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
(function () {
  'use strict';

  describe('horizon.dashboard.admin.ironic.RaidConfigController', function () {
    var RAID_CONFIG_CONTROLLER_PROPERTIES = [
      'addLogicalDisk',
      'cancel',
      'deleteLogicalDisk',
      'logicalDisks',
      'logicalDisksSrc',
      'modalTitle',
      'raid_level',
      'root_volume',
      'setTargetRaidConfig',
      'size_gb',
      'target_raid_config'
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
      $provide.value('horizon.framework.widgets.toast.service', {});
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
          ctrl = controller('RaidConfigController', {node: node});
        });
      ironicBackendMockService.flush();
    }));

    it('controller should be defined', function () {
      expect(ctrl).toBeDefined();
      expect(Object.getOwnPropertyNames(ctrl).sort()).toEqual(
        RAID_CONFIG_CONTROLLER_PROPERTIES.sort());
    });

    it('cancel', function () {
      ctrl.cancel();
      expect(uibModalInstance.dismiss).toHaveBeenCalled();
    });

    it('setTargetRaidConfig', function () {
      var testConfig =
      {logical_disks: [{size_gb: 5, raid_level: '5', is_root_volume: true}]};
      ctrl.logicalDisks = angular.copy(testConfig.logical_disks);
      ctrl.setTargetRaidConfig();
      expect(ctrl.logicalDisks.length).toBeGreaterThan(0);
      expect(uibModalInstance.close).toHaveBeenCalledWith(
        {target_raid_config: testConfig});
    });

  });
})();

