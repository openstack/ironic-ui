/*
 * Copyright 2017 Cray Inc.
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
(function() {
  'use strict';

  /**
   * Controller used to edit an existing Ironic node
   */
  angular
    .module('horizon.dashboard.admin.ironic')
    .controller('EditNodeController', EditNodeController);

  EditNodeController.$inject = [
    '$rootScope',
    '$controller',
    '$uibModalInstance',
    'horizon.framework.widgets.toast.service',
    'horizon.app.core.openstack-service-api.ironic',
    'horizon.dashboard.admin.ironic.events',
    'horizon.dashboard.admin.ironic.edit-node.service',
    'horizon.dashboard.admin.ironic.update-patch.service',
    '$log',
    'node'
  ];

  function EditNodeController($rootScope,
                              $controller,
                              $uibModalInstance,
                              toastService,
                              ironic,
                              ironicEvents,
                              editNodeService,
                              updatePatchService,
                              $log,
                              node) {
    var ctrl = this;

    $controller('BaseNodeController',
                {ctrl: ctrl,
                 $uibModalInstance: $uibModalInstance});

    ctrl.modalTitle = gettext("Edit Node");
    ctrl.submitButtonTitle = gettext("Update Node");

    ctrl.baseNode = null;

    var instanceInfoId = "instance_info";
    ctrl.propertyCollections.push(
      {id: instanceInfoId,
       formId: "instance_info_form",
       title: gettext("Instance Info"),
       addPrompt: gettext("Add Instance Property"),
       placeholder: gettext("Instance Property Name")});

    ctrl.node[instanceInfoId] = {};

    ctrl.node[instanceInfoId] = {};

    init(node);

    function init(node) {
      ctrl._loadDrivers().then(function() {
        _loadNodeData(node.uuid);
      });
      ctrl._getImages();
    }

    function _loadNodeData(nodeId) {
      ironic.getNode(nodeId).then(function(node) {
        ctrl.baseNode = node;

        ctrl.node.name = node.name;
        ctrl.node.resource_class = node.resource_class;
        ctrl.node.network_interface = node.network_interface;
        for (var i = 0; i < ctrl.drivers.length; i++) {
          if (ctrl.drivers[i].name === node.driver) {
            ctrl.selectedDriver = ctrl.drivers[i];
            break;
          }
        }

        ctrl.loadDriverProperties(node.driver).then(function() {
          angular.forEach(node.driver_info, function(value, property) {
            if (angular.isDefined(ctrl.driverProperties[property])) {
              ctrl.driverProperties[property].inputValue = value;
            }
          });
        });

        ctrl.node.properties = angular.copy(node.properties);
        ctrl.node.extra = angular.copy(node.extra);
        ctrl.node.instance_info = angular.copy(node.instance_info);
        ctrl.node.uuid = node.uuid;
      });
    }

    /**
     * @description Construct a patch that converts source node into
     * target node
     *
     * @param {object} sourceNode - Source node
     * @param {object} targetNode - Target node
     * @return {object[]} Array of patch instructions
     */
    ctrl.buildPatch = function(sourceNode, targetNode) {
      var patcher = new updatePatchService.UpdatePatch();
      var PatchItem = function PatchItem(id, path) {
        this.id = id;
        this.path = path;
      };
      angular.forEach([new PatchItem("name", "/name"),
                       new PatchItem("resource_class", "/resource_class"),
                       new PatchItem("network_interface", "/network_interface"),
                       new PatchItem("driver", "/driver"),
                       new PatchItem("properties", "/properties"),
                       new PatchItem("extra", "/extra"),
                       new PatchItem("driver_info", "/driver_info"),
                       new PatchItem("instance_info", "/instance_info")],
                      function(item) {
                        patcher.buildPatch(sourceNode[item.id],
                                           targetNode[item.id],
                                           item.path);
                      });

      return patcher.getPatch();
    };

    ctrl.submit = function() {
      angular.forEach(ctrl.driverProperties, function(property, name) {
        $log.debug(name +
                   ", required = " + property.isRequired() +
                   ", active = " + property.isActive() +
                   ", input-value = " + property.getInputValue() +
                   ", default-value = " + property.getDefaultValue());
        if (property.isActive() &&
            property.getInputValue() &&
            property.getInputValue() !== property.getDefaultValue()) {
          $log.debug("Setting driver property " + name + " to " +
                     property.inputValue);
          ctrl.node.driver_info[name] = property.inputValue;
        }
      });

      $log.info("Updating node " + JSON.stringify(ctrl.baseNode));
      $log.info("to " + JSON.stringify(ctrl.node));

      var patch = ctrl.buildPatch(ctrl.baseNode, ctrl.node);
      $log.info("patch = " + JSON.stringify(patch.patch));
      if (patch.status === updatePatchService.UpdatePatch.status.OK) {
        ironic.updateNode(ctrl.baseNode.uuid, patch.patch).then(function(node) {
          $rootScope.$emit(ironicEvents.EDIT_NODE_SUCCESS);
          $uibModalInstance.close(node);
        });
      } else {
        toastService.add('error',
                         gettext('Unable to create node update patch.'));
      }
    };
  }
})();
