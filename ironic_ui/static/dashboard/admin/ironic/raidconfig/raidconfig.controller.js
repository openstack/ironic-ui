/*
 * Copyright 2017 Intel Corporation
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
   * @ngdoc controller
   * @name horizon.dashboard.admin.ironic:RaidConfigController
   * @ngController
   *
   * @description
   * Controller used to prompt the user for information associated with
   * setting the target raid configuration of a node
   */
  angular
    .module('horizon.dashboard.admin.ironic')
    .controller('RaidConfigController', RaidConfigController);

  RaidConfigController.$inject = [
    '$uibModalInstance',
    'horizon.dashboard.admin.ironic.form-field.service',
    'horizon.app.core.openstack-service-api.ironic',
    'node'
  ];

  function RaidConfigController($uibModalInstance,
                                formFieldService,
                                ironic,
                                node) {
    var ctrl = this;

    ctrl.modalTitle = gettext("Set RAID Configuration");

    ctrl.target_raid_config = null;
    ctrl.logicalDisks = [];
    ctrl.logicalDisksSrc = [];

    ironic.getNode(node.uuid).then(function() {
      ctrl.logicalDisksSrc = angular.copy(node.raid_config.logical_disks);
    });

    ctrl.size_gb = new formFieldService.FormField({
      id: "size_gb",
      title: gettext("Size GB"),
      desc: gettext("Specifies logical disk size in GiB. Required."),
      pattern: new RegExp('^\\d+$'),
      value: null,
      required: true,
      autoFocus: true
    });

    ctrl.raid_level = new formFieldService.FormField({
      type: "radio",
      id: "raid_level",
      title: gettext("RAID Level"),
      desc: gettext("Specifies RAID Level."),
      options: ['JBOD', '0', '1', '2', '5', '6', '1+0', '5+0', '6+0'],
      value: '0'});

    ctrl.root_volume = new formFieldService.FormField({
      type: "radio",
      id: "root_volume",
      title: gettext("Root Volume."),
      desc: gettext(
        "Specifies whether root volume or not."),
      options: ['True', 'False'],
      value: 'False'});

    ctrl.addLogicalDisk = function() {
      ctrl.logicalDisks.push({raid_level: ctrl.raid_level.value,
                              size_gb: Number(ctrl.size_gb.value),
                              is_root_volume: ctrl.root_volume.value === 'True'});
    };

    ctrl.deleteLogicalDisk = function(disk) {
      var index = ctrl.logicalDisks.indexOf(disk);
      if (index !== -1) {
        ctrl.logicalDisks.splice(index, 1);
      }
    };

    ctrl.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };

    ctrl.setTargetRaidConfig = function() {
      $uibModalInstance.close({target_raid_config: {logical_disks: ctrl.logicalDisks}});
    };
  }
})();
