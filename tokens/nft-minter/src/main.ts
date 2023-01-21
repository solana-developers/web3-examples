import { Keypair } from "@solana/web3.js"
import { createAccount, createNft, mintNft } from "./tokens"
import { loadKeypairFromFile } from "./util"


const payer = loadKeypairFromFile(
    require('os').homedir() + '/.config/solana/id.json'
)

const testUserKeypair1 = Keypair.generate()
const tokenMintKeypair = Keypair.generate()


async function tokensScript() {
    await createAccount("Test User Keypair #1", testUserKeypair1, payer)
    
    // NFT
    await createNft(
        tokenMintKeypair, 
        payer,
        "Homer NFT",
        "HOMR",
        "https://raw.githubusercontent.com/solana-developers/web3-examples/new-examples/tokens/tokens/.assets/nft.json",
    )

    await mintNft(
        tokenMintKeypair.publicKey,
        payer,
        payer,
        testUserKeypair1.publicKey,
    )
}

tokensScript()