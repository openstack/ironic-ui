.. _installation:

Ironic-UI Installation
======================

Please note that the following instructions assume that you have an existing
installation of the OpenStack Horizon dashboard application. For Horizon
installation please see http://docs.openstack.org/developer/horizon/quickstart.html

1. Clone the Ironic UI repository::

    git clone https://git.openstack.org/openstack/ironic-ui

2. Change into the root directory of your horizon installation and
   activate the python virtualenv. Example::

    source .venv/bin/activate

   .. NOTE:: The ``.venv`` folder is pre-installed when horizon is setup with
             ``./run_tests.sh``. Do not attempt to reinstall the virtual
             environment.

3. Copy the ``_2200_ironic.py`` file from ``ironic_ui/enabled/_2200_ironic.py``
   file to ``horizon/openstack_dashboard/local/enabled`` directory. Example,
   set as if being executed from the root of the ironic-ui repository::

    cp ./ironic_ui/enabled/_2200_ironic.py ../horizon/openstack_dashboard/local/enabled

4. Change into the ironic-ui repository and package the plugin::

    pip install -r requirements.txt -e .

   This will build and install the ironic-ui plugin into the active virtual
   environment associated with your horizon installation. The plugin is installed
   in "editable" mode as a link back to your ironic-ui plugin directory.

5. Change back into the horizon repository and bring up your environment::

    ./run_tests.sh --runserver

   The Bare Metal service should now be visible in the Horizon navigation.

Ironic-UI Installation with DevStack
------------------------------------

In order to use the Ironic UI with devstack, you will need to enable
the UI plugin separately in your installation local.conf file.

This is done in a similar fashion to enabling Ironic for devstack.

Make sure you have horizon enabled, which is the default in devstack.

Then, enable the Ironic UI plugin appending the following line to the end of the local.conf file,
just after Ironic plugin enablement:

    enable_plugin ironic-ui https://github.com/openstack/ironic-ui

After this, you can run ./stack.sh from the devstack directory.

   The Ironic Bare Metal Provisioning plugin should now be visible in the Horizon
   navigation.

6. Run JavaScript unit tests by either:

   Running the tests locally with npm run test.

   Visiting http://localhost:8000/jasmine/?spec=horizon.dashboard.admin.ironic in your
   browser.
