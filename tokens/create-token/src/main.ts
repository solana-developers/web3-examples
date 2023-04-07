import { Keypair } from "@solana/web3.js";
import { createAccount, createToken } from "./tokens";
import { loadKeypairFromFile } from "./util";

const payer = loadKeypairFromFile(
	require("os").homedir() + "/.config/solana/id.json",
);

const testUserKeypair1 = Keypair.generate();
const testUserKeypair2 = Keypair.generate();

const tokenMintKeypair = Keypair.generate();
const nftMintKeypair = Keypair.generate();

async function tokensScript() {
	await createAccount("Test User Keypair #1", testUserKeypair1, payer);
	await createAccount("Test User Keypair #2", testUserKeypair2, payer);

	// SPL Token
	await createToken(
		tokenMintKeypair,
		payer,
		"Solana Gold",
		"GOLDSOL",
		"https://raw.githubusercontent.com/solana-developers/web3-examples/new-examples/tokens/tokens/.assets/spl-token.json",
		9,
	);
	// NFT
	await createToken(
		nftMintKeypair,
		payer,
		"Homer NFT",
		"HOMR",
		"https://raw.githubusercontent.com/solana-developers/web3-examples/new-examples/tokens/tokens/.assets/nft.json",
		0,
	);
}

tokensScript();
