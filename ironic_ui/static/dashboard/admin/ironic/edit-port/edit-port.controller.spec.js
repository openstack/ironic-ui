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

  describe('horizon.dashboard.admin.ironic.edit-port', function () {
    var ironicBackendMockService, uibModalInstance, ironicAPI, controller,
      rootScope, ironicEvents;

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
      rootScope = $injector.get('$rootScope');
      ironicEvents = $injector.get('horizon.dashboard.admin.ironic.events');
    }));

    afterEach(function() {
      ironicBackendMockService.postTest();
    });

    function createController(nodeParams) {
      if (angular.isUndefined(nodeParams)) {
        nodeParams = {};
      }

      if (angular.isUndefined(nodeParams.driver)) {
        nodeParams.driver = ironicBackendMockService.params.defaultDriver;
      }

      return ironicAPI.createNode(nodeParams)
        .then(function(response) {
          return response.data;
        })
        .then(function(node) {
          return ironicAPI.createPort({address:'00:00:00:00:00:00',
                                       node_uuid: node.uuid})
            .then(function(port) {
              return {node: node, port: port};
            });
        })
        .then(function(data) {
          return {node: data.node,
                  port: data.port,
                  ctrl: controller('EditPortController',
                                   {node: data.node,
                                    port: data.port})};
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
          var properties = angular.copy(BASE_PORT_CONTROLLER_PROPERTIES);
          properties.push('modalTitle');
          properties.push('submitButtonTitle');
          properties.push('updatePort');
          properties.push('submit');
          expect(Object.getOwnPropertyNames(ctrl).sort()).toEqual(
            properties.sort());
          expect(ctrl.address.disabled).toBe(false);
          expect(ctrl.pxeEnabled.disabled).toBe(false);
          angular.forEach(ctrl.localLinkConnection.fields,
                          function(field) {
                            expect(field.disabled).toBe(false);
                          });
        })
        .catch(function() {
          fail();
        });
      ironicBackendMockService.flush();
    });

    it('node in enroll state', function () {
      createController()
        .then(function(data) {
          var ctrl = data.ctrl;
          expect(data.node.provision_state).toBe('enroll');
          expect(ctrl.address.disabled).toBe(false);
          expect(ctrl.pxeEnabled.disabled).toBe(false);
          angular.forEach(ctrl.localLinkConnection.fields,
                          function(field) {
                            expect(field.disabled).toBe(false);
                          });
        })
        .catch(function() {
          fail();
        });
      ironicBackendMockService.flush();
    });

    it('node in active state', function () {
      createController({provision_state: 'active'})
        .then(function(data) {
          var ctrl = data.ctrl;
          expect(data.node.provision_state).toBe('active');
          expect(ctrl.address.disabled).toBe(true);
          expect(ctrl.pxeEnabled.disabled).toBe(true);
          angular.forEach(ctrl.localLinkConnection.fields,
                          function(field) {
                            expect(field.disabled).toBe(true);
                          });
        })
        .catch(function() {
          fail();
        });
      ironicBackendMockService.flush();
    });

    it('node in available state', function () {
      createController({provision_state: 'available'})
        .then(function(data) {
          var ctrl = data.ctrl;
          expect(data.node.provision_state).toBe('available');
          expect(ctrl.address.disabled).toBe(false);
          expect(ctrl.pxeEnabled.disabled).toBe(true);
          angular.forEach(ctrl.localLinkConnection.fields,
                          function(field) {
                            expect(field.disabled).toBe(true);
                          });
        })
        .catch(function() {
          fail();
        });
      ironicBackendMockService.flush();
    });

    it('node in maintenance mode', function () {
      createController({provision_state: 'active',
                        maintenance: true})
        .then(function(data) {
          var ctrl = data.ctrl;
          expect(data.node.provision_state).toBe('active');
          expect(data.node.maintenance).toBe(true);
          expect(ctrl.address.disabled).toBe(false);
          expect(ctrl.pxeEnabled.disabled).toBe(false);
          angular.forEach(ctrl.localLinkConnection.fields,
                          function(field) {
                            expect(field.disabled).toBe(false);
                          });
        })
        .catch(function() {
          fail();
        });
      ironicBackendMockService.flush();
    });

    it('updatePort - no change', function () {
      createController()
        .then(function(data) {
          spyOn(ironicAPI, 'updatePort').and.callThrough();
          spyOn(rootScope, '$emit');

          uibModalInstance.close = function(port) {
            expect(port.address).toEqual(data.port.address);
            expect(port).toEqual(
              ironicBackendMockService.getPort(port.uuid));
            expect(rootScope.$emit)
              .toHaveBeenCalledWith(ironicEvents.EDIT_PORT_SUCCESS);
          };

          var ctrl = data.ctrl;
          ctrl.updatePort();
          expect(ironicAPI.updatePort)
            .toHaveBeenCalledWith(data.port.uuid, []);
        })
        .catch(function() {
          fail();
        });
      ironicBackendMockService.flush();
    });

    it('submit - change MAC address', function () {
      var newAddress = '12:12:12:12:12:12';

      createController()
        .then(function(data) {
          spyOn(ironicAPI, 'updatePort').and.callThrough();
          spyOn(rootScope, '$emit');

          uibModalInstance.close = function(port) {
            expect(port.address).toEqual(newAddress);
            expect(port).toEqual(
              ironicBackendMockService.getPort(port.uuid));
            expect(rootScope.$emit)
              .toHaveBeenCalledWith(ironicEvents.EDIT_PORT_SUCCESS);
          };

          var ctrl = data.ctrl;
          ctrl.address.value = newAddress;
          ctrl.submit();
        })
        .catch(function() {
          fail();
        });
      ironicBackendMockService.flush();
    });
  });
})();
