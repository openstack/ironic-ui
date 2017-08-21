/*
 * Copyright 2015 Hewlett Packard Enterprise Development Company LP
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
(function () {
  'use strict';

  describe('horizon.dashboard.admin.ironic.edit-portgroup', function () {
    var ironicBackendMockService, ctrl, node, portgroup, uibModalInstance;

    beforeEach(module('horizon.dashboard.admin.ironic'));

    beforeEach(module('horizon.framework.util'));

    beforeEach(module(function($provide) {
      $provide.value('$uibModal', {});
    }));

    beforeEach(module(function($provide) {
      uibModalInstance = {};
      $provide.value('$uibModalInstance', uibModalInstance);
    }));

    beforeEach(module(function($provide) {
      $provide.value('horizon.framework.widgets.toast.service',
                     {add: function() {}});
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
          ironicAPI.createPortgroup({node_uuid: node.uuid})
            .then(function(response) {
              portgroup = response;
              var controller = $injector.get('$controller');
              ctrl = controller('EditPortgroupController',
                                {portgroup: portgroup});
            });
        });
      ironicBackendMockService.flush();
    }));

    afterEach(function() {
      ironicBackendMockService.postTest();
    });

    it('controller should be defined', function () {
      expect(ctrl).toBeDefined();
    });

    it('controller base construction', function () {
      var properties = angular.copy(BASE_PORTGROUP_CONTROLLER_PROPERTIES);
      properties.push('modalTitle',
                      'updatePortgroup',
                      'submit',
                      'submitButtonTitle');

      expect(Object.getOwnPropertyNames(ctrl).sort()).toEqual(
        properties.sort());

      angular.forEach(
        ['address', 'name', 'standalone_ports_supported', 'mode'],
        function(property) {
          expect(ctrl[property].value).toEqual(portgroup[property]);
        });

      angular.forEach(
        ['properties', 'extra'],
        function(collection) {
          expect(ctrl[collection].properties).toEqual(portgroup[collection]);
        });
    });

    it('updatePortgroup', function () {
      var portgroupParams = {
        address: 'aa:aa:aa:aa:aa:aa',
        name: 'my-portgroup',
        standalone_ports_supported: !portgroup.standalone_ports_supported,
        mode: '802.3ad',
        extra: {
          extra_1: 'extra_1_value'
        },
        properties: {
          prop1_1: 'prop_1_value'
        }
      };

      uibModalInstance.close = function(portgroup) {
        angular.forEach(portgroupParams,
                        function(value, property) {
                          expect(portgroup[property]).toEqual(value);
                        });
      };

      angular.forEach(portgroupParams,
                      function(value, property) {
                        if (typeof value === 'object') {
                          ctrl[property].properties = value;
                        } else {
                          ctrl[property].value = value;
                        }
                      });
      ctrl.submit();
      ironicBackendMockService.flush();
    });
  });
})();
