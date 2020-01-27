const Migrations = artifacts.require("Migrations");

module.exports = function(deployer) {
  console.log("1_initial_migrations.js")
  deployer.deploy(Migrations);
  console.log("1_initial_migrations.js done")
};
