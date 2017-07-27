#
# Copyright 2015, 2016 Hewlett Packard Enterprise Development Company LP
# Copyright 2016 Cray Inc.
# Copyright 2017 Intel Corporation
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from django.views import generic

from ironic_ui.api import ironic

from openstack_dashboard.api.rest import urls

from openstack_dashboard.api.rest import utils as rest_utils

LOGICAL_NAME_PATTERN = '[a-zA-Z0-9-._~]+'


@urls.register
class Nodes(generic.View):

    url_regex = r'ironic/nodes/$'

    @rest_utils.ajax()
    def get(self, request):
        """Get the list of nodes.

        :param request: HTTP request.
        :return: nodes.
        """
        nodes = ironic.node_list(request)
        return {
            'nodes': [i.to_dict() for i in nodes]
        }

    @rest_utils.ajax(data_required=True)
    def post(self, request):
        """Create an Ironic node

        :param request: HTTP request
        """
        params = request.DATA.get('node')
        return ironic.node_create(request, params)

    @rest_utils.ajax(data_required=True)
    def delete(self, request):
        """Delete an Ironic node from inventory

        :param request: HTTP request
        """
        params = request.DATA.get('node')
        return ironic.node_delete(request, params)


@urls.register
class Node(generic.View):

    url_regex = r'ironic/nodes/(?P<node_id>{})$'.format(LOGICAL_NAME_PATTERN)

    @rest_utils.ajax()
    def get(self, request, node_id):
        """Get information on a specific node.

        :param request: HTTP request.
        :param node_id: Node id.
        :return: node.
        """
        return ironic.node_get(request, node_id).to_dict()

    @rest_utils.ajax(data_required=True)
    def patch(self, request, node_id):
        """Update an Ironic node

        :param request: HTTP request
        :param node_uuid: Node uuid.
        """
        patch = request.DATA.get('patch')
        return ironic.node_update(request, node_id, patch)


@urls.register
class Ports(generic.View):

    url_regex = r'ironic/ports/$'

    @rest_utils.ajax()
    def get(self, request):
        """Get the list of ports associated with a specified node.

        :param request: HTTP request
        :return: List of ports.
        """
        node_id = request.GET.get('node_id')
        ports = ironic.node_list_ports(request, node_id)
        return {
            'ports': [i.to_dict() for i in ports]
        }

    @rest_utils.ajax(data_required=True)
    def post(self, request):
        """Create a network port

        :param request: HTTP request
        :return: Port
        """
        port = request.DATA.get('port')
        return ironic.port_create(request, port).to_dict()

    @rest_utils.ajax(data_required=True)
    def delete(self, request):
        """Delete a network port

        :param request: HTTP request
        """
        params = request.DATA.get('port_uuid')
        return ironic.port_delete(request, params)


@urls.register
class Port(generic.View):

    url_regex = r'ironic/ports/(?P<port_id>[0-9a-f-]+)$'

    @rest_utils.ajax(data_required=True)
    def patch(self, request, port_id):
        """Update an Ironic port

        :param request: HTTP request
        :param port_id: Port id.
        """
        patch = request.DATA.get('patch')
        return ironic.port_update(request, port_id, patch)


@urls.register
class StatesPower(generic.View):

    url_regex = r'ironic/nodes/(?P<node_id>{})/states/power$'. \
                format(LOGICAL_NAME_PATTERN)

    @rest_utils.ajax(data_required=True)
    def patch(self, request, node_id):
        """Set the power state for a specified node.

        :param request: HTTP request.
        :param node_id: Node name or uuid
        :return: Return code
        """
        return ironic.node_set_power_state(request,
                                           node_id,
                                           request.DATA.get('state'),
                                           request.DATA.get('soft'))


@urls.register
class StatesProvision(generic.View):

    url_regex = r'ironic/nodes/(?P<node_uuid>{})/states/provision$'. \
                format(LOGICAL_NAME_PATTERN)

    @rest_utils.ajax(data_required=True)
    def put(self, request, node_uuid):
        """Set the provision state for a specified node.

        :param request: HTTP request.
        :param node_id: Node uuid
        :return: Return code
        """
        verb = request.DATA.get('verb')
        clean_steps = request.DATA.get('clean_steps')
        return ironic.node_set_provision_state(request,
                                               node_uuid,
                                               verb,
                                               clean_steps)


@urls.register
class StatesConsole(generic.View):

    url_regex = r'ironic/nodes/(?P<node_uuid>{})/states/console$'. \
                format(LOGICAL_NAME_PATTERN)

    @rest_utils.ajax()
    def get(self, request, node_uuid):
        """Get connection information for the node's console

        :param request: HTTP request.
        :param node_id: Node uuid
        :return: Connection information
        """
        return ironic.node_get_console(request, node_uuid)

    @rest_utils.ajax(data_required=True)
    def put(self, request, node_uuid):
        """Start or stop the serial console.

        :param request: HTTP request.
        :param node_id: Node uuid
        :return: Return code
        """
        return ironic.node_set_console_mode(request,
                                            node_uuid,
                                            request.DATA.get('enabled'))


