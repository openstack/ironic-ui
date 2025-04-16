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
    var nodeStateTransitionService, $controller, $location,
      ironicBackendMockService, $rootScope, ironicAPI;

    beforeEach(module(function($provide) {
      $provide.value('$uibModal', jasmine.createSpy());
    }));

    beforeEach(module('horizon.dashboard.admin.ironic'));

    beforeEach(module('horizon.framework.util'));

    beforeEach(module(function($provide) {
      $provide.value('horizon.framework.widgets.toast.service',
                     {add: function() {}});
    }));

    beforeEach(module('horizon.app.core.openstack-service-api'));

    beforeEach(module(function($provide) {
      $provide.value('horizon.dashboard.admin.ironic.edit-node.service',
                     {});
    }));

    beforeEach(module(function($provide) {
      $provide.value('horizon.dashboard.admin.ironic.maintenance.service',
                     {});
    }));

    beforeEach(inject(function ($injector, _$rootScope_, _$location_) {
      $location = _$location_;
      $controller = $injector.get('$controller');
      $rootScope = _$rootScope_;

      nodeStateTransitionService = $injector.get(
        'horizon.dashboard.admin.ironic.node-state-transition.service');

      ironicBackendMockService =
        $injector.get('horizon.dashboard.admin.ironic.backend-mock.service');
      ironicBackendMockService.init();

      ironicAPI =
          $injector.get('horizon.app.core.openstack-service-api.ironic');
    }));

    function createNode() {
      return ironicAPI.createNode(
        {driver: ironicBackendMockService.params.defaultDriver})
        .then(function(response) {
          return response.data;
        });
    }

    function createController(node) {
      $location.path('/admin/ironic/' + node.uuid + '/');

      var nodeActions = {
        getPowerTransitions: function() {
          return [];
        }
      };

      return $controller(
        'horizon.dashboard.admin.ironic.NodeDetailsController',
        {$scope: $rootScope.$new(),
         $location: $location,
         'horizon.dashboard.admin.ironic.edit-port.service': {},
         'horizon.dashboard.admin.ironic.actions': nodeActions});
    }

    it('controller should be defined', function () {
      createNode()
        .then(function(node) {
          var ctrl = createController(node);
          expect(ctrl).toBeDefined();
        });
      ironicBackendMockService.flush();
    });

    it('should have a basePath', function () {
      createNode()
        .then(function(node) {
          var ctrl = createController(node);
          expect(ctrl.basePath).toBeDefined();
        });
      ironicBackendMockService.flush();
    });

    it('should have a node', function () {
      var node, ctrl;
      createNode()
        .then(function(createdNode) {
          node = createdNode;
          ctrl = createController(node);
        })
        .catch(function() {
          fail();
        });

      ironicBackendMockService.flush();

      // The controller augments the base node with additional attributes
      var ctrlNode = ironicBackendMockService.getNode(node.uuid);
      ctrlNode.id = node.uuid;
      ironicAPI.nodeGetConsole(node.uuid)
        .then(function(consoleInfo) {
          ctrlNode.console_info = consoleInfo.console_info;
        })
        .then(function() {
          ironicAPI.getBootDevice(node.uuid)
            .then(function(bootDevice) {
              ctrlNode.bootDevice = bootDevice;
            });
        })
        .catch(function() {
          fail();
        });

      ironicBackendMockService.flush();
      expect(ctrl.node).toEqual(ctrlNode);
    });

    it('should have ports', function () {
      var portAddress = '11:22:33:44:55:66';
      var port, ctrl;

      createNode()
        .then(function(node) {
          return ironicAPI.createPort({node_uuid: node.uuid,
                                       address: portAddress})
            .then(function(port) {
              return {node: node, port: port};
            });
        })
        .then(function(data) {
          port = data.port;
          ctrl = createController(data.node);
        })
        .catch(function() {
          fail();
        });

      ironicBackendMockService.flush();

      var ctrlPort = ironicBackendMockService.getPort(port.uuid);
      ctrlPort.id = ctrlPort.uuid;
      ctrlPort.name = ctrlPort.address;
      expect(ctrl.portsSrc.length).toEqual(1);
      expect(ctrl.portsSrc[0].address).toBe(portAddress);
      expect(ctrl.portsSrc[0]).toEqual(ctrlPort);
    });

    it('should have a uuid regular expression pattern', function () {
      var ctrl;
      createNode()
        .then(function(node) {
          ctrl = createController(node);
        })
        .catch(function() {
          fail();
        });
      ironicBackendMockService.flush();

      expect(ctrl.re_uuid).toBeDefined();
    });

    it('should have an isUuid function', function () {
      var ctrl;
      createNode()
        .then(function(node) {
          ctrl = createController(node);
        })
        .catch(function() {
          fail();
        });
      ironicBackendMockService.flush();

      expect(ctrl.isUuid).toBeDefined();
      expect(ctrl.isUuid(ctrl.node.uuid)).toEqual(true);
      expect(ctrl.isUuid("not a uuid")).toEqual(false);
    });

    it('should have a getVifPortId function', function () {
      var ctrl;
      createNode()
        .then(function(node) {
          ctrl = createController(node);
        });
      ironicBackendMockService.flush();

      expect(ctrl.getVifPortId).toBeDefined();
    });

    it('should have node-state-transitions', function () {
      var ctrl;
      createNode()
        .then(function(node) {
          ctrl = createController(node);
        });
      ironicBackendMockService.flush();

      expect(ctrl.nodeStateTransitions).toBeDefined();
      expect(ctrl.nodeStateTransitions).toEqual(
        nodeStateTransitionService.getTransitions(ctrl.node.provision_state));
    });

    it('should have node-validation', function () {
      var ctrl;
      createNode()
        .then(function(node) {
          ctrl = createController(node);
        })
        .catch(function() {
          fail();
        });
      ironicBackendMockService.flush();
      var defaultNodeInterfaces = ironicBackendMockService.defaultNodeInterfaces;
      defaultNodeInterfaces[0].hw_interface = 'flat';
      defaultNodeInterfaces[0].id = defaultNodeInterfaces[0].interface;
      expect(ctrl.nodeValidation).toBeDefined();
      expect(ctrl.nodeValidation).toEqual(defaultNodeInterfaces);
    });

    it('should have driver interfaces', function () {
      var ctrl;
      createNode()
        .then(function(node) {
          ctrl = createController(node);
        })
        .catch(function() {
          fail();
        });
      ironicBackendMockService.flush();
      var interfaceName = ironicBackendMockService.defaultNodeInterfaces[0].interface;
      var hwInterface = ironicBackendMockService.defaultNode['' + interfaceName + '_interface'];
      expect(ctrl.node['' + interfaceName + '_interface']).toBeDefined();
      expect(ctrl.nodeValidation[0].hw_interface).toEqual(hwInterface);
    });

    it('should have injectNmi', function () {
      var ctrl;
      createNode()
        .then(function(node) {
          ctrl = createController(node);
        })
        .catch(function() {
          fail();
        });
      ironicBackendMockService.flush();
      expect(ctrl.injectNmi).toBeDefined();
    });
  });
})();
