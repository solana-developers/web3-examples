import {
	Connection,
	Keypair,
	PublicKey,
	TransactionInstruction,
	VersionedTransaction,
	TransactionMessage,
	AccountInfo,
	LAMPORTS_PER_SOL,
} from "@solana/web3.js";

export function loadKeypairFromFile(path: string): Keypair {
	return Keypair.fromSecretKey(
		Buffer.from(JSON.parse(require("fs").readFileSync(path, "utf-8"))),
	);
}

export function newLogSection() {
	console.log("-----------------------------------------------------");
}

export async function logAccountInfo(accountInfo: AccountInfo<Buffer> | null) {
	console.log("Account Info:");
	console.log(accountInfo);
}

export function logNewKeypair(keypair: Keypair) {
	console.log("Created a new keypair.");
	console.log(`   New account Public Key: ${keypair.publicKey}`);
}

export async function logTransaction(
	connection: Connection,
	signature: string,
) {
	await connection.confirmTransaction(signature);
	console.log("Transaction successful.");
	console.log(`   Transaction signature: ${signature}`);
}

export async function logBalance(
	accountName: string,
	connection: Connection,
	pubkey: PublicKey,
) {
	const balance = await connection.getBalance(pubkey);
	console.log(`   ${accountName}:`);
	console.log(`       Account Pubkey: ${pubkey.toString()} SOL`);
	console.log(`       Account Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
}

export function logNewMint(mintPubkey: PublicKey, decimals: number) {
	console.log("Created a new mint.");
	console.log(`   New mint Public Key: ${mintPubkey}`);
	console.log(`   Mint type: ${decimals === 0 ? "NFT" : "SPL Token"}`);
}

export async function buildTransaction(
	connection: Connection,
	payer: PublicKey,
	signers: Keypair[],
	instructions: TransactionInstruction[],
): Promise<VersionedTransaction> {
	let blockhash = await connection
		.getLatestBlockhash()
		.then((res) => res.blockhash);

	const messageV0 = new TransactionMessage({
		payerKey: payer,
		recentBlockhash: blockhash,
		instructions,
	}).compileToV0Message();

	const tx = new VersionedTransaction(messageV0);

	signers.forEach((s) => tx.sign([s]));

	return tx;
}
