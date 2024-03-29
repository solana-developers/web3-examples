import {
	Connection,
	Keypair,
	LAMPORTS_PER_SOL,
	PublicKey,
	sendAndConfirmTransaction,
	SystemProgram,
	Transaction,
} from "@solana/web3.js";

function createKeypairFromFile(path: string): Keypair {
	return Keypair.fromSecretKey(
		Buffer.from(JSON.parse(require("fs").readFileSync(path, "utf-8"))),
	);
}

describe("transfer SOL from client side", () => {
	async function getBalances(
		payerPubkey: PublicKey,
		recipientPubkey: PublicKey,
		timeframe: string,
	) {
		let payerBalance = await connection.getBalance(payerPubkey);
		let recipientBalance = await connection.getBalance(recipientPubkey);
		console.log(`${timeframe} balances:`);
		console.log(`   Payer: ${payerBalance}`);
		console.log(`   Recipient: ${recipientBalance}`);
	}

	const connection = new Connection(`http://127.0.0.1:8899`, "confirmed");
	const payer = createKeypairFromFile(
		require("os").homedir() + "/.config/solana/id.json",
	);

	it("Transfer some SOL", async () => {
		let recipientKeypair = Keypair.generate();
		let transferAmount = 1 * LAMPORTS_PER_SOL;

		await getBalances(payer.publicKey, recipientKeypair.publicKey, "Beginning");

		let ix = SystemProgram.transfer({
			fromPubkey: payer.publicKey,
			toPubkey: recipientKeypair.publicKey,
			lamports: transferAmount,
		});

		await sendAndConfirmTransaction(connection, new Transaction().add(ix), [
			payer,
		]);

		await getBalances(payer.publicKey, recipientKeypair.publicKey, "Resulting");
	});
});
