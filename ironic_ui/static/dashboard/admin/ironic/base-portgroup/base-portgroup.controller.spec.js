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

  describe('horizon.dashboard.admin.ironic.base-portgroup', function () {
    var uibModalInstance;
    var ctrl = {};

    beforeEach(module('horizon.dashboard.admin.ironic'));

    beforeEach(module(function($provide) {
      $provide.value('$uibModal', {});
    }));

    beforeEach(module(function($provide) {
      uibModalInstance = {
        dismiss: jasmine.createSpy()
      };
      $provide.value('$uibModalInstance', uibModalInstance);
    }));

    beforeEach(inject(function($injector) {
      var controller = $injector.get('$controller');
      controller('BasePortgroupController', {ctrl: ctrl});
    }));

    it('controller should be defined', function () {
      expect(ctrl).toBeDefined();
    });

    it('base construction', function () {
      expect(Object.getOwnPropertyNames(ctrl).sort()).toEqual(
        BASE_PORTGROUP_CONTROLLER_PROPERTIES.sort());

      angular.forEach(
        ['address', 'name', 'standalone_ports_supported', 'mode'],
        function(propertyName) {
          expect(Object.keys(ctrl[propertyName])).toContain('value');
        });
    });

    it('cancel', function () {
      ctrl.cancel();
      expect(uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
    });
  });
})();
