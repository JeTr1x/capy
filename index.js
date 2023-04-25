import { Ed25519Keypair, JsonRpcProvider, RawSigner, TransactionBlock, Connection } from '@mysten/sui.js';
import fs from 'fs';
import axios from 'axios';
import randUserAgent from 'rand-user-agent';
import HttpsProxyAgent from 'https-proxy-agent';
import { config } from './config.js';


const [ip, port, login, password] = config.proxy.split(":");
const proxy = `http://${login}:${password}@${ip}:${port}`;
const axiosProxyInstance = axios.create({ httpsAgent: HttpsProxyAgent(proxy) });
const timeout = ms => new Promise(res => setTimeout(res, ms))
const saveMnemonic = mnemonic => fs.appendFileSync("mnemonics.txt", `${mnemonic}\n`, "utf8");
const parseFile = fileName => fs.readFileSync(fileName, "utf8").split('\n').map(str => str.trim()).filter(str => str.length > 10);
const saveAddr = address => fs.appendFileSync("address.txt", `${address}\n`, "utf8");
let rpc_addr = 'http://5.9.63.216:9000'
rpc_addr = 'https://fullnode.testnet.sui.io:443/'
rpc_addr = 'https://sui-testnet-fullnode.quantnode.tech/'
rpc_addr = 'https://sui-testnet.brightlystake.com/'
rpc_addr = 'https://sui-testnet-rpc.bartestnet.com/'

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const ctry_list = ['Cambodia','India','Kazakhstan','Australia','Guinea-Bissau','Italy','Antarctica','Martinique','United Arab Emirates','Canada','Antigua and Barbuda','Kuwait',
'Georgia', 'United States']

async function rotateIp() {
    console.log('Rotating IP...');
    return await axios.get(config.proxyLink).catch(err => { })
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

async function rotateAndCheckIp() {
    while (true) {
        let rotate = await rotateIp()
        console.log(rotate?.data.split('\n')[0]);
        await timeout(5000)
        let ip = await checkIp()

        if (ip) {
            console.log(`New IP: ${ip}`);
            await timeout(5000)
            return true
        }
    }
}
async function getCoins(addr){
        const provider = new JsonRpcProvider(new Connection({
              fullnode: rpc_addr,
              faucet: 'https://faucet.testnet.sui.io/gas'
            }), {
                skipDataValidation: true
            }
    );
        const objects = await provider.getCoins({
                owner: addr,
                 coinType: '0x2::sui::SUI'
                });
        return objects.data
}

async function mergeCoins(keypair, arrx) {
    console.log(`Merging: `);
    const provider = new JsonRpcProvider(new Connection({
              fullnode: rpc_addr,
              faucet: 'https://faucet.testnet.sui.io/gas'
            }), {
                skipDataValidation: true
            }
    );
    const txb = new TransactionBlock();
        let objarr = []
        for (let i = 1; i < arrx.length; i++) {
                objarr.push(txb.object(arrx[i]))
        }
        const obj = txb.object(arrx[0])
    const signer = new RawSigner(keypair, provider);
    txb.mergeCoins(obj, objarr);
    return await signer.signAndExecuteTransactionBlock({ transactionBlock: txb });
}

async function checkIp() {
    let data = await axios({
        method: 'GET',
        url: "http://api64.ipify.org/?format=json",
        proxy: {
            host: ip,
            port: Number(port),
            auth: {
                username: login,
                password: password
            },
            protocol: 'http'
        }
    }).catch(err => { console.log('[ERROR]', err.response?.data); })

    if (data) {
        return data?.data?.ip
    }
}

async function requestSuiFromFaucet(recipient) {
    while (true) {
        console.log(`Requesting SUI from faucet for ${recipient}`);

        let data = await axiosProxyInstance("https://faucet.testnet.sui.io/gas", {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': randUserAgent('desktop')
            },
            data: JSON.stringify({ FixedAmountRequest: { recipient: `${recipient}` } }),
            method: 'POST',
            timeout: 120000
        }).catch(async err => {
            let statusCode = err?.response?.status
            console.log('[FAUCET ERROR]', statusCode > 500 && statusCode < 600 ? 'Faucet down!' : err?.response?.statusText);
            console.log(statusCode)
            await rotateAndCheckIp()
        })

        if (data?.data?.error === null) {
            console.log(`Faucet request status: ${data?.statusText || data}`);
            return true
        }
    }
}


