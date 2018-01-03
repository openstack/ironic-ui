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
    'createPortgroup',
    'deleteNode',
    'deletePort',
    'deletePortgroup',
    'getDrivers',
    'getDriverDetails',
    'getDriverProperties',
    'getNode',
    'getNodes',
    'getPortgroupPorts',
    'getPortgroups',
    'getPortsWithNode',
    'getBootDevice',
    'getSupportedBootDevices',
    'injectNmi',
    'nodeGetConsole',
    'nodeSetBootDevice',
    'nodeSetConsoleMode',
    'nodeSetPowerState',
    'nodeSetRaidConfig',
    'nodeSetMaintenance',
    'setNodeProvisionState',
    'updateNode',
    'updatePort',
    'updatePortgroup',
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
              expect(drivers).toEqual(ironicBackendMockService.getBaseDrivers());
            })
          .catch(failTest);

          ironicBackendMockService.flush();
        });

        it('getDriverDetails', function() {
          var driver = ironicBackendMockService.params.defaultDriver;
          ironicAPI.getDriverDetails(driver)
            .then(function(details) {
              var drivers = ironicBackendMockService.getDrivers();
              expect(details).toEqual(drivers[driver].details);
            })
          .catch(failTest);

          ironicBackendMockService.flush();
        });

        it('getDriverProperties', function() {
          var driver = ironicBackendMockService.params.defaultDriver;
          ironicAPI.getDriverProperties(driver)
            .then(function(properties) {
              var drivers = ironicBackendMockService.getDrivers();
              expect(properties).toEqual(drivers[driver].properties);
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
                ironicBackendMockService.getNode(node.uuid)).toBeNull();
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
            })
            .catch(failTest);

          ironicBackendMockService.flush();
        });

        it('getBootDevice', function() {
          createNode({driver: defaultDriver})
            .then(function(node) {
              return ironicAPI.getBootDevice(node.uuid)
                .then(function(bootDevice) {
                  return {node: node, bootDevice: bootDevice};
                });
            })
            .then(function(data) {
              expect(data.bootDevice).toEqual(
                ironicBackendMockService.getNodeBootDevice(data.node.uuid));
            })
            .catch(failTest);

          ironicBackendMockService.flush();
        });

        it('getSupportedBootDevices', function() {
          createNode({driver: defaultDriver})
            .then(function(node) {
              return ironicAPI.getSupportedBootDevices(node.uuid);
            })
            .then(function(bootDevices) {
              expect(bootDevices).toEqual(
                ironicBackendMockService.params.supportedBootDevices);
            })
            .catch(failTest);

          ironicBackendMockService.flush();
        });

        it('nodeSetBootDevice', function() {
          var bootDevice = {
            boot_device: "bios",
            persistent: false
          };

          createNode({driver: defaultDriver})
            .then(function(node) {
              return ironicAPI.nodeSetBootDevice(node.uuid,
                                                 bootDevice.boot_device,
                                                 bootDevice.persistent)
                .then(function() {
                  return node;
                });
            })
            .then(function(node) {
              ironicAPI.getBootDevice(node.uuid).then(function(device) {
                expect(device).toEqual(bootDevice);
              });
            })
            .catch(failTest);

          ironicBackendMockService.flush();
        });

        it('nodeSetBootDevice - bad device', function() {
          createNode({driver: defaultDriver})
            .then(function(node) {
              return ironicAPI.getBootDevice(node.uuid)
                .then(function(device) {
                  return {node: node, currentBootDevice: device};
                });
            })
            .then(function(data) {
              ironicAPI.nodeSetBootDevice(data.node.uuid,
                                          "bad-device",
                                          false)
                .then(failTest)
                .catch(function() {
                  // Ensure the boot device is unchanged
                  ironicAPI.getBootDevice(data.node.uuid)
                    .then(function(device) {
                      expect(device).toEqual(data.currentBootDevice);
                    });
                });
            })
            .catch(failTest);

          ironicBackendMockService.flush();
        });

        it('nodeSetRaidConfig', function() {
          var raid = {
            logical_disks: [{size_gb: 10, raid_level: '1', is_root_volume: false}]
          };
          createNode({driver: defaultDriver})
            .then(function(node) {
              return ironicAPI.nodeSetRaidConfig(node.uuid, raid)
                .then(function() {
                  return node;
                });
            })
            .then(function(node) {
              ironicAPI.getNode(node.uuid).then(function(node) {
                expect(node.target_raid_config).toEqual(raid);
              });
            })
            .catch(failTest);

          ironicBackendMockService.flush();
        });

        it('nodeSetRaidConfig - bad config', function() {
          var badConfig = {
            logical_disks: [{size_gb: 10, is_root_volume: false}]
          };

          createNode({driver: defaultDriver})
            .then(function(node) {
              ironicAPI.nodeSetRaidConfig(node.uuid, badConfig)
                .then(function() {
                  // Ensure the target raid config is unchanged
                  ironicAPI.getNode(node.uuid)
                    .then(function() {
                      expect(node.target_raid_config).toEqual({});
                    });
                });
            })
            .catch(failTest);

          ironicBackendMockService.flush();
        });

        it('createPort', function() {
          var macAddr = '00:00:00:00:00:00';
          var node;
          createNode({driver: defaultDriver})
            .then(function(createNode) {
              node = createNode;
              return ironicAPI.createPort({address: macAddr,
                                           node_uuid: node.uuid});
            })
            .then(function(port) {
              expect(port.address).toBe(macAddr);
              expect(port.node_uuid).toBe(node.uuid);
              expect(port)
                .toEqual(ironicBackendMockService.getPort(port.uuid));
            })
            .catch(failTest);

          ironicBackendMockService.flush();
        });

        it('createPort - missing input data', function() {
          ironicAPI.createPort({})
            .then(failTest);

          ironicBackendMockService.flush();
        });

        it('createPort - bad input data', function() {
          ironicAPI.createPort({address: "", node_uuid: ""})
            .then(failTest);

          ironicBackendMockService.flush();
        });

        it('createPort - duplicate mac address', function() {
          var macAddr = '00:00:00:00:00:00';
          var node;
          createNode({driver: defaultDriver})
            .then(function(createNode) {
              node = createNode;
              return ironicAPI.createPort({address: macAddr,
                                           node_uuid: node.uuid});
            })
            .then(function(port) {
              expect(port.address).toBe(macAddr);
              expect(port.node_uuid).toBe(node.uuid);
              expect(port)
                .toEqual(ironicBackendMockService.getPort(port.uuid));

              return ironicAPI.createPort({address: macAddr,
                                           node_uuid: node.uuid});
            })
            .then(failTest);

          ironicBackendMockService.flush();
        });

        it('deletePort', function() {
          var macAddr = '00:00:00:00:00:00';
          createNode({driver: defaultDriver})
            .then(function(node) {
              return ironicAPI.createPort({address: macAddr,
                                           node_uuid: node.uuid});
            })
            .then(function(port) {
              expect(port).toBeDefined();
              expect(port)
                .toEqual(ironicBackendMockService.getPort(port.uuid));
              ironicAPI.deletePort(port.uuid).then(function() {
                expect(ironicBackendMockService.getPort(port.uuid))
                  .toBeNull();
              });
            })
            .catch(failTest);

          ironicBackendMockService.flush();
        });

        it('deletePort - nonexistent port', function() {
          ironicAPI.deletePort(0)
            .then(failTest);

          ironicBackendMockService.flush();
        });

        it('createPortgroup', function() {
          var node;
          createNode({driver: defaultDriver})
            .then(function(createNode) {
              node = createNode;
              return ironicAPI.createPortgroup({node_uuid: node.uuid});
            })
            .then(function(portgroup) {
              expect(portgroup.node_uuid).toBe(node.uuid);
              expect(portgroup)
                .toEqual(ironicBackendMockService.getPortgroup(portgroup.uuid));
            })
            .catch(failTest);

          ironicBackendMockService.flush();
        });

        it('createPortgroup - specify portgroup name', function() {
          var node;
          var portgroupName = "test-portgroup";

          createNode({driver: defaultDriver})
            .then(function(createNode) {
              node = createNode;
              return ironicAPI.createPortgroup({node_uuid: node.uuid,
                                                name: portgroupName});
            })
            .then(function(portgroup) {
              expect(portgroup.node_uuid).toBe(node.uuid);
              expect(portgroup.name).toBe(portgroupName);
              expect(portgroup)
                .toEqual(ironicBackendMockService.getPortgroup(portgroup.uuid));
              expect(portgroup)
                .toEqual(ironicBackendMockService.getPortgroup(portgroup.name));
            })
            .catch(failTest);

          ironicBackendMockService.flush();
        });

        it('createPortgroup - missing input data', function() {
          ironicAPI.createPortgroup({})
            .then(failTest);

          ironicBackendMockService.flush();
        });

        it('createPort - bad input data', function() {
          ironicAPI.createPort({node_uuid: ""})
            .then(failTest);

          ironicBackendMockService.flush();
        });

        it('deletePortgroup', function() {
          createNode({driver: defaultDriver})
            .then(function(node) {
              return ironicAPI.createPortgroup({node_uuid: node.uuid});
            })
            .then(function(portgroup) {
              expect(portgroup).toBeDefined();
              expect(portgroup)
                .toEqual(ironicBackendMockService.getPortgroup(portgroup.uuid));
              ironicAPI.deletePortgroup(portgroup.uuid).then(function() {
                expect(ironicBackendMockService.getPortgroup(portgroup.uuid))
                  .toBeNull();
              });
            })
            .catch(failTest);

          ironicBackendMockService.flush();
        });

        it('deletePortgroup - by name', function() {
          var portgroupName = "delete-portgroup";

          createNode({driver: defaultDriver})
            .then(function(node) {
              return ironicAPI.createPortgroup({node_uuid: node.uuid,
                                                name: portgroupName});
            })
            .then(function(portgroup) {
              expect(portgroup).toBeDefined();
              expect(portgroup)
                .toEqual(ironicBackendMockService.getPortgroup(portgroup.uuid));
              expect(portgroup)
                .toEqual(ironicBackendMockService.getPortgroup(portgroup.name));
              ironicAPI.deletePortgroup(portgroup.name).then(function() {
                expect(ironicBackendMockService.getPortgroup(portgroup.name))
                  .toBeNull();
                expect(ironicBackendMockService.getPortgroup(portgroup.uuid))
                  .toBeNull();
              });
            })
            .catch(failTest);

          ironicBackendMockService.flush();
        });

        it('deletePortgroup - nonexistent portgroup', function() {
          ironicAPI.deletePortgroup(0)
            .then(failTest);

          ironicBackendMockService.flush();
        });

        it('getPortgroupPorts', function() {
          createNode({driver: defaultDriver})
            .then(function(node) {
              return ironicAPI.createPortgroup({node_uuid: node.uuid});
            })
            .then(function(portgroup) {
              expect(portgroup).toBeDefined();
              expect(portgroup)
                .toEqual(ironicBackendMockService.getPortgroup(portgroup.uuid));
              ironicAPI.getPortgroupPorts(portgroup.uuid).then(function(ports) {
                expect(ports).toEqual([]);
              });
            })
            .catch(failTest);

          ironicBackendMockService.flush();
        });

        it('injectNmi', function() {
          createNode({driver: defaultDriver})
            .then(function(node) {
              return ironicAPI.injectNmi(node.uuid);
            })
            .then(function(response) {
              expect(response.status).toBe(204);
              expect(response.data).toBe('');
            })
            .catch(failTest);

          ironicBackendMockService.flush();
        });

        it('injectNmi - nonexistent node', function() {
          ironicAPI.injectNmi(0)
            .then(failTest);

          ironicBackendMockService.flush();
        });
      });
    });
})();
