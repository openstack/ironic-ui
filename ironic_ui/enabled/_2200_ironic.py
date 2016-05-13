# Copyright (c) 2016 Hewlett Packard Enterprise Development Company LP
# Copyright (c) 2016 Cray Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
# implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# The name of the panel to be added to HORIZON_CONFIG. Required.
PANEL = 'ironic'
# The name of the dashboard the PANEL associated with. Required.
PANEL_DASHBOARD = 'admin'
# The name of the panel group the PANEL is associated with.
PANEL_GROUP = 'admin'
# Python panel class of the PANEL to be added.
ADD_PANEL = 'ironic_ui.content.ironic.panel.Ironic'
# A list of applications to be prepended to INSTALLED_APPS
ADD_INSTALLED_APPS = ['ironic_ui', ]
# A list of AngularJS modules to be loaded when Angular bootstraps.
ADD_ANGULAR_MODULES = ['horizon.dashboard.admin.ironic']
# Automatically discover static resources in installed apps
AUTO_DISCOVER_STATIC_FILES = True
