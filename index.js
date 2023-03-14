
const port = 3333


/*    IMPORT    */
const express = require('express');
const bcrypt = require('bcrypt');
const { Sequelize } = require('sequelize');

const User = require('./Models/User');
const Game = require('./Models/Game');

const cors = require('cors');
const { createToken, salt } = require('./Utils/Crypt');
const {getConnectionUrl, masterPass} = require("./Utils/Credentials");



/*     SETUP    */

const sequelize = new Sequelize(getConnectionUrl());

const UserModel = sequelize.define('Utilisateurs', User, {});
const GameModel = sequelize.define('Jeux', Game, {});

(async() => {
    try {
        await sequelize.authenticate();
        console.log('[LOG] Connection has been established successfully.');
        await sequelize.sync();
        console.log('[LOG] All models were synchronized successfully.');
    } catch (error) {
        console.error('[ERROR] Unable to connect to the database:', error);
        process.exit();
        return;
    }
})();

const app = express()
app.use(express.json());
app.use(cors())

/*   ROUTES    */

app.post('/api/login', async(req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Content-Type', 'application/json');

    let back = {
        success: false,
        message: "Unknown error",
        pseudo: "Unknown",
        token: "",
        id: 0
    };

    const u_pseudo = req.body.pseudo;

    if(!u_pseudo)
    {
        back.message = "Le pseudo est vide !";
        res.send(back);
        return;
    }

    const u_passw = req.body.password;
    if(!u_passw)
    {
        back.message = "Le mot de passe est vide !";
        res.send(back);
        return;
    }

    const result = await UserModel.findOne({ where: { pseudo: u_pseudo } });

    if(!result)
    {
        back.message = "Aucun n'utilisateur n'a ce pseudo !";
        console.log(back.message);
        res.send(back);
        return;
    }

    let legit = await bcrypt.compare(u_passw, result.password)

    if(legit)
    {
        back.success = true;
        back.message = "Connexion réussie !";
        back.pseudo = result.pseudo;
        back.token = result.token;
        back.id = result.id;
    }
    else
    {
        back.message = "Le pseudo ou mot de passe est incorrect !";
        console.log(back.message);
        res.send(back);
        return;
    }

    res.send(back);
});

app.post('/api/signup', async(req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Content-Type', 'application/json');

    const u_pseudo = req.body.pseudo;
    const c_master = req.body.master;
    let u_passw = req.body.password;

    try
    {
        if(!u_pseudo)
        {
            throw new Error("Le pseudo est vide !");
        }

        if(!c_master)
        {
            throw new Error("Le mot de passe maître est vide !");
        }

        if(!u_passw)
        {
            throw new Error("Le mot de passe est vide !");
        }

    } catch (e) {
        console.error("[ERROR] : ", e);
        res.send(JSON.stringify({success: false, message: e.message}))
        return;
    }



    console.log(req.body);
    console.log("Requete : ", c_master);

    if(c_master == masterPass)
    {
        u_passw = bcrypt.hashSync(u_passw, salt);

        const u_token = createToken();

        const u_obj = UserModel.create( {pseudo: u_pseudo, password: u_passw, token: u_token} );
        u_obj.then(() => {
            res.send(JSON.stringify({success: true, token: u_token }))
        })
            .catch((e) => {
                console.error("e : ", e);
                res.send(JSON.stringify({success: false, token: u_token }))
            })
    }
    else
    {
        res.send(JSON.stringify({success: false}))
    }
});

app.post('/api/list', async(req, res) => {
    res.header('Content-Type', 'application/json');

    const c_master = req.body.master;

    if(c_master !== masterPass)
    {
        res.send({success: false});
        return;
    }


    const users = await UserModel.findAll(
        {
            attributes: ['id', 'pseudo', 'createdAt']
        }
    );

    res.send({success: true, list: users})
});

app.post('/api/delete', async (req, res) => {
    res.header('Content-Type', 'application/json');

    const c_master = req.body.master;
    const u_id = req.body.userId;

    if(c_master !== masterPass)
    {
        res.send({success: false});
        return;
    }

    if(!u_id)
    {
        res.send({success: false});
        return;
    }

    await UserModel.destroy({ where: { id: u_id } })
        .then(numDeleted => {
            if (numDeleted > 0) {
                console.log('Utilisateur supprimé avec succès');
                res.send({success: true});
            } else {
                console.log('Utilisateur non trouvé');
                throw new Error();
            }
            return;
        })
        .catch(error => {
            console.error('Erreur lors de la suppression de l\'utilisateur :', error);
            res.send({success: false});
            return;
        });

});

app.post('/api/update/pseudo', async (req, res) => {
    res.header('Content-Type', 'application/json');

    const c_master = req.body.master;
    const u_id = req.body.id;
    const u_pseudo = req.body.newPseudo;

    console.log(req.body)

    if(c_master != masterPass)
    {
        console.log("c_master : ", c_master);
        console.log("masterPass : ", masterPass);

        res.send({success: false, message: "Mot de passe maître incorrect"});
        return;
    }

    if(!u_id)
    {
        res.send({success: false, message: "Id utilisateur incorrect"});
        return;
    }

    if(!u_pseudo)
    {
        res.send({success: false, message: "Pseudo incorrect"});
        return;
    }

    await UserModel.update({ pseudo: u_pseudo }, { where: { id: u_id } })
        .then(numUpdated => {
            if (numUpdated > 0) {
                console.log('Utilisateur modifié avec succès');
                res.send({success: true});
            } else {
                console.log('Utilisateur non trouvé');
                throw new Error();
            }
            return;
        })
        .catch(error => {
            console.error('Erreur lors de la modification de l\'utilisateur :', error);
            res.send({success: false, message: "Erreur lors de la modification de l'utilisateur"});
            return;
        });


});

app.post('/api/games/list', async (req, res) => {
    res.header('Content-Type', 'application/json');

    const u_id = req.body.id;
    const u_token = req.body.token;

    if(!u_id)
    {
        res.send({success: false, message: "Id utilisateur incorrect"});
        return;
    }
    if(!u_token)
    {
        res.send({success: false, message: "Mot de passe incorrect"});
        return;
    }

    const result = await UserModel.findOne({ where: { id: u_id, token: u_token } });

    if(!result)
    {
        res.send({success: false, message: "Utilisateur introuvable"});
        return;
    }

    const games = await GameModel.findAll({
        attributes: ['id', 'name', 'description', 'icon', 'background', 'installations']
    })

    games["success"] = true;
    games["message"] = "Liste des jeux";

    res.send(games);
});

app.post('/api/games/install', async (req, res) => {
   //  const { id, executable, link, size } = data;
    res.header('Content-Type', 'application/json');
    // Get id and token
    const u_id = req.body.id;
    const u_token = req.body.token;
    const g_id = req.body.gameId;

    if(!u_id)
    {
        res.send({success: false, message: "Id utilisateur incorrect"});
        return;
    }
    if(!u_token)
    {
        res.send({success: false, message: "Mot de passe incorrect"});
        return;
    }
    if(!g_id)
    {
        res.send({success: false, message: "Id du jeu incorrect"});
        return;
    }

    const result = await UserModel.findOne({ where: { id: u_id, token: u_token } });

    if(!result)
    {
        res.send({success: false, message: "Utilisateur introuvable"});
        return;
    }

    const game = await GameModel.findOne({
        attributes: ['id', 'name', 'installations', 'executable', 'path'],
        where: { id: g_id }
    })

    console.log("Demande du jeu id : ", g_id);

    res.send({success: true, message: "Installation du jeu", game: game});
    return;

});

app.post('/api/games/add', async (req, res) => {
    res.header('Content-Type', 'application/json');

    const {
        master,
        name,
        description,
        icon,
        background,
        path,
        executable
    } = req.body;

    try {
        if(master !== masterPass) throw new Error("Mot de passe maître incorrect");
        if(!name) throw new Error("Nom du jeu incorrect");
        if(!description) throw new Error("Description du jeu incorrect");
        if(!icon) throw new Error("Icone du jeu incorrect");
        if(!background) throw new Error("Image de fond du jeu incorrect");
        if(!path) throw new Error("Chemin du jeu incorrect");
        if(!executable) throw new Error("Executable du jeu incorrect");
    } catch (e) {
        console.error(e);
        res.send({success: false, message: e.message});
        return;
    }

    await GameModel.create({
        name: name,
        description: description,
        icon: icon,
        background: background,
        installations: 0,
        path: path,
        executable: executable
    })
        .catch((e) => {
            console.error(e);
            res.send({success: false, message: "Erreur lors de l'ajout du jeu : " + e.message});
            return;
        });


    res.send({success: true, message: "Jeu ajouté avec succès"});
    return;

});


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});


