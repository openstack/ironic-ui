/*
 * © Copyright 2016 Hewlett Packard Enterprise Development Company LP
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
    'horizon.app.core.openstack-service-api.ironic',
    'horizon.dashboard.admin.ironic.actions',
    'horizon.dashboard.admin.basePath'
  ];

  function IronicNodeListController($scope, ironic, actions, basePath) {
    var ctrl = this;

    ctrl.nodes = [];
    ctrl.nodeSrc = [];
    ctrl.basePath = basePath;
    ctrl.actions = actions;

    init();

    // RETRIVE NODES AND PORTS

    function init() {
      retrieveNodes();
    }

    function retrieveNodes() {
      ironic.getNodes().then(onGetNodes);
    }

    function onGetNodes(response) {
      ctrl.nodesSrc = response.data.items;
      ctrl.nodesSrc.forEach(function (node) {
        node.id = node.uuid;
        retrievePorts(node);
      });
    }

    function retrievePorts(node) {
      ironic.getPortsWithNode(node.uuid).then(
        function (response) {
          node.ports = response.data.items;
        }
      );
    }
  }

})();
