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

  describe('horizon.dashboard.admin.ironic.enroll-node', function () {
    var ironicBackendMockService, rootScope, ironicEvents, uibModalInstance;
    var ctrl = {};

    beforeEach(module('horizon.dashboard.admin.ironic'));

    beforeEach(module('horizon.framework.util'));

    beforeEach(module(function($provide) {
      $provide.value('$uibModal', {});
    }));

    beforeEach(module(function($provide) {
      uibModalInstance = {
        close: jasmine.createSpy()
      };
      $provide.value('$uibModalInstance', uibModalInstance);
    }));

    beforeEach(module(function($provide) {
      $provide.value('horizon.framework.widgets.toast.service',
                     {});
    }));

    beforeEach(module('horizon.app.core.openstack-service-api'));

    beforeEach(inject(function($injector) {
      rootScope = $injector.get('$rootScope');
      ironicEvents = $injector.get('horizon.dashboard.admin.ironic.events');
    }));

    beforeEach(inject(function($injector) {
      ironicBackendMockService =
        $injector.get('horizon.dashboard.admin.ironic.backend-mock.service');
      ironicBackendMockService.init();

      var controller = $injector.get('$controller');
      ctrl = controller('EnrollNodeController');
      ironicBackendMockService.flush();
    }));

    afterEach(function() {
      ironicBackendMockService.postTest();
    });

    it('controller should be defined', function () {
      expect(ctrl).toBeDefined();
    });

    it('base construction', function () {
      var properties = angular.copy(BASE_NODE_CONTROLLER_PROPERTIES);
      properties.push('submit');
      expect(Object.getOwnPropertyNames(ctrl).sort()).toEqual(
        properties.sort());
    });

    it('submit - success', function () {
      spyOn(rootScope, '$emit');
      var nodeName = "node_" + Date.now();
      ctrl.node.name = nodeName;
      ctrl.node.driver = ironicBackendMockService.params.defaultDriver;
      ctrl.submit();
      ironicBackendMockService.flush();
      expect(rootScope.$emit)
        .toHaveBeenCalledWith(ironicEvents.ENROLL_NODE_SUCCESS);
      expect(uibModalInstance.close)
        .toHaveBeenCalledWith(ironicBackendMockService.getNode(nodeName));
    });
  });
})();
