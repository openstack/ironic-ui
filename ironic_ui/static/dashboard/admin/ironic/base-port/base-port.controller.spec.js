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

  describe('horizon.dashboard.admin.ironic.base-port', function () {
    var uibModalInstance, ironicBackendMockService, ironicAPI;
    var ctrl = {};

    beforeEach(module('horizon.framework.util'));

    beforeEach(module('horizon.dashboard.admin.ironic'));

    beforeEach(module(function($provide) {
      $provide.value('horizon.framework.widgets.toast.service', {
        add: function() {}
      });
    }));

    beforeEach(module('horizon.app.core.openstack-service-api'));

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
      ironicBackendMockService =
        $injector.get('horizon.dashboard.admin.ironic.backend-mock.service');
      ironicBackendMockService.init();

      ironicAPI =
        $injector.get('horizon.app.core.openstack-service-api.ironic');

      ironicAPI.createNode(
        {driver: ironicBackendMockService.params.defaultDriver})
        .then(function(response) {
          var node = response.data;
          var controller = $injector.get('$controller');
          controller('BasePortController', {ctrl: ctrl,
                                            node: node});
        });
      ironicBackendMockService.flush();
    }));

    afterEach(function() {
      ironicBackendMockService.postTest();
    });

    it('controller should be defined', function () {
      expect(ctrl).toBeDefined();
    });

    it('base construction', function () {
      expect(Object.getOwnPropertyNames(ctrl).sort()).toEqual(
        BASE_PORT_CONTROLLER_PROPERTIES.sort());

      angular.forEach(
        ['address', 'pxeEnabled', 'portgroup_uuid'],
        function(propertyName) {
          expect(Object.keys(ctrl[propertyName])).toContain('value');
        });

      expect(Object.keys(ctrl.extra)).toContain('properties');
    });

    it('localLinkConnectionMgr', function () {
      var props = ['port_id', 'switch_id', 'switch_info'];
      angular.forEach(
        props,
        function(propertyName) {
          expect(ctrl.localLinkConnection[propertyName].constructor.name)
            .toBe('FormField');
          expect(Object.keys(ctrl.localLinkConnection[propertyName]))
            .toContain('value');
        });

      expect(Object.keys(ctrl.localLinkConnection.fields).sort())
        .toEqual(props.sort());

      angular.forEach(
        props,
        function(propertyName) {
          expect(ctrl.localLinkConnection[propertyName])
            .toEqual(ctrl.localLinkConnection.fields[propertyName]);
        });

      expect(ctrl.localLinkConnection.update).toBeDefined();
      expect(ctrl.localLinkConnection.toPortAttr).toBeDefined();
      expect(ctrl.localLinkConnection.setValues).toBeDefined();
      expect(ctrl.localLinkConnection.disable).toBeDefined();
    });

    it('localLinkConnectionMgr.update', function () {
      ctrl.localLinkConnection.update();
      expect(ctrl.localLinkConnection.port_id.required).toBe(false);
      expect(ctrl.localLinkConnection.switch_id.required).toBe(false);
    });

    it('localLinkConnectionMgr.setValues', function () {
      var values = {port_id: 'port-id',
                    switch_id: '00:00:00:00:00:00',
                    switch_info: 'switch-info'};
      ctrl.localLinkConnection.setValues(values);
      angular.forEach(
        Object.keys(values),
        function(value, key) {
          if (ctrl.localLinkConnection.hasOwnProperty(key)) {
            expect(ctrl.localLinkConnection[key].value).toEqual(values[key]);
          }
        });
    });

    it('localLinkConnectionMgr.update - port_id has value', function () {
      ctrl.localLinkConnection.setValues({port_id: 'port-id'});
      ctrl.localLinkConnection.update();
      expect(ctrl.localLinkConnection.port_id.required).toBe(true);
      expect(ctrl.localLinkConnection.switch_id.required).toBe(true);
    });

    it('localLinkConnectionMgr.update - switch_id has value', function () {
      ctrl.localLinkConnection.setValues({switch_id: '00:00:00:00:00:00'});
      ctrl.localLinkConnection.update();
      expect(ctrl.localLinkConnection.port_id.required).toBe(true);
      expect(ctrl.localLinkConnection.switch_id.required).toBe(true);
    });

    it('localLinkConnectionMgr.toPortAttr - no values', function () {
      expect(ctrl.localLinkConnection.toPortAttr()).toBeNull();
    });

    it('localLinkConnectionMgr.toPortAttr - values', function () {
      var values = {port_id: 'port-id',
                    switch_id: '00:00:00:00:00:00',
                    switch_info: 'switch-info'};
      ctrl.localLinkConnection.setValues(values);
      expect(ctrl.localLinkConnection.toPortAttr()).toEqual(values);
    });

    it('localLinkConnectionMgr.disable', function () {
      function validateDisabled(state) {
        angular.forEach(
          ['port_id', 'switch_id', 'switch_info'],
          function(propertyName) {
            expect(ctrl.localLinkConnection[propertyName]).
              toEqual(jasmine.objectContaining({disabled: state}));
          });
      }

      validateDisabled(false);
      ctrl.localLinkConnection.disable();
      validateDisabled(true);
    });

    it('cancel', function () {
      ctrl.cancel();
      expect(uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
    });
  });
})();