@urls.register
class Maintenance(generic.View):

    url_regex = r'ironic/nodes/(?P<node_id>{})/maintenance$'. \
                format(LOGICAL_NAME_PATTERN)

    @rest_utils.ajax()
    def patch(self, request, node_id):
        """Put a specified node into maintenance state

        :param request: HTTP request.
        :param node_id: Node name or uuid
        :return: Return code
        """
        maint_reason = request.DATA.get('maint_reason')
        return ironic.node_set_maintenance(
            request,
            node_id,
            'on',
            maint_reason=maint_reason)

    @rest_utils.ajax()
    def delete(self, request, node_id):
        """Take a specified node out of the maintenance state

        :param request: HTTP request.
        :param node_id: Node name or uuid
        :return: Return code
        """
        return ironic.node_set_maintenance(request, node_id, 'off')


@urls.register
class Validate(generic.View):

    url_regex = r'ironic/nodes/(?P<node_id>{})/validate$'. \
                format(LOGICAL_NAME_PATTERN)

    @rest_utils.ajax()
    def get(self, request, node_id):
        """Validate a specified node

        :param request: HTTP request.
        :param node_id: Node name or uuid
        :return: List of dictionaries of interface statuses
        """
        return ironic.node_validate(request, node_id)


@urls.register
class BootDevice(generic.View):

    url_regex = r'ironic/nodes/(?P<node_id>{})/boot_device$'. \
                format(LOGICAL_NAME_PATTERN)

    @rest_utils.ajax()
    def get(self, request, node_id):
        """Get the boot device for a specified node

        :param request: HTTP request.
        :param node_id: Node name or uuid
        :return: Dictionary with keys "boot_device" and "persistent"
        """
        return ironic.node_get_boot_device(request, node_id)

    @rest_utils.ajax(data_required=True)
    def put(self, request, node_id):
        """Set the boot device for a specific node

        :param request: HTTP request.
        :param node_id: Node name or uuid
        :return: null.
        """
        return ironic.node_set_boot_device(
            request,
            node_id,
            request.DATA.get('boot_device'),
            persistent=request.DATA.get('persistent'))


@urls.register
class SupportedBootDevices(generic.View):

    url_regex = r'ironic/nodes/(?P<node_id>{})/boot_device/supported$' . \
                format(LOGICAL_NAME_PATTERN)

    @rest_utils.ajax()
    def get(self, request, node_id):
        """Get the list of supported boot devices for a specified node

        :param request: HTTP request.
        :param node_id: Node name or uuid
        :return: List of supported boot devices
        """
        return ironic.node_get_supported_boot_devices(request, node_id)


@urls.register
class Drivers(generic.View):

    url_regex = r'ironic/drivers/$'

    @rest_utils.ajax()
    def get(self, request):
        """Get the list of drivers

        :param request: HTTP request
        :return: drivers
        """
        drivers = ironic.driver_list(request)
        return {
            'drivers': [i.to_dict() for i in drivers]
        }


@urls.register
class DriverProperties(generic.View):

    url_regex = r'ironic/drivers/(?P<driver_name>[0-9a-zA-Z_-]+)/properties$'

    @rest_utils.ajax()
    def get(self, request, driver_name):
        """Get the properties associated with a specified driver

        :param request: HTTP request
        :param driver_name: Driver name
        :return: Dictionary of properties
        """
        return ironic.driver_properties(request, driver_name)


@urls.register
class Portgroups(generic.View):

    url_regex = r'ironic/portgroups/$'

    @rest_utils.ajax()
    def get(self, request):
        """Get the list of portgroups associated with a specified node.

        :param request: HTTP request.
        :return: List of portgroups.
        """
        portgroups = ironic.portgroup_list(request,
                                           request.GET.get('node_id'))
        return {
            'portgroups': [i.to_dict() for i in portgroups]
        }

    @rest_utils.ajax(data_required=True)
    def post(self, request):
        """Create a portgroup.

        :param request: HTTP request.
        :return: Portgroup.
        """
        return ironic.portgroup_create(request, request.DATA).to_dict()

    @rest_utils.ajax(data_required=True)
    def delete(self, request):
        """Delete a portgroup.

        :param request: HTTP request.
        """
        return ironic.portgroup_delete(request,
                                       request.DATA.get('portgroup_id'))


@urls.register
class Portgroup(generic.View):

    url_regex = r'ironic/portgroups/(?P<portgroup_id>{})$'. \
                format(LOGICAL_NAME_PATTERN)

    @rest_utils.ajax(data_required=True)
    def patch(self, request, portgroup_id):
        """Update an Ironic portgroup

        :param request: HTTP request
        :param portgroup_id: UUID or name of portgroup.
        """
        patch = request.DATA.get('patch')
        return ironic.portgroup_update(request, portgroup_id, patch)


@urls.register
class PortgroupPorts(generic.View):

    url_regex = r'ironic/portgroups/(?P<portgroup_id>{})/ports$'. \
                format(LOGICAL_NAME_PATTERN)

    @rest_utils.ajax()
    def get(self, request, portgroup_id):
        """Get the ports for a specified portgroup.

        :param request: HTTP request.
        :param portgroup_id: UUID or name of portgroup.
        :return: List of port objects.
        """
        ports = ironic.portgroup_get_ports(request, portgroup_id)
        return {
            'ports': [i.to_dict() for i in ports]
        }