async function mintNft(keypair, trg) {
    console.log(`Minting: `);
    const provider = new JsonRpcProvider(new Connection({
              fullnode: 'https://fullnode.testnet.sui.io:443',
              faucet: 'https://faucet.testnet.sui.io/gas'
            }), {
                skipDataValidation: true
            }
    );
    const txb = new TransactionBlock();
    const address = keypair.getPublicKey().toSuiAddress()
    const signer = new RawSigner(keypair, provider);
    const [split] = txb.splitCoins(txb.gas, [txb.pure(500000000)]);
    console.log(split);
    const [mvcall] = txb.moveCall({
    //    packageObjectId: '0xe220547c8a45080146d09cbb22578996628779890d70bd38ee4cf2eb05a4777d',
  //      module: 'bluemove_x_testnet',
//        function: 'mint_with_quantity',
        target: trg,
        arguments: [
            txb.pure('0x7ab8d6a33cc59f9d426f6f40edc727b6fa57b341c165b465dd2a6ca1c49adc5a'),
            txb.pure('0x0000000000000000000000000000000000000000000000000000000000000006'),
            txb.pure(ctry_list[getRandomInt(14)]),
            split
        ],
        typeArguments: ['0x3dcfc5338d8358450b145629c985a9d6cb20f9c0ab6667e328e152cdfd8022cd::capy::Capy'],
        gasBudget: 10000,
    });
    console.log(mvcall);
    txb.transferObjects([mvcall, split], txb.pure(address))
    console.log(address);
    return await signer.signAndExecuteTransactionBlock({ transactionBlock: txb });
}

async function mixNft(keypair, trg, capy1 , capy2) {
    console.log(`Mixing: `);
    const provider = new JsonRpcProvider(new Connection({
              fullnode: rpc_addr,
              faucet: 'https://faucet.testnet.sui.io/gas'
            }), {
                skipDataValidation: true
            }
    );
    const txb = new TransactionBlock();
    const address = keypair.getPublicKey().toSuiAddress()
//    const signer = new RawSigner(keypair, provider);
    const [split] = txb.splitCoins(txb.gas, [txb.pure(1000000000)]);
    console.log(split);
    const [mvcall] = txb.moveCall({
    //    packageObjectId: '0xe220547c8a45080146d09cbb22578996628779890d70bd38ee4cf2eb05a4777d',
  //      module: 'bluemove_x_testnet',
//        function: 'mint_with_quantity',
        target: trg,
        arguments: [
            txb.pure('0x5a9726a3a676bcaebb1ebef72c3e33f80bafbe070f60cd4f0787688d7008f070'),
            txb.pure(capy1),
            txb.pure(capy2),
            txb.pure('0x0000000000000000000000000000000000000000000000000000000000000006'),
            txb.pure(ctry_list[getRandomInt(14)]),
            split
        ],
        typeArguments: ['0x3dcfc5338d8358450b145629c985a9d6cb20f9c0ab6667e328e152cdfd8022cd::capy::Capy'],
        gasBudget: 10000,
    });
    console.log(mvcall);
    txb.transferObjects([mvcall, split], txb.pure(address))
    console.log(address);
    const signer = new RawSigner(keypair, provider);
    return await signer.signAndExecuteTransactionBlock({ transactionBlock: txb });
}

const provider = new JsonRpcProvider(new Connection({
          fullnode: rpc_addr,
          faucet: 'https://faucet.testnet.sui.io/gas'
        }), {
            skipDataValidation: true
        }
);
//const mnemonic = 'degree document teach lake angle melt endorse essence vapor fossil enact dash'

//const keypair = Ed25519Keypair.deriveKeypair(mnemonic);
//const address = keypair.getPublicKey().toSuiAddress()
//console.log(`${address}:${mnemonic}`)
const trg = `0x3dcfc5338d8358450b145629c985a9d6cb20f9c0ab6667e328e152cdfd8022cd::genesis::mint`
const trg2 = `0x3dcfc5338d8358450b145629c985a9d6cb20f9c0ab6667e328e152cdfd8022cd::capy_labs::mix`
//const signer = new RawSigner(keypair, provider);
//const args = ['0x9269c5575b5a949fe094723e600eb0835193c207916442b8ae2162ae838d4ab2', '1']
//await provider.requestSuiFromFaucet(address);
//await requestSuiFromFaucet(address)
//await mintNft(signer, trg)
const capy_type = '0x3dcfc5338d8358450b145629c985a9d6cb20f9c0ab6667e328e152cdfd8022cd::suifrens::SuiFren<0x3dcfc5338d8358450b145629c985a9d6cb20f9c0ab6667e328e152cdfd8022cd::capy::Capy>'

