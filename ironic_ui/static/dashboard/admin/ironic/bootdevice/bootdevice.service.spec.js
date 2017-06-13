/**
 * Copyright 2017 Cray Inc
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function() {
  "use strict";

  /**
   * @description Unit tests for the Ironic-UI boot-device service
   */

  describe('horizon.dashboard.admin.ironic.bootdevice.service',
    function() {
      var $q,
        $uibModal,
        bootDeviceService,
        ironicAPI,
        ironicBackendMockService,
        defaultDriver;

      beforeEach(module('horizon.dashboard.admin.ironic'));

      beforeEach(module('horizon.framework.util'));

      beforeEach(module(function($provide) {
        $provide.value('$uibModal', {
          open: function() {
            return $q.when({device: 'pxe',
                            persistent: true});
          }
        });
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
        defaultDriver = ironicBackendMockService.params.defaultDriver;
      }));

      beforeEach(inject(function($injector) {
        $q = $injector.get('$q');

        $uibModal = $injector.get('$uibModal');

        ironicAPI =
          $injector.get('horizon.app.core.openstack-service-api.ironic');

        bootDeviceService =
          $injector.get('horizon.dashboard.admin.ironic.bootdevice.service');
      }));

      it('defines the bootDeviceService', function() {
        expect(bootDeviceService).toBeDefined();
        expect(bootDeviceService.setBootDevice).toBeDefined();
      });

      afterEach(function() {
        ironicBackendMockService.postTest();
      });

      /**
       * @description Utility function that creates a node and returns
       * both it and its boot device
       *
       * @return {promise} Containing node and boot_device
       */
      function createNode() {
        return ironicAPI.createNode({driver: defaultDriver})
          .then(function(response) {
            return response.data;
          })
          .then(function(node) {
            return ironicAPI.getBootDevice(node.uuid).then(function(device) {
              return {node: node, boot_device: device};
            });
          });
      }

      it('setBootDevice', function() {
        var targetBootDevice = {
          device: "safe",
          persistent: false
        };

        spyOn($uibModal, 'open').and.returnValue(
          {result: $q.when(targetBootDevice)});

        createNode().then(function(data) {
          expect(data.node.boot_device).not.toEqual(targetBootDevice.device);
          bootDeviceService.setBootDevice(data.node)
            .then(function() {
              ironicAPI.getBootDevice(data.node.uuid).then(function(device) {
                expect(device).toEqual(
                  {boot_device: targetBootDevice.device,
                  persistent: targetBootDevice.persistent});
              });
            })
            .catch(fail);
        });

        ironicBackendMockService.flush();
      });

      it('setBootDevice - cancel', function() {
        spyOn($uibModal, 'open').and.returnValue(
          {result: $q.reject('cancel')});

        createNode().then(function(data) {
          bootDeviceService.setBootDevice(data.node)
            .then(fail)
            .catch(function() {
              ironicAPI.getBootDevice(data.node.uuid).then(function(device) {
                expect(device).toEqual(data.boot_device);
              });
            });
        });

        ironicBackendMockService.flush();
      });
    });
})();
