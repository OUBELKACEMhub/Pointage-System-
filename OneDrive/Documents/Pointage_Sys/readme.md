# PHP 8.2
sudo apt install php8.2 php8.2-mysql php8.2-mbstring php8.2-zip php8.2-bcmath php8.2-xml -y

# Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y

# MySQL
sudo apt install mysql-server -y
sudo mysql_secure_installation

# Python + pip
sudo apt install python3 python3-pip -y
pip3 install -r zkteco-sync/requirements.txt