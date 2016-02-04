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

  describe('horizon.dashboard.admin.ironic.node-details', function () {
    var ctrl, $q;
    var nodeUuid = "0123abcd-0123-4567-abcd-0123456789ab";
    var nodeName = "herp";
    var numPorts = 2;

    function portUuid(nodeUuid, index) {
      return '' + index + index + nodeUuid.substring(2);
    }

    function createPort(nodeUuid, index, extra) {
      return {uuid: portUuid(nodeUuid, index), extra: extra};
    }

    function createNode(name, uuid) {
      return {name: name, uuid: uuid};
    }

    var ironicAPI = {
      getNode: function (uuid) {
        var node = createNode(nodeName, uuid);
        return $q.when({data: node});
      },

      getPortsWithNode: function (uuid) {
        var ports = [];
        for (var i = 0; i < numPorts; i++) {
          ports.push(createPort(uuid, i, {}));
        }
        return $q.when({data: {items: ports}});
      }
    };

    beforeEach(module('horizon.dashboard.admin.ironic'));

    beforeEach(module('horizon.app.core.openstack-service-api', function($provide) {
      $provide.value('horizon.app.core.openstack-service-api.ironic', ironicAPI);
    }));

    beforeEach(inject(function ($injector, _$rootScope_, _$location_) {
      var scope = _$rootScope_.$new();
      $q = $injector.get('$q');
      var controller = $injector.get('$controller');
      var $location = _$location_;
      $location.path('/admin/ironic/' + nodeUuid + '/');

      ctrl = controller('horizon.dashboard.admin.ironic.NodeDetailsController', {
        $scope: scope,
        $location: $location,
        'horizon.dashboard.admin.ironic.actions': {},
        'horizon.dashboard.admin.basePath': '/static'});
      ctrl.init();

      scope.$apply();
    }));

    it('should be defined', function () {
      expect(ctrl).toBeDefined();
    });

    it('should have a basePath', function () {
      expect(ctrl.basePath).toBeDefined();
      expect(ctrl.basePath).toEqual('/static');
    });

    it('should have a node', function () {
      expect(ctrl.node).toBeDefined();
      expect(ctrl.node).toEqual(createNode(nodeName, nodeUuid))
    });

    it('should have ports', function () {
      expect(ctrl.ports).toBeDefined();
      expect(ctrl.ports.length).toEqual(numPorts);

      var ports = [];
      for (var i = 0; i < ctrl.ports.length; i++) {
        ports.push(createPort(ctrl.node.uuid, i, {vif_port_id: ''}));
      }
      expect(ctrl.ports).toEqual(ports);
    });

  });

})();
