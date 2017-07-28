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

  angular
      .module('horizon.dashboard.admin.ironic')
      .controller('horizon.dashboard.admin.ironic.NodeDetailsController',
          IronicNodeDetailsController);

  IronicNodeDetailsController.$inject = [
    '$scope',
    '$location',
    'horizon.framework.widgets.toast.service',
    'horizon.app.core.openstack-service-api.ironic',
    'horizon.dashboard.admin.ironic.actions',
    'horizon.dashboard.admin.ironic.basePath',
    'horizon.dashboard.admin.ironic.edit-node.service',
    'horizon.dashboard.admin.ironic.create-port.service',
    'horizon.dashboard.admin.ironic.create-portgroup.service',
    'horizon.dashboard.admin.ironic.edit-port.service',
    'horizon.dashboard.admin.ironic.edit-portgroup.service',
    'horizon.dashboard.admin.ironic.maintenance.service',
    'horizon.dashboard.admin.ironic.bootdevice.service',
    'horizon.dashboard.admin.ironic.node-state-transition.service',
    'horizon.dashboard.admin.ironic.validUuidPattern'
  ];

  function IronicNodeDetailsController($scope,
                                       $location,
                                       toastService,
                                       ironic,
                                       actions,
                                       basePath,
                                       editNodeService,
                                       createPortService,
                                       createPortgroupService,
                                       editPortService,
                                       editPortgroupService,
                                       maintenanceService,
                                       bootDeviceService,
                                       nodeStateTransitionService,
                                       validUuidPattern) {
    var ctrl = this;
    var path = basePath + '/node-details/sections/';

    ctrl.noPortsText = gettext('No network ports have been defined');
    ctrl.noPortgroupsText = gettext('No portgroups have been defined');

    ctrl.actions = actions;
    ctrl.maintenanceService = maintenanceService;
    ctrl.bootDeviceService = bootDeviceService;

    ctrl.sections = [
      {
        heading: gettext('Overview'),
        templateUrl: path + 'overview.html'
      },
      {
        heading: gettext('Configuration'),
        templateUrl: path + 'configuration.html'
      }
    ];

    ctrl.portDetailsTemplateUrl = path + "port-details.html";
    ctrl.portgroupDetailsTemplateUrl = path + "portgroup-details.html";

    ctrl.node = null;
    ctrl.nodeValidation = [];
    ctrl.nodeValidationMap = {}; // Indexed by interface
    ctrl.nodeStateTransitions = [];
    ctrl.nodePowerTransitions = [];
    ctrl.ports = [];
    ctrl.portsSrc = [];
    ctrl.portgroups = [];
    ctrl.portgroupsSrc = [];
    ctrl.basePath = basePath;
    ctrl.re_uuid = new RegExp(validUuidPattern);
    ctrl.isUuid = isUuid;
    ctrl.getVifPortId = getVifPortId;
    ctrl.editNode = editNode;
    ctrl.createPort = createPort;
    ctrl.createPortgroup = createPortgroup;
    ctrl.deletePort = deletePort;
    ctrl.editPort = editPort;
    ctrl.editPortgroup = editPortgroup;
    ctrl.refresh = refresh;
    ctrl.toggleConsoleMode = toggleConsoleMode;
    ctrl.deletePortgroups = deletePortgroups;

    $scope.emptyObject = function(obj) {
      return angular.isUndefined(obj) || Object.keys(obj).length === 0;
    };

    $scope.isDefined = angular.isDefined;

    init();

    /**
     * @name horizon.dashboard.admin.ironic.NodeDetailsController.init
     * @description Initialize the controller instance based on the
     * current page url.
     *
     * @return {void}
     */
    function init() {
      // Fetch the Node ID from the URL.
      var pattern = /(.*\/admin\/ironic\/)(.+)\/(detail)?/;
      var uuid = $location.absUrl().match(pattern)[2];

      retrieveNode(uuid).then(function () {
        ctrl.nodeStateTransitions =
          nodeStateTransitionService.getTransitions(ctrl.node.provision_state);
        ctrl.nodePowerTransitions = actions.getPowerTransitions(ctrl.node);
        retrievePorts();
        retrieveBootDevice();
        retrievePortgroups();
        validateNode();
      });
    }

    /**
     * @name horizon.dashboard.admin.ironic.NodeDetailsController.retrieveNode
     * @description Retrieve the node instance for a specified node id,
     * and store it in the controller instance.
     *
     * @param {string} uuid – Node name or UUID
     * @return {promise} promise
     */
    function retrieveNode(uuid) {
      return ironic.getNode(uuid).then(function (node) {
        ctrl.node = node;
        ctrl.node.id = ctrl.node.uuid;
        ironic.nodeGetConsole(uuid).then(function(consoleData) {
          ctrl.node.console_enabled = consoleData.console_enabled;
          ctrl.node.console_info = consoleData.console_info;
        });
      });
    }

    /**
     * @name horizon.dashboard.admin.ironic.NodeDetailsController.nodeGetInterface
     * @description Retrieve the current underlying interface for specified interface
     * type.
     *
     * @param {string} interfacename - Name of interface, e.g. power, boot, etc.
     * @return {string} current name of interface for the requested interface type.
    */
    function nodeGetInterface(interfacename) {
      return ctrl.node[interfacename + '_interface'] === null ? 'None'
      : ctrl.node[interfacename + '_interface'];
    }

    /**
     * @name horizon.dashboard.admin.ironic.NodeDetailsController.retrievePorts
     * @description Retrieve the ports associated with the current node,
     * and store them in the controller instance.
     *
     * @return {void}
     */
    function retrievePorts() {
      ironic.getPortsWithNode(ctrl.node.uuid).then(function (ports) {
        ctrl.portsSrc = ports;
      });
    }

    /**
     * @name horizon.dashboard.admin.ironic.NodeDetailsController.retrieveBootDevice
     * @description Retrieve the boot device associated with the current node,
     * and store it in the controller instance.
     *
     * @return {void}
     */
    function retrieveBootDevice() {
      ironic.getBootDevice(ctrl.node.uuid).then(function (bootDevice) {
        ctrl.node.bootDevice = bootDevice;
      });
    }

    /**
     * @name horizon.dashboard.admin.ironic.NodeDetailsController.retrievePortgroups
     * @description Retrieve the port groups associated with the current node,
     *   and store them in the controller instance.
     *
     * @return {void}
     */
    function retrievePortgroups() {
      ironic.getPortgroups(ctrl.node.uuid).then(function(portgroups) {
        ctrl.portgroupsSrc = portgroups;
        angular.forEach(portgroups, function(portgroup) {
          portgroup.ports = [];
          ironic.getPortgroupPorts(portgroup.uuid).then(function(ports) {
            portgroup.ports = ports;
          });
        });
      });
    }

    /**
     * @name horizon.dashboard.admin.ironic.NodeDetailsController.validateNode
     * @description Retrieve the ports associated with the current node,
     * and store them in the controller instance.
     *
     * @return {void}
     */
    function validateNode() {
      ironic.validateNode(ctrl.node.uuid).then(function(response) {
        var nodeValidation = [];
        ctrl.nodeValidationMap = {};
        angular.forEach(response.data, function(interfaceStatus) {
          interfaceStatus.id = interfaceStatus.interface;
          ctrl.nodeValidationMap[interfaceStatus.interface] = interfaceStatus;
          interfaceStatus.hw_interface = nodeGetInterface(interfaceStatus.interface);
          nodeValidation.push(interfaceStatus);
        });
        ctrl.nodeValidation = nodeValidation;
      });
    }

    /**
     * @name horizon.dashboard.admin.ironic.NodeDetailsController.isUuid
     * @description Test whether a string is an OpenStack UUID
     *
     * @param {string} str – string
     * @return {boolean} True if the string is an OpenStack UUID,
     * otherwise false
     */
    function isUuid(str) {
      return !!str.match(ctrl.re_uuid);
    }

    /**
     * @name horizon.dashboard.admin.ironic.NodeDetailsController.getVifPortId
     * @description Get the vif_port_id property of a specified port
     *
     * @param {object} port – instance of port
     * @return {string} Value of vif_port_id property or
     * "" if the property does not exist
     */
    function getVifPortId(port) {
      return angular.isDefined(port.extra) &&
             angular.isDefined(port.extra.vif_port_id)
             ? port.extra.vif_port_id : "";
    }

    /**
     * @description: Edit the current node
     *
     * @return {void}
     */
    function editNode() {
      editNodeService.editNode(ctrl.node).then(function() {
        ctrl.refresh();
      });
    }

    /**
     * @name horizon.dashboard.admin.ironic.NodeDetailsController.createPort
     * @description Initiate creation of a newtwork port for the current
     * node
     *
     * @return {void}
     */
    function createPort() {
      createPortService.createPort(ctrl.node).then(function() {
        ctrl.refresh();
      });
    }

    /**
     * @description: Edit a specified port
     *
     * @param {port} port - Port to be edited
     * @return {void}
     */
    function editPort(port) {
      editPortService.editPort(port, ctrl.node).then(function() {
        ctrl.refresh();
      });
    }

    /**
     * @name horizon.dashboard.admin.ironic.NodeDetailsController.deletePort
     * @description Delete a list of ports
     *
     * @param {port []} ports – ports to be deleted
     * @return {void}
     */
    function deletePort(ports) {
      actions.deletePort(ports).then(function() {
        ctrl.refresh();
      });
    }

    /**
     * @description: Edit a specified portgroup
     *
     * @param {portgroup} portgroup - Portgroup to be edited
     * @return {void}
     */
    function editPortgroup(portgroup) {
      editPortgroupService.editPortgroup(portgroup).then(function() {
        ctrl.refresh();
      });
    }

    /**
     * @name horizon.dashboard.admin.ironic.NodeDetailsController.portgroupDelete
     * @description Delete a list of portgroups.
     *
     * @param {port []} portgroups – portgroups to be deleted.
     * @return {void}
     */
    function deletePortgroups(portgroups) {
      actions.deletePortgroups(portgroups).then(function() {
        ctrl.refresh();
      });
    }

    /**
     * @name horizon.dashboard.admin.ironic.NodeDetailsController.refresh
     * @description Update node information
     *
     * @return {void}
     */
    function refresh() {
      init();
    }

    /**
     * @name horizon.dashboard.admin.ironic.NodeDetailsController.toggleConsoleMode
     * @description Toggle the state of the console for the current node
     *
     * @return {void}
     */
    function toggleConsoleMode() {
      ironic.nodeSetConsoleMode(ctrl.node.uuid, !ctrl.node.console_enabled);
    }

    /**
     * @name horizon.dashboard.admin.ironic.NodeDetailsController.createPortgroup
     * @description Initiate creation of a portgroup for the current
     * node
     *
     * @return {void}
     */
    function createPortgroup() {
      createPortgroupService.createPortgroup(ctrl.node).then(function() {
        ctrl.refresh();
      });
    }
  }
})();
