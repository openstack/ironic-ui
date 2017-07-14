/*
 * © Copyright 2016 Hewlett Packard Enterprise Development Company LP
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
      .controller('IronicNodeListController', IronicNodeListController);

  IronicNodeListController.$inject = [
    '$q',
    'horizon.framework.widgets.toast.service',
    'horizon.app.core.openstack-service-api.ironic',
    'horizon.dashboard.admin.ironic.actions',
    'horizon.dashboard.admin.ironic.maintenance.service',
    'horizon.dashboard.admin.ironic.bootdevice.service',
    'horizon.dashboard.admin.ironic.enroll-node.service',
    'horizon.dashboard.admin.ironic.edit-node.service',
    'horizon.dashboard.admin.ironic.create-port.service',
    'horizon.dashboard.admin.ironic.node-state-transition.service'
  ];

  function IronicNodeListController($q,
                                    toastService,
                                    ironic,
                                    actions,
                                    maintenanceService,
                                    bootDeviceService,
                                    enrollNodeService,
                                    editNodeService,
                                    createPortService,
                                    nodeStateTransitionService) {
    var ctrl = this;

    ctrl.nodes = [];
    ctrl.nodesSrc = [];
    ctrl.actions = actions;
    ctrl.maintenanceService = maintenanceService;
    ctrl.bootDeviceService = bootDeviceService;

    ctrl.enrollNode = enrollNode;
    ctrl.editNode = editNode;
    ctrl.deleteNode = deleteNode;
    ctrl.createPort = createPort;
    ctrl.refresh = refresh;
    ctrl.getNodeStateTransitions = getNodeStateTransitions;

    /**
     * Filtering - client-side MagicSearch
     * all facets for node table
     */
    ctrl.nodeFacets = [
      {
        label: gettext('Name'),
        name: 'name',
        singleton: true
      },
      {
        label: gettext('UUID'),
        name: 'uuid',
        singleton: true
      },
      {
        label: gettext('Power State'),
        name: 'power_state',
        singleton: true
      },
      {
        label: gettext('Provisioning State'),
        name: 'provision_state',
        singleton: true
      },
      {
        label: gettext('Maintenance'),
        name: 'maintenance',
        singleton: true
      },
      {
        label: gettext('Driver'),
        name: 'driver',
        singleton: true
      }
    ];

    init();

    // RETRIVE NODES AND PORTS

    function init() {
      retrieveNodes();
    }

    function retrieveNodes() {
      ironic.getNodes().then(onGetNodes);
    }

    function onGetNodes(nodes) {
      var promises = [];
      angular.forEach(nodes, function (node) {
        node.id = node.uuid;
        promises.push(retrievePorts(node));
      });
      $q.all(promises).then(function() {
        ctrl.nodesSrc = nodes;
      });
    }

    function retrievePorts(node) {
      return ironic.getPortsWithNode(node.uuid).then(
        function (ports) {
          node.ports = ports;
        }
      );
    }

    function enrollNode() {
      enrollNodeService.enrollNode().then(function() {
        ctrl.refresh();
      });
    }

    function editNode(node) {
      editNodeService.editNode(node).then(function() {
        ctrl.refresh();
      });
    }

    function deleteNode(nodes) {
      actions.deleteNode(nodes).then(
        function() {
          ctrl.refresh();
        }
      );
    }

    function createPort(node) {
      createPortService.createPort(node).then(function() {
        ctrl.refresh();
      });
    }

    function refresh() {
      init();
    }

    function getNodeStateTransitions(node) {
      return nodeStateTransitionService.getTransitions(node.provision_state);
    }
  }

})();
