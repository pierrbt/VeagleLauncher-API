const bcrypt = require("bcrypt");
const {salt, createToken} = require("../Utils/Crypt");
app.get('/api/signup', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Content-Type', 'application/json');
    const u_pseudo = req.query.pseudo;
    let u_passw = req.query.password;

    u_passw = bcrypt.hashSync(u_passw, salt);

    const u_token = createToken();
    const u_obj = UserModel.create( {pseudo: u_pseudo, password: u_passw, token: u_token} );
    res.send(JSON.stringify({success: true}));
});

app.get('/api/list', async(req, res) => {
    res.header('Content-Type', 'application/json');

    const users = await UserModel.findAll(
        {
            attributes: ['id', 'pseudo', 'createdAt']
        }
    );
    res.send(JSON.stringify(users, null, 2))
});