
const { DataTypes } = require('sequelize');

// Modèle de la table "Games", qui contient toutes les informations sur les jeux

const Game =  {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        unique: true
    },
    description: {
        type: DataTypes.STRING,
    },
    executable: {
        type: DataTypes.STRING,
    },
    icon: {
        type: DataTypes.STRING,
    },
    background: {
        type: DataTypes.STRING,
    },
    installations: {
        type: DataTypes.INTEGER,
    },
    path: {
        type: DataTypes.STRING,
    }
};

module.exports = Game;