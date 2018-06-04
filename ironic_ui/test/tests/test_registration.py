# Copyright 2015 Cisco Systems, Inc.
# Copyright (c) 2016 Hewlett Packard Enterprise Development Company LP
#
#    Licensed under the Apache License, Version 2.0 (the "License"); you may
#    not use this file except in compliance with the License. You may obtain
#    a copy of the License at
#
#         http://www.apache.org/licenses/LICENSE-2.0
#
#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
#    WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
#    License for the specific language governing permissions and limitations
#    under the License.

import horizon
from ironic_ui.content.ironic import panel as i_panel
from openstack_dashboard.test import helpers as test


class RegistrationTests(test.TestCase):
    def test_registered(self):
        dashboard = horizon.get_dashboard('admin')
        panel = dashboard.get_panel('ironic')

        self.assertEqual(panel.__class__, i_panel.Ironic)
