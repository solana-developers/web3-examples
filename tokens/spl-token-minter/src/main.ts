import { Keypair } from "@solana/web3.js"
import { createAccount, createSplToken, mintSplTokens } from "./tokens"
import { loadKeypairFromFile } from "./util"


const payer = loadKeypairFromFile(
    require('os').homedir() + '/.config/solana/id.json'
)

const testUserKeypair1 = Keypair.generate()
const tokenMintKeypair = Keypair.generate()


async function tokensScript() {
    await createAccount("Test User Keypair #1", testUserKeypair1, payer)
    
    // SPL Token
    await createSplToken(
        tokenMintKeypair, 
        payer,
        "Solana Gold",
        "GOLDSOL",
        "https://raw.githubusercontent.com/solana-developers/web3-examples/new-examples/tokens/tokens/.assets/spl-token.json",
    )

    await mintSplTokens(
        tokenMintKeypair.publicKey,
        payer,
        payer,
        testUserKeypair1.publicKey,
        40,
    )
    await mintSplTokens(
        tokenMintKeypair.publicKey,
        payer,
        payer,
        testUserKeypair1.publicKey,
        30,
    )
}

tokensScript()