/**
 * Copyright 2016 Cray Inc
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

  var IRONIC_API_PROPERTIES = [
    'createNode',
    'createPort',
    'deleteNode',
    'deletePort',
    'getDrivers',
    'getDriverProperties',
    'getNode',
    'getNodes',
    'getPortsWithNode',
    'getBootDevice',
    'nodeGetConsole',
    'nodeSetConsoleMode',
    'nodeSetPowerState',
    'nodeSetMaintenance',
    'setNodeProvisionState',
    'updateNode',
    'updatePort',
    'validateNode'
  ];

  /**
   * @description Unit tests for the Ironic-UI API service
   */

  describe(
    'horizon.dashboard.admin.ironic.service',

    function() {
      // Name of default driver used to create nodes.
      var ironicAPI, ironicBackendMockService, defaultDriver;

      /**
       * @description Create a node.
       *
       * @param {object} params - Dictionary of parameters that define the node.
       * @return {promise} - Promise containing the newly created node.
       */
      function createNode(params) {
        return ironicAPI.createNode(params)
          .then(function(response) {
            return response.data; // node
          });
      }

      /**
       * @description Fail the current test
       *
       * @return {void}
       */
      function failTest() {
        fail();
      }

      beforeEach(module('horizon.dashboard.admin.ironic'));

      beforeEach(module('horizon.framework.util'));

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
        ironicAPI =
          $injector.get('horizon.app.core.openstack-service-api.ironic');
      }));

      it('defines the ironicAPI', function() {
        expect(ironicAPI).toBeDefined();
      });

      afterEach(function() {
        ironicBackendMockService.postTest();
      });

      describe('ironicAPI', function() {
        it('service API', function() {
          expect(Object.getOwnPropertyNames(ironicAPI).sort())
            .toEqual(IRONIC_API_PROPERTIES.sort());
        });

        it('getDrivers', function() {
          ironicAPI.getDrivers()
            .then(function(drivers) {
              expect(drivers.length).toBeGreaterThan(0);
              angular.forEach(drivers, function(driver) {
                expect(driver.name).toBeDefined();
              });
            })
          .catch(failTest);

          ironicBackendMockService.flush();
        });

        it('createNode - Minimal input data', function() {
          createNode({driver: defaultDriver})
            .then(function(node) {
              expect(node.driver).toEqual(defaultDriver);
              expect(node).toEqual(ironicBackendMockService.getNode(node.uuid));
            })
            .catch(failTest);

          ironicBackendMockService.flush();
        });

        it('createNode - Missing input data', function() {
          createNode({})
            .then(failTest);

          ironicBackendMockService.flush();
        });

        it('getNode', function() {
          createNode({driver: defaultDriver})
            .then(function(node1) {
              ironicAPI.getNode(node1.uuid).then(function(node2) {
                expect(node2).toEqual(node1);
              });
            })
            .catch(failTest);

          ironicBackendMockService.flush();
        });

        it('deleteNode', function() {
          createNode({driver: defaultDriver})
            .then(function(node) {
              return ironicAPI.deleteNode(node.uuid).then(function() {
                return node;
              });
            })
            .then(function(node) {
              expect(
                ironicBackendMockService.getNode(node.uuid)).toBe(undefined);
            })
            .catch(failTest);

          ironicBackendMockService.flush();
        });

        it('deleteNode - nonexistent node', function() {
          ironicAPI.deleteNode(0)
            .then(failTest);

          ironicBackendMockService.flush();
        });

        it('updateNode - resource_class', function() {
          createNode({driver: defaultDriver})
            .then(function(node) {
              return ironicAPI.updateNode(
                node.uuid,
                [{op: "replace",
                path: "/resource_class",
                value: "some-resource-class"}]).then(
                  function(node) {
                    return node;
                  });
            })
            .then(function(node) {
              expect(node.resource_class).toEqual("some-resource-class");
            })
            .catch(failTest);

          ironicBackendMockService.flush();
        });

        it('nodeGetConsole - console enabled', function() {
          createNode({driver: defaultDriver,
                      console_enabled: true})
            .then(function(node) {
              expect(node.console_enabled).toEqual(true);
              return node;
            })
            .then(function(node) {
              return ironicAPI.nodeGetConsole(node.uuid).then(
                function(consoleData) {
                  return {node: node, consoleData: consoleData};
                });
            })
            .then(function(data) {
              expect(data.consoleData.console_enabled).toEqual(true);
              expect(data.consoleData.console_info.console_type)
                .toEqual(ironicBackendMockService.params.consoleType);
              expect(data.consoleData.console_info.url)
                .toEqual(ironicBackendMockService.nodeGetConsoleUrl(
                  data.node.uuid));
            })
            .catch(failTest);

          ironicBackendMockService.flush();
        });

        it('nodeGetConsole - console not enabled', function() {
          createNode({driver: defaultDriver,
                      console_enabled: false})
            .then(function(node) {
              expect(node.console_enabled).toEqual(false);
              return node;
            })
            .then(function(node) {
              return ironicAPI.nodeGetConsole(node.uuid);
            })
            .then(function(consoleData) {
              expect(consoleData).toEqual(
                {console_enabled: false,
                 console_info: null});
            })
            .catch(failTest);

          ironicBackendMockService.flush();
        });

        it('nodeSetConsoleMode - Toggle console mode', function() {
          createNode({driver: defaultDriver,
                      console_enabled: false})
            .then(function(node) {
              expect(node.console_enabled).toEqual(false);
              return node;
            })
            .then(function(node) {
              ironicAPI.nodeSetConsoleMode(node.uuid, true);
              return node;
            })
            .then(function(node) {
              return ironicAPI.getNode(node.uuid);
            })
            .then(function(node) {
              expect(node.console_enabled).toEqual(true);
              return node;
            })
            // Toggle back
            .then(function(node) {
              ironicAPI.nodeSetConsoleMode(node.uuid, false);
              return node;
            })
            .then(function(node) {
              return ironicAPI.getNode(node.uuid);
            })
            .then(function(node) {
              expect(node.console_enabled).toEqual(false);
              return node;
            })
            .catch(failTest);

          ironicBackendMockService.flush();
        });

        it('nodeSetConsoleMode - Redundant console set', function() {
          createNode({driver: defaultDriver,
                      console_enabled: false})
            .then(function(node) {
              expect(node.console_enabled).toEqual(false);
              return node;
            })
            .then(function(node) {
              ironicAPI.nodeSetConsoleMode(node.uuid, false);
              return node;
            })
            .then(function(node) {
              return ironicAPI.getNode(node.uuid);
            })
            .then(function(node) {
              expect(node.console_enabled).toEqual(false);
              return node;
            });

          ironicBackendMockService.flush();
        });

        it('getBootDevice', function() {
          createNode({driver: defaultDriver})
            .then(function(node) {
              expect(node.console_enabled).toEqual(false);
              return node;
            })
            .then(function(node) {
              return ironicAPI.getBootDevice(node.uuid)
                .then(function(bootDevice) {
                  return bootDevice;
                });
            })
            .then(function(bootDevice) {
              expect(bootDevice).toEqual(
                ironicBackendMockService.params.bootDevice);
            });

          ironicBackendMockService.flush();
        });
      });
    });
})();
