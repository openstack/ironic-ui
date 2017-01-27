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
    '$scope',
    '$rootScope',
    '$q',
    'horizon.framework.widgets.toast.service',
    'horizon.app.core.openstack-service-api.ironic',
    'horizon.dashboard.admin.ironic.events',
    'horizon.dashboard.admin.ironic.actions',
    'horizon.dashboard.admin.ironic.maintenance.service',
    'horizon.dashboard.admin.ironic.enroll-node.service',
    'horizon.dashboard.admin.ironic.edit-node.service',
    'horizon.dashboard.admin.ironic.node-state-transition.service'
  ];

  function IronicNodeListController($scope,
                                    $rootScope,
                                    $q,
                                    toastService,
                                    ironic,
                                    ironicEvents,
                                    actions,
                                    maintenanceService,
                                    enrollNodeService,
                                    editNodeService,
                                    nodeStateTransitionService) {
    var ctrl = this;

    ctrl.nodes = [];
    ctrl.nodesSrc = [];
    ctrl.actions = actions;

    ctrl.putNodeInMaintenanceMode = putNodeInMaintenanceMode;
    ctrl.putNodesInMaintenanceMode = putNodesInMaintenanceMode;
    ctrl.removeNodeFromMaintenanceMode = removeNodeFromMaintenanceMode;
    ctrl.removeNodesFromMaintenanceMode = removeNodesFromMaintenanceMode;
    ctrl.enrollNode = enrollNode;
    ctrl.editNode = editNode;
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

    // Listen for the creation of new nodes, and update the node list
    var enrollNodeHandler =
        $rootScope.$on(ironicEvents.ENROLL_NODE_SUCCESS,
                       function() {
                         init();
                       });

    var deleteNodeHandler = $rootScope.$on(ironicEvents.DELETE_NODE_SUCCESS,
                                           function() {
                                             init();
                                           });

    var editNodeHandler = $rootScope.$on(ironicEvents.EDIT_NODE_SUCCESS,
                                         function() {
                                           init();
                                         });

    var createPortHandler = $rootScope.$on(ironicEvents.CREATE_PORT_SUCCESS,
                                           function() {
                                             init();
                                           });

    var deletePortHandler = $rootScope.$on(ironicEvents.DELETE_PORT_SUCCESS,
                                           function() {
                                             init();
                                           });

    $scope.$on('destroy', function() {
      enrollNodeHandler();
      deleteNodeHandler();
      editNodeHandler();
      createPortHandler();
      deletePortHandler();
    });

    init();

    // RETRIVE NODES AND PORTS

    function init() {
      retrieveNodes();
    }

    function retrieveNodes() {
      ironic.getNodes().then(onGetNodes);
    }

    function onGetNodes(response) {
      var promises = [];
      angular.forEach(response.data.items, function (node) {
        node.id = node.uuid;
        promises.push(retrievePorts(node));
      });
      $q.all(promises).then(function() {
        ctrl.nodesSrc = response.data.items;
      });
    }

    function retrievePorts(node) {
      return ironic.getPortsWithNode(node.uuid).then(
        function (response) {
          node.ports = response.data.items;
        }
      );
    }

    function putNodeInMaintenanceMode(node) {
      maintenanceService.putNodeInMaintenanceMode(node);
    }

    function putNodesInMaintenanceMode(nodes) {
      maintenanceService.putNodesInMaintenanceMode(nodes);
    }

    function removeNodeFromMaintenanceMode(node) {
      maintenanceService.removeNodeFromMaintenanceMode(node);
    }

    function removeNodesFromMaintenanceMode(nodes) {
      maintenanceService.removeNodesFromMaintenanceMode(nodes);
    }

    function enrollNode() {
      enrollNodeService.enrollNode();
    }

    function editNode(node) {
      editNodeService.modal(node);
    }

    function refresh() {
      init();
    }

    function getNodeStateTransitions(node) {
      return nodeStateTransitionService.getTransitions(node.provision_state);
    }
  }

})();
