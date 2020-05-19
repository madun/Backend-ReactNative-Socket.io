const Sequelize = require('sequelize');
const conn = new Sequelize('mysql://root:@localhost:3306/chat_app_db');

module.exports = conn;
