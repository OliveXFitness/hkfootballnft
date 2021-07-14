const FootballCard = artifacts.require("FootballCard");

module.exports = function(deployer) {
  deployer.deploy(FootballCard, 'Hong Kong Football NFT', 'HKFB', 'https://hkfootball.nft/json/');
};
