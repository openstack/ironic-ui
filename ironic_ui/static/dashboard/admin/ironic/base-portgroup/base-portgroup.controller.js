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
   * Controller used to support operations on an Ironic portgroup
   */
  angular
    .module('horizon.dashboard.admin.ironic')
    .controller('BasePortgroupController', BasePortgroupController);

  BasePortgroupController.$inject = [
    '$uibModalInstance',
    'horizon.dashboard.admin.ironic.validMacAddressPattern',
    'horizon.dashboard.admin.ironic.validDatapathIdPattern',
    'horizon.dashboard.admin.ironic.form-field.service',
    'horizon.dashboard.admin.ironic.property-collection.service',
    'ctrl'
  ];

  function BasePortgroupController($uibModalInstance,
                                   validMacAddressPattern,
                                   validDatapathIdPattern,
                                   formFieldService,
                                   propertyCollectionService,
                                   ctrl) {

    ctrl.address = new formFieldService.FormField({
      id: "macAddress",
      title: gettext("MAC address"),
      desc: gettext("MAC address for this portgroup."),
      pattern: new RegExp(validMacAddressPattern),
      value: null,
      autoFocus: true
    });

    ctrl.name = new formFieldService.FormField({
      id: "portgroupName",
      title: gettext("Name"),
      desc: gettext("Name for the portgroup.")
    });

    ctrl.standalone_ports_supported = new formFieldService.FormField({
      type: "radio",
      id: "standalonePorts",
      title: gettext("Standalone Ports Supported"),
      desc: gettext(
        "Specifies whether ports in this portgroup can be used as standalone ports."), // eslint-disable-line max-len
      options: [{label: 'True', value: true},
                {label: 'False', value: false}],
      value: true});

    var modeOptions = function(modes) {
      var options = [];
      angular.forEach(modes, function(mode) {
        options.push({label:mode, value: mode});
      });
      return options;
    };

    ctrl.mode = new formFieldService.FormField({
      type: "radio",
      id: "mode",
      title: gettext("Mode"),
      desc: gettext("Linux portgroup mode. For possible values refer to https://www.kernel.org/doc/Documentation/networking/bonding.txt"), // eslint-disable-line max-len
      options: modeOptions(['balance-rr',
                            'active-backup',
                            'balance-xor',
                            'broadcast',
                            '802.3ad',
                            'balance-tlb',
                            'balance-alb']),
      value: 'active-backup'});

    ctrl.properties = new propertyCollectionService.PropertyCollection({
      id: 'properties',
      title: gettext('Properties'),
      addPropertyLabel: gettext('Add Property'),
      placeholder: gettext('Property Name')
    });

    ctrl.extra = new propertyCollectionService.PropertyCollection({
      id: 'extra',
      title: gettext('Extras'),
      addPropertyLabel: gettext('Add Extra'),
      placeholder: gettext('Property Name')
    });

    /**
     * Cancel the modal
     *
     * @return {void}
     */
    ctrl.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };
  }
})();
