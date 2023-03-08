function createToken() {
    return Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
}

const salt = 10;


module.exports = {
    createToken,
    salt
}