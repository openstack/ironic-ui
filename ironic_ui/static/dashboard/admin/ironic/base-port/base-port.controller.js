/*
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
(function() {
  'use strict';

  /**
   * Controller used to support operations on an Ironic port
   */
  angular
    .module('horizon.dashboard.admin.ironic')
    .controller('BasePortController', BasePortController);

  BasePortController.$inject = [
    '$uibModalInstance',
    'horizon.dashboard.admin.ironic.validMacAddressPattern',
    'horizon.dashboard.admin.ironic.validDatapathIdPattern',
    'horizon.dashboard.admin.ironic.form-field.service',
    'horizon.app.core.openstack-service-api.ironic',
    'horizon.dashboard.admin.ironic.property-collection.service',
    'ctrl',
    'node'];

  /**
   * @description Utility class used to manage local-link-connection
   *   form fields.
   *
   * @param {string} formFieldService - Provider service for creating
   *   form fields.
   * @param {string} validMacAddressPattern - Regular expression
   *   pattern used to test for valid mac addresses.
   * @param {string} validDatapathIdPattern - Regular expression
   *   pattern used to test for valid datapath ids.
   * @return {void}
   */
  function LocalLinkConnectionMgr(formFieldService,
                                  validMacAddressPattern,
                                  validDatapathIdPattern) {
    var mgr = this;

    mgr.port_id = new formFieldService.FormField(
      {id: 'port_id', title: 'port_id'});

    mgr.switch_id = new formFieldService.FormField(
        {id: 'switch_id',
         title: 'switch_id',
         desc: gettext("MAC address or OpenFlow datapath ID"),
         pattern: new RegExp(validMacAddressPattern + '|' +
                             validDatapathIdPattern)});

    mgr.switch_info = new formFieldService.FormField(
      {id: 'switch_info', title: 'switch_info'});

    mgr.fields = {
      port_id: mgr.port_id,
      switch_id: mgr.switch_id,
      switch_info: mgr.switch_info
    };

    /**
     * Update the required property of each field based on current values
     *
     * @return {void}
     */
    mgr.update = function() {
      var required = mgr.port_id.hasValue() || mgr.switch_id.hasValue();
      mgr.port_id.required = required;
      mgr.switch_id.required = required;
    };

    // Add form field value change handlers
    angular.forEach(mgr.fields, function(field) {
      field.change = mgr.update;
    });

    /**
     * Generate an attribute object that conforms to the format
     * required for port creation using the Ironic client
     *
     * @return {object|null} local_link_connection attribute object.
     * A value of null is returned if the local-link-connection
     * information is incomplete.
     */
    mgr.toPortAttr = function() {
      var attr = null;
      if (mgr.port_id.hasValue() &&
          mgr.switch_id.hasValue()) {
        attr = {};
        attr.port_id = mgr.port_id.value;
        attr.switch_id = mgr.switch_id.value;

        if (mgr.switch_info.hasValue()) {
          attr.switch_info = mgr.switch_info.value;
        }
      }
      return attr;
    };

    /**
     * @description Set values of form fields;
     *
     * @param {object} values - Dictionary of values indexed by
     *   property-name
     * @return {void}
     */
    mgr.setValues = function(values) {
      angular.forEach(mgr.fields, function(field, propertyName) {
        if (angular.isDefined(values[propertyName])) {
          field.value = values[propertyName];
        }
      });
    };

    /**
     * @description Disable the local-link-connection form fields.
     *
     * @param {string} reason - Optional reason for disabling fields.
     * @return {void}
     */
    mgr.disable = function(reason) {
      angular.forEach(mgr.fields, function(item) {
        item.disable(reason);
      });
    };
  }

  function BasePortController($uibModalInstance,
                              validMacAddressPattern,
                              validDatapathIdPattern,
                              formFieldService,
                              ironic,
                              propertyCollectionService,
                              ctrl,
                              node) {
    ctrl.address = new formFieldService.FormField({
      id: "macAddress",
      title: gettext("MAC address"),
      desc: gettext("MAC address for this port. Required."),
      pattern: new RegExp(validMacAddressPattern),
      value: null,
      required: true,
      autoFocus: true
    });

    ctrl.pxeEnabled = new formFieldService.FormField({
      type: "radio",
      id: "pxeEnabled",
      title: gettext("PXE enabled"),
      desc: gettext(
        "Indicates whether this port should be used when PXE booting this node"),
      options: ['True', 'False'],
      value: 'True'});

    ctrl.portgroup_uuid = new formFieldService.FormField({
      type: "select",
      id: "portgroup-uuid",
      title: gettext("Portgroup"),
      desc: gettext("Portgroup that this port belongs to"),
      portgroups: [],
      options: "portgroup.uuid as portgroup.name ? portgroup.name : portgroup.uuid for portgroup in field.portgroups", // eslint-disable-line max-len
      value: null});

    // Object used to manage local-link-connection form fields
    ctrl.localLinkConnection =
      new LocalLinkConnectionMgr(formFieldService,
                                 validMacAddressPattern,
                                 validDatapathIdPattern);

    ironic.getPortgroups(node.uuid).then(function(portgroups) {
      var field = ctrl.portgroup_uuid;

      if (portgroups.length > 0) {
        field.portgroups.push({uuid: null,
                               name: gettext("Select a portgroup")});
      }
      field.portgroups = field.portgroups.concat(portgroups);

      if (portgroups.length === 0) {
        field.disable();
      }
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