let mnemonics = parseFile('oldWallets.txt');
console.log(`Loaded ${mnemonics.length} wallets`);
let capy_list = []


//console.log(`${address}:${mnemonic}`)
for (let i = 0; i < mnemonics.length; i++) {
    try {
        capy_list = []
        const mnemonic = mnemonics[i]
        const keypair = Ed25519Keypair.deriveKeypair(mnemonic);
        const address = keypair.getPublicKey().toSuiAddress()
        console.log(`${address}:${mnemonic}`)
        //await rotateAndCheckIp()
        //await requestSuiFromFaucet(address)
       // console.log(`Faucet  req sent, waiting for token`)
        //await sleep(15000)
        const bal = await provider.getBalance({
            owner: address,
            coinType: '0x2::sui::SUI'})
        const objects = await getCoins(address)
                let arr = []
                for (let i = 0; i < objects.length -1; i++) {
                                arr.push(objects[i].coinObjectId)
                }
        console.log(arr)
        if (bal.coinObjectCount > 2){
            await mergeCoins(keypair, arr)}
        console.log(bal.totalBalance)
//        await timeout(2000)
        if (bal.totalBalance > 2600000000){
            let amo = getRandomInt(5)
            while (amo < 3){
                amo = getRandomInt(5)
            }
             console.log(amo)
            for (let i  = 0; i < amo; i++){
                let res = await mintNft(keypair, trg)
  //              console.log('txns')
//                console.log(res['digest'])
    //            await timeout(25000)
      //          const txns = await provider.getTransactionBlock({
        //          digest: res['digest'],
          //        options: { showEffects: true, showObjectChanges: true },
            //    });
              //  console.log(txns)
                await timeout(25000)
            }
//            await mintNft(keypair, trg)
  //          await timeout(10000)
    //        await mintNft(keypair, trg)
      //      await timeout(10000)
            const bal = await provider.getBalance({
                owner: address,
                coinType: '0x2::sui::SUI'})
            const objects = await provider.getOwnedObjects({
                owner: address,
                options: { showContent: true , showType:true}
             });
//        console.log(objects['data'])
            for (let i  = 0; i < objects['data'].length; i++){
                if (objects['data'][i]['data']['content']['type'] == capy_type){
                console.log(objects['data'][i]['data']['content'])
                capy_list.push(objects['data'][i]['data']['objectId'])
                }
            }
            console.log(capy_list)
            let capy1 = capy_list[getRandomInt(capy_list.length-1)]
            let capy2 = capy_list[getRandomInt(capy_list.length-1)]
            while ( capy1 == capy2 ) {
            capy2 = capy_list[getRandomInt(capy_list.length-1)]
            }
            let x = 1
            let balance = await provider.getBalance({
                owner: address,
                coinType: '0x2::sui::SUI'})
            while ( balance.totalBalance > 1100000000) {
            console.log(balance.totalBalance)
            console.log(capy1)
            console.log(capy2)
            let mix_res = await mixNft(keypair, trg2, capy1, capy2)
            console.log('mix')
            await timeout(50000)
            const txn_mix = await provider.getTransactionBlock({
                  digest: mix_res['digest'],
                  options: { showEffects: true, showObjectChanges: true },
                });
            console.log(txn_mix)
            await timeout(10000)
            let mint_res = await mintNft(keypair, trg)
            console.log('mint')
            await timeout(50000)
            const txn_mint = await provider.getTransactionBlock({
                  digest: mint_res['digest'],
                  options: { showEffects: true, showObjectChanges: true },
                });
            console.log(txn_mint)
            for (let i  = 0; i < txn_mix['objectChanges'].length; i++){
                if (txn_mix['objectChanges'][i]['objectType'] == capy_type){
                  capy1 = txn_mix['objectChanges'][i]['objectId']
                 }
            }
            for (let i  = 0; i < txn_mint['objectChanges'].length; i++){
                if (txn_mint['objectChanges'][i]['objectType'] == capy_type){
                  capy2 = txn_mint['objectChanges'][i]['objectId']
                 }
            }
            balance = await provider.getBalance({
                owner: address,
                coinType: '0x2::sui::SUI'})
}
//            await timeout(10000)
        //    while (bal.totalBalance > 1050000000){
      //          await mixNft(keypair, trg2, capy1, capy2)
    //            const bal = await provider.getBalance({
  //                  owner: address,
//                    coinType: '0x2::sui::SUI'})
  //              await timeout(10000)
//            }
            console.log(`Minted, saving...`)
            saveMnemonic(mnemonic)
            saveAddr(address)
            }
   } catch (err) { console.log(err) }
}

