const {etherscanApiKey, alchemyApiKey, mnemonic} = require('../secrets.json');
const Web3 = require('web3'); 
const client = require('node-rest-client-promise').Client();
const INFURA_KEY = mnemonic;
const ETHERSCAN_API_KEY = etherscanApiKey;
const web3 = new Web3('wss://eth-mainnet.ws.alchemyapi.io/v2/' + alchemyApiKey);
const CONTRACT_ADDRESS = "0x3845badAde8e6dFF049820680d1F14bD3903a5d0";
// const etherescan_url = `http://api.rinkeby.etherscan.io/api?module=contract&action=getabi&address=${CONTRACT_ADDRESS}&apikey=${ETHERSCAN_API_KEY}`
const etherescan_url = `http://api.etherscan.io/api?module=contract&action=getabi&address=${CONTRACT_ADDRESS}&apikey=${ETHERSCAN_API_KEY}`

async function getContractAbi() {
    const etherescan_response = await client.getPromise(etherescan_url)
    const CONTRACT_ABI = JSON.parse(etherescan_response.data.result);
    return CONTRACT_ABI;
}

async function eventQuery(){
    const CONTRACT_ABI = await getContractAbi();
    const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
    
    const START_BLOCK = 12695294;
    contract.once('Transfer', {
        fromBlock: START_BLOCK
    }, function(error, event){ console.log(event); });
}

eventQuery();