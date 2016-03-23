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
    '$location',
    'horizon.app.core.openstack-service-api.ironic',
    'horizon.dashboard.admin.ironic.actions',
    'horizon.dashboard.admin.basePath',
    'horizon.dashboard.admin.ironic.maintenance.service'
  ];

  function IronicNodeDetailsController($location,
                                       ironic,
                                       actions,
                                       basePath,
                                       maintenanceService) {
    var ctrl = this;
    var path = basePath + 'ironic/node-details/sections/';

    ctrl.actions = actions;

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

    ctrl.basePath = basePath;
    ctrl.re_uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
    ctrl.isUuid = isUuid;
    ctrl.getVifPortId = getVifPortId;
    ctrl.putNodeInMaintenanceMode = putNodeInMaintenanceMode;
    ctrl.removeNodeFromMaintenanceMode = removeNodeFromMaintenanceMode;

    init();

    /**
     * @name horizon.dashboard.admin.ironic.NodeDetailsController.init
     * @description Initialize the controller instance based on the current page url.
     *
     * @return {void}
     */
    function init() {
      // Fetch the Node ID from the URL.
      var pattern = /(.*\/admin\/ironic\/)(.+)\/(detail)?/;
      var uuid = $location.absUrl().match(pattern)[2];

      retrieveNode(uuid).then(function () {
        retrievePorts(uuid);
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
      return ironic.getNode(uuid).then(function (response) {
        ctrl.node = response.data;
      });
    }

    /**
     * @name horizon.dashboard.admin.ironic.NodeDetailsController.retrievePorts
     * @description Retrieve the ports associated with a specified node, and store
     * them in the controller instance.
     *
     * @param {string} nodeId – Node name or UUID
     * @return {void}
     */
    function retrievePorts(nodeId) {
      ironic.getPortsWithNode(nodeId).then(function (response) {
        ctrl.ports = response.data.items;
      });
    }

    /**
     * @name horizon.dashboard.admin.ironic.NodeDetailsController.isUuid
     * @description Test whether a string is an OpenStack UUID
     *
     * @param {string} str – string
     * @return {boolean} True if the string is an OpenStack UUID, otherwise false
     */
    function isUuid(str) {
      return !!str.match(ctrl.re_uuid);
    }

    /**
     * @name horizon.dashboard.admin.ironic.NodeDetailsController.getVifPortId
     * @description Get the vif_port_id property of a specified port
     *
     * @param {object} port – instance of port
     * @return {string} Value of vif_port_id property or "" if the property does not exist
     */
    function getVifPortId(port) {
      return angular.isDefined(port.extra) &&
             angular.isDefined(port.extra.vif_port_id)
             ? port.extra.vif_port_id : "";
    }

    function putNodeInMaintenanceMode() {
      maintenanceService.putNodeInMaintenanceMode(ctrl.node);
    }

    function removeNodeFromMaintenanceMode() {
      maintenanceService.removeNodeFromMaintenanceMode(ctrl.node);
    }
  }
})();
