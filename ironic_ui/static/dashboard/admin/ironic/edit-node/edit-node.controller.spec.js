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

  describe('horizon.dashboard.admin.ironic.edit-node', function () {
    var ironicBackendMockService, ctrl, editNode, updatePatchService;

    beforeEach(module('horizon.dashboard.admin.ironic'));

    beforeEach(module('horizon.framework.util'));

    beforeEach(module(function($provide) {
      $provide.value('$uibModal', {});
    }));

    beforeEach(module(function($provide) {
      $provide.value('$uibModalInstance', {});
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

      updatePatchService =
        $injector.get('horizon.dashboard.admin.ironic.update-patch.service');

      var ironicAPI =
        $injector.get('horizon.app.core.openstack-service-api.ironic');
      ironicAPI.createNode(
        {driver: ironicBackendMockService.params.defaultDriver})
        .then(function(response) {
          editNode = response.data;
          var controller = $injector.get('$controller');
          ctrl = controller('EditNodeController', {node: editNode});
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
      expect(ctrl.baseNode).toEqual(
        ironicBackendMockService.getNode(editNode.uuid));
      expect(ctrl.propertyCollections)
        .toContain(jasmine.objectContaining({id: "instance_info"}));
      angular.forEach(ctrl.propertyCollections, function(collection) {
        expect(Object.getOwnPropertyNames(collection).sort()).toEqual(
          PROPERTY_COLLECTION_PROPERTIES.sort());
      });
      expect(ctrl.node.name).toEqual(editNode.name);
      expect(ctrl.node.resource_class).toEqual(editNode.resource_class);
      expect(ctrl.node.network_interface).toEqual(editNode.network_interface);
      expect(ctrl.node.properties).toEqual(editNode.properties);
      expect(ctrl.node.extra).toEqual(editNode.extra);
      expect(ctrl.node.instance_info).toEqual(editNode.instance_info);
      expect(ctrl.node.uuid).toEqual(editNode.uuid);
      var properties = angular.copy(BASE_NODE_CONTROLLER_PROPERTIES);
      properties.push('baseNode',
                      'buildPatch',
                      'selectedDriver',
                      'submit');

      expect(Object.getOwnPropertyNames(ctrl).sort()).toEqual(
        properties.sort());
    });

    it('buildPatch', function () {
      var patch = ctrl.buildPatch(editNode, editNode);
      expect(patch.patch).toEqual([]);
      expect(patch.status).toEqual(updatePatchService.UpdatePatch.status.OK);
    });
  });
})();
