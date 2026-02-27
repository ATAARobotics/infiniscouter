# Deployment

## Deploying Infiniscouter

1. Create a VM host on a provider such as Linode.
    - Choose the latest Ubuntu LTS as the OS.
    - Be sure to use a long random password for `root`.
    - After this is done, the DNS will need to be set up to point to the new server's IP address.
2. Set up a user to use other than root for security purposes.
    - SSH to the server to set up a user using the password you used to set up the host.
        - `ssh root@<ip-address>`
    - Create a user that you will use to SSH to the host.
        - `useradd --groups sudo --create-home --user-group --shell /bin/bash <username>`
    - Set up an SSH key for the new user.
        - `mkdir ~<username>/.ssh`
        - `vim ~<username>/.ssh/authorized_keys`
        - `chown <username>:<username> -R ~<username>/.ssh`
    - Allow all users in the `sudo` group to use it without a password.
        - `sed -i 's/^%sudo[[:space:]]ALL=(ALL:ALL)[[:space:]]ALL$/%sudo ALL=(ALL:ALL) NOPASSWD: ALL/' /etc/sudoers`
3. Tighten up the security on the server and install docker.
    - SSH to the server using the SSH key and the new user.
        - `ssh <username>@<ip-address> -i ~/.ssh/your-key`
    - Ensure that you can use sudo.
        - `sudo cat /etc/shadow`
    - Remove the ability to SSH as `root` or use passwords.
        - `sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config`
        - `sudo sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config`
        - `sudo systemctl restart ssh.service`
    - Install the latest packages and `docker` service.
        - `sudo apt update`
        - `sudo apt dist-upgrade -y`
        - `sudo apt install docker.io docker-compose -y`
    - Add the user to the docker group so you can use docker without sudo.
        - `sudo usermod --append --groups docker <username>`
        - `newgrp docker`
    - Ensure you can access docker by listing the containers.
        - `docker container ls`
4. Pull the source code and start up the application.
    - In the terminal, type `ssh-keygen -C Linode\ Deploy\ Key` and press enter to accept the defaults.
    - Cat the public key and copy it for use in GitHub.
        - `cat ~/.ssh/
    - Go to [here](https://github.com/ATAARobotics/infiniscouter/settings/keys) and click "Add Deploy Key"
    - Paste in the key from above and give it a title with the year in it, e.g. "Scouting Deploy Key 2026"
    - Ensure that the key is enabled using ssh: `ssh git@github.com` and look for "Hi ATAARobotics/infiniscouter! You've successfully authenticated, but GitHub does not provide shell access."
    - Pull the code.
        - `git clone git@github.com:ATAARobotics/infiniscouter.git`
    - Move into the deploy directory and set up everything.
        - `cd infiniscouter/deploy`
        - `cp ../server/team_config.yaml .`
        - `mkdir data`
        - `sudo chown 4421:4421 data`
        - `mkdir letsencrypt`
        - `touch letsencrypt/acme.json`
        - `chmod -R go= letsencrypt`
        - `sudo chown -R root:root letsencrypt`
    - Compile the app.
        - `docker-compose build`
    - Start the app
        - `docker-compose up -d`


## Updating with Changes

- SSH to the server
    - `ssh <username>@<ip-address> -i ~/.ssh/your-key`
- Pull the latest changes
    - `cd infiniscouter`
    - `git pull`
- Rebuild the app
    - `cd deploy`
    - `docker-compose build`
- Restart the app
    - `docker-compose up -d`
