#
#  Copyright 2015, 2016 Hewlett Packard Enterprise Development Company LP
#  Copyright 2016 Cray Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import logging

from django.conf import settings

from ironicclient import client

from horizon.utils.memoized import memoized  # noqa

from openstack_dashboard.api import base


LOG = logging.getLogger(__name__)

DEFAULT_IRONIC_API_VERSION = '1.6'
DEFAULT_INSECURE = False
DEFAULT_CACERT = None

IRONIC_CLIENT_CLASS_NAME = 'baremetal'


@memoized
def ironicclient(request):
    """Returns a client connected to the Ironic backend.

    :param request: HTTP request.
    :return: Ironic client.
    """
    insecure = getattr(settings, 'OPENSTACK_SSL_NO_VERIFY', DEFAULT_INSECURE)
    cacert = getattr(settings, 'OPENSTACK_SSL_CACERT', DEFAULT_CACERT)
    ironic_url = base.url_for(request, IRONIC_CLIENT_CLASS_NAME)

    return client.Client(1,
                         ironic_url,
                         os_ironic_api_version=DEFAULT_IRONIC_API_VERSION,
                         project_id=request.user.project_id,
                         token=request.user.token.id,
                         insecure=insecure,
                         cacert=cacert)


def node_list(request):
    """Retrieve a list of nodes.

    :param request: HTTP request.
    :return: A list of nodes.

    http://docs.openstack.org/developer/python-ironicclient/api/ironicclient.v1.node.html#ironicclient.v1.node.NodeManager.list
    """
    node_manager = ironicclient(request).node
    return node_manager.list(detail=True, limit=0)


def node_get(request, node_id):
    """Retrieve a node.

    :param request: HTTP request.
    :param node_id: The UUID of the node.
    :return: node.

    http://docs.openstack.org/developer/python-ironicclient/api/ironicclient.v1.node.html#ironicclient.v1.node.NodeManager.get
    """
    return ironicclient(request).node.get(node_id)


def node_list_ports(request, node_id):
    """List all the ports on a given node.

    :param request: HTTP request.
    :param node_id: The UUID of the node.
    :return: A full list of ports. (limit=0)

    http://docs.openstack.org/developer/python-ironicclient/api/ironicclient.v1.node.html#ironicclient.v1.node.NodeManager.list_ports
    """
    return ironicclient(request).node.list_ports(node_id, limit=0, detail=True)


def node_set_power_state(request, node_id, state):
    """Set power state for a given node.

    :param request: HTTP request.
    :param node_id: The UUID of the node.
    :param state: the power state to set.
    :return: node.

    http://docs.openstack.org/developer/python-ironicclient/api/ironicclient.v1.node.html#ironicclient.v1.node.NodeManager.set_power_state
    """
    return ironicclient(request).node.set_power_state(node_id, state)


def node_set_maintenance(request, node_id, state, maint_reason=None):
    """Set the maintenance mode on a given node.

    :param request: HTTP request.
    :param node_id: The UUID of the node.
    :param state: The maintenance state to set.
    :return: node.

    http://docs.openstack.org/developer/python-ironicclient/api/ironicclient.v1.node.html#ironicclient.v1.node.NodeManager.set_maintenance
    """
    return ironicclient(request).node.set_maintenance(
        node_id,
        state,
        maint_reason=maint_reason)


def node_create(request, params):
    """Create a node

    :param request: HTTP request.
    :param params: Dictionary of node parameters
    """
    node_manager = ironicclient(request).node
    node = node_manager.create(**params)
    field_list = ['chassis_uuid',
                  'driver',
                  'driver_info',
                  'properties',
                  'extra',
                  'uuid',
                  'name']
    return dict([(f, getattr(node, f, '')) for f in field_list])


def node_delete(request, node_id):
    """Delete a node from inventory.

    :param request: HTTP request.
    :param node_id: The UUID of the node.
    :return: node.

    http://docs.openstack.org/developer/python-ironicclient/api/ironicclient.v1.node.html#ironicclient.v1.node.NodeManager.delete
    """
    return ironicclient(request).node.delete(node_id)


def driver_list(request):
    """Retrieve a list of drivers.

    :param request: HTTP request.
    :return: A list of drivers.
    """
    return ironicclient(request).driver.list()


def driver_properties(request, driver_name):
    """Retrieve the properties of a specified driver

    :param request: HTTP request
    :param driver_name: Name of the driver
    :return: Property list
    """
    return ironicclient(request).driver.properties(driver_name)


def port_create(request, params):
    """Create network port

    :param request: HTTP request
    :param params: Port creation parameters
    :return: Port
    """
    port_manager = ironicclient(request).port
    return port_manager.create(**params)


def port_delete(request, port_uuid):
    """Delete a network port

    :param request: HTTP request
    :param port_uuid: Port uuid
    :return: Port
    """
    return ironicclient(request).port.delete(port_uuid)
