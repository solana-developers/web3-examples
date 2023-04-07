import { Keypair } from "@solana/web3.js";
import {
	createAccount,
	createNft,
	createSplToken,
	mintNft,
	mintSplTokens,
	transferTokens,
} from "./tokens";
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
	await createSplToken(
		tokenMintKeypair,
		payer,
		"Solana Gold",
		"GOLDSOL",
		"https://raw.githubusercontent.com/solana-developers/web3-examples/new-examples/tokens/tokens/.assets/spl-token.json",
	);
	// NFT
	await createNft(
		nftMintKeypair,
		payer,
		"Homer NFT",
		"HOMR",
		"https://raw.githubusercontent.com/solana-developers/web3-examples/new-examples/tokens/tokens/.assets/nft.json",
	);

	await mintSplTokens(
		tokenMintKeypair.publicKey,
		payer,
		payer,
		testUserKeypair1.publicKey,
		40,
	);
	await mintNft(
		nftMintKeypair.publicKey,
		payer,
		payer,
		testUserKeypair1.publicKey,
	);

	await transferTokens(
		tokenMintKeypair.publicKey,
		payer,
		testUserKeypair1,
		testUserKeypair2.publicKey,
		10,
	);
	await transferTokens(
		nftMintKeypair.publicKey,
		payer,
		testUserKeypair1,
		testUserKeypair2.publicKey,
		1,
	);
}

tokensScript();
