# plugin.sh - DevStack plugin.sh dispatch script ironic-ui

function install_ironic_ui {
    setup_develop ${IRONIC_UI_DIR}
}

# check for service enabled
if is_service_enabled horizon && is_service_enabled ironic && is_service_enabled ironic-ui; then

    if [[ "$1" == "stack" && "$2" == "pre-install" ]]; then
        # Set up system services
        # no-op
        :
    elif [[ "$1" == "stack" && "$2" == "install" ]]; then
        # Perform installation of service source
        echo_summary "Installing Ironic UI"
        install_ironic_ui
    elif [[ "$1" == "stack" && "$2" == "post-config" ]]; then
        # Configure after the other layer 1 and 2 services have been configured
        echo_summary "Configuring Ironic UI"
        cp -a ${IRONIC_UI_DIR}/ironic_ui/enabled/* ${DEST}/horizon/openstack_dashboard/local/enabled/
    elif [[ "$1" == "stack" && "$2" == "extra" ]]; then
        # no-op
        :
    fi

    if [[ "$1" == "unstack" ]]; then
        # no-op
        :
    fi

    if [[ "$1" == "clean" ]]; then
        # Remove state and transient data
        # Remember clean.sh first calls unstack.sh
        # no-op
        :
    fi
fi
