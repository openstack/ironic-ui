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


from openstack_dashboard.test.integration_tests import helpers


class TestIronicDashboardInstalled(helpers.AdminTestCase):
    def test_ironic_bare_metal_provisioning_page_opened(self):
        ironic_page = (
            self.home_pg.go_to_admin_system_ironicbaremetalprovisioningpage())
        title = 'Ironic Bare Metal Provisioning - OpenStack Dashboard'
        self.assertEqual(ironic_page.page_title, title)
