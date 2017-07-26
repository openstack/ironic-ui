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

  describe('horizon.dashboard.admin.ironic.create-portgroup', function () {
    var ironicBackendMockService, uibModalInstance, ironicAPI, controller;

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
      $provide.value('horizon.framework.widgets.toast.service', {
        add: function() {}
      });
    }));

    beforeEach(module('horizon.app.core.openstack-service-api'));

    beforeEach(inject(function($injector) {
      ironicBackendMockService =
        $injector.get('horizon.dashboard.admin.ironic.backend-mock.service');
      ironicBackendMockService.init();

      ironicAPI =
        $injector.get('horizon.app.core.openstack-service-api.ironic');

      controller = $injector.get('$controller');
    }));

    afterEach(function() {
      ironicBackendMockService.postTest();
    });

    function createController() {
      return ironicAPI.createNode({
        driver: ironicBackendMockService.params.defaultDriver})
        .then(function(response) {
          var node = response.data;
          return {node: response.data,
                  ctrl: controller('CreatePortgroupController',
                                   {node: node})};
        });
    }

    it('controller should be defined', function () {
      createController()
        .then(function(data) {
          expect(data.ctrl).toBeDefined();
        })
        .catch(function() {
          fail();
        });
      ironicBackendMockService.flush();
    });

    it('base construction', function () {
      createController()
        .then(function(data) {
          var ctrl = data.ctrl;
          var properties = angular.copy(BASE_PORTGROUP_CONTROLLER_PROPERTIES);
          properties.push('modalTitle');
          properties.push('submitButtonTitle');
          properties.push('createPortgroup');
          properties.push('submit');
          expect(Object.getOwnPropertyNames(ctrl).sort()).toEqual(
            properties.sort());
        })
        .catch(function() {
          fail();
        });
      ironicBackendMockService.flush();
    });

    it('submit - success', function () {
      var portgroupParams = {
        address: '00:00:00:00:00:00',
        name: 'my-portgroup',
        standalone_ports_supported: 'False',
        mode: '802.3ad',
        properties: {
          prop_1: 'prop-1-value'
        },
        extra: {
          extra_1: 'extra-1-value'
        }
      };

      spyOn(ironicAPI, 'createPortgroup').and.callThrough();

      uibModalInstance.close = function(portgroup) {
        expect(portgroup).toEqual(
        ironicBackendMockService.getPortgroup(portgroupParams.name));
      };

      createController()
        .then(function(data) {
          var ctrl = data.ctrl;
          angular.forEach(
            portgroupParams,
            function(value, param) {
              if (param === 'properties' ||
                  param === 'extra') {
                ctrl[param].properties = value;
              } else {
                ctrl[param].value = value;
              }
            });
          portgroupParams.node_uuid = data.node.uuid;

          ctrl.submit();

          expect(ironicAPI.createPortgroup)
            .toHaveBeenCalledWith(portgroupParams);
        })
        .catch(function() {
          fail();
        });
      ironicBackendMockService.flush();
    });
  });
})();
