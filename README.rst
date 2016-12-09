========================
Team and repository tags
========================

.. image:: http://governance.openstack.org/badges/ironic-ui.svg
    :target: http://governance.openstack.org/reference/tags/index.html

.. Change things from this point on

=========
Ironic UI
=========

The Ironic UI is a Horizon plugin that will allow users to view and manage bare
metal nodes, ports and drivers.

* Free software: Apache license
* Documentation: http://docs.openstack.org/developer/ironic-ui
* Source: http://git.openstack.org/cgit/openstack/ironic-ui
* Bugs: http://bugs.launchpad.net/ironic-ui

Features
--------

* View bare metal nodes
* View node details
* Apply maintenance and power on/off actions to the nodes

Installation Instructions
-------------------------

Please note that the following instructions assume that you have an existing
installation of the OpenStack Horizon dashboard application. For Horizon
installation please see
http://docs.openstack.org/developer/horizon/quickstart.html

1. Clone the Ironic UI repository::

    git clone https://git.openstack.org/openstack/ironic-ui

2. Change into the root directory of your horizon installation and
   activate the python virtual environment. Example::

    source .venv/bin/activate

   .. NOTE:: The ``.venv`` folder is preinstalled when horizon is setup with
             ``./run_tests.sh``. Do not attempt to reinstall the virtual
             environment.

3. Copy the ``_2200_ironic.py`` file from ``ironic_ui/enabled/_2200_ironic.py`` file to
   ``horizon/openstack_dashboard/local/enabled`` directory. Example, set as if being
   executed from the root of the ironic-ui repository::

    cp ./ironic_ui/enabled/_2200_ironic.py ../horizon/horizon/openstack_dashboard/local/enabled

4. Change into the ironic-ui repository and package the plugin::

    pip install -e .

   This will build and install the ironic-ui plugin into the active virtual
   environment associated with your horizon installation. The plugin is installed
   in "editable" mode as a link back to your ironic-ui plugin directory.

   Also ensure that all packages as per requirements.txt have been installed.

5. Change back into the horizon repository and bring up your environment::

    ./run_tests.sh --runserver

   The Ironic Bare Metal Provisioning plugin should now be visible in the Horizon
   navigation.

Uninstallation
--------------

To uninstall, use ``pip uninstall ironic-ui`` from with-in the horizon
virtual environment. You will also need to remove the
``openstack_dashboard/enabled/_2200_ironic.py`` file from the horizon
installation.
