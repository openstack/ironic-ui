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
  "use strict";

  /**
   * @description Unit tests for the Ironic-UI raid config service
   */

  describe('horizon.dashboard.admin.ironic.raidconfig.service',
    function() {
      var $q,
        $uibModal,
        raidConfigService,
        ironicAPI,
        ironicBackendMockService,
        defaultDriver;

      beforeEach(module('horizon.dashboard.admin.ironic'));

      beforeEach(module('horizon.framework.util'));

      beforeEach(module(function($provide) {
        $provide.value('$uibModal', {
          open: function() {
            var targetRaid =
              {logical_disks: [{size_gb: 1, raid_level: '1', is_root_volume: false}]};
            return $q.when({target_raid_config: targetRaid});
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

        raidConfigService =
          $injector.get('horizon.dashboard.admin.ironic.raidconfig.service');
      }));

      it('defines the raidConfigService', function() {
        expect(raidConfigService).toBeDefined();
        expect(raidConfigService.setRaidConfig).toBeDefined();
      });

      afterEach(function() {
        ironicBackendMockService.postTest();
      });

      /**
       * @description Utility function that creates a node and returns
       * the node
       *
       * @return {promise} Containing node
       */
      function createNode() {
        return ironicAPI.createNode({driver: defaultDriver})
          .then(function(response) {
            return response.data;
          })
          .then(function(node) {
            return {node: node};
          });
      }

      it('setRaidConfig', function() {
        var targetRaidConfig =
          [{size_gb: 1, raid_level: '1', is_root_volume: false}];

        spyOn($uibModal, 'open').and.returnValue(
          {result: $q.when({target_raid_config: targetRaidConfig})});

        createNode().then(function(data) {
          raidConfigService.setRaidConfig(data.node)
            .then(function() {
              ironicAPI.getNode(data.node.uuid)
                .then(function(node) {
                  expect(node.target_raid_config).toEqual(targetRaidConfig);
                });
            })
            .catch(fail);
        });
        ironicBackendMockService.flush();
      });

      it('setRaidConfig - cancel', function() {
        spyOn($uibModal, 'open').and.returnValue(
          {result: $q.reject('cancel')});

        createNode().then(function(data) {
          raidConfigService.setRaidConfig(data.node)
            .then(fail)
            .catch(function() {});
        });

        ironicBackendMockService.flush();
      });
    });
})();

