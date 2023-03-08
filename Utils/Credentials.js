
const credentials = {
    "host": "192.168.1.180",
    "port": 3306,
    "username": "pierro",
    "password": "1234",
    "base": "launcher",
    "dialect": "mysql"
}

function getConnectionUrl()
{
    return (`${credentials.dialect}://${credentials.username}:${credentials.password}@${credentials.host}:${credentials.port}/${credentials.base}`);
}

const masterPass = "azerty";

module.exports = { credentials, getConnectionUrl, masterPass } ;