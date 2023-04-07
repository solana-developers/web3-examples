import {
	AddressLookupTableProgram,
	Connection,
	Keypair,
	PublicKey,
	SystemProgram,
	TransactionInstruction,
} from "@solana/web3.js";
import {
	createKeypairFromFile,
	printAddressLookupTable,
	printBalances,
	sendTransactionV0,
	sendTransactionV0WithLookupTable,
} from "./util";

describe("Address Lookup Tables!", () => {
	const connection = new Connection(
		`https://api.devnet.solana.com`,
		"confirmed",
	);
	const payer = createKeypairFromFile(
		require("os").homedir() + "/.config/solana/id.json",
	);

	let lookupTablePubkey: PublicKey;
	const testAccountOne = Keypair.generate();
	const testAccountTwo = Keypair.generate();

	it("Create an Address Lookup Table", async () => {
		let ix: TransactionInstruction;
		[ix, lookupTablePubkey] = AddressLookupTableProgram.createLookupTable({
			authority: payer.publicKey,
			payer: payer.publicKey,
			recentSlot: await connection.getSlot(),
		});

		await sendTransactionV0(connection, [ix], payer);

		console.log("Pubkeys from generated keypairs:");
		console.log(`   Test Account #1: ${testAccountOne.publicKey}`);
		console.log(`   Test Account #2: ${testAccountTwo.publicKey}`);
		await printAddressLookupTable(connection, lookupTablePubkey);
	});

	it("Add some addresses to the ALT", async () => {
		const ix = AddressLookupTableProgram.extendLookupTable({
			addresses: [testAccountOne.publicKey, testAccountTwo.publicKey],
			authority: payer.publicKey,
			lookupTable: lookupTablePubkey,
			payer: payer.publicKey,
		});

		await sendTransactionV0(connection, [ix], payer);

		await printAddressLookupTable(connection, lookupTablePubkey);
	});

	it("Fund the first test account", async () => {
		const ix = SystemProgram.transfer({
			fromPubkey: payer.publicKey,
			toPubkey: testAccountOne.publicKey,
			lamports: 100000000,
		});

		await sendTransactionV0(connection, [ix], payer);

		await printBalances(
			connection,
			"After",
			testAccountOne.publicKey,
			testAccountTwo.publicKey,
		);
	});

	it("Send a transaction WITHOUT using the ALT", async () => {
		await printBalances(
			connection,
			"Before",
			testAccountOne.publicKey,
			testAccountTwo.publicKey,
		);

		const ix = SystemProgram.transfer({
			fromPubkey: testAccountOne.publicKey,
			toPubkey: testAccountTwo.publicKey,
			lamports: 20000000,
		});

		await sendTransactionV0(connection, [ix], testAccountOne);

		await printBalances(
			connection,
			"After",
			testAccountOne.publicKey,
			testAccountTwo.publicKey,
		);
	});

	it("Now send that same transaction using the ALT", async () => {
		await printBalances(
			connection,
			"Before",
			payer.publicKey,
			testAccountOne.publicKey,
		);

		const ix = SystemProgram.transfer({
			fromPubkey: testAccountOne.publicKey,
			toPubkey: testAccountTwo.publicKey,
			lamports: 20000000,
		});

		await sendTransactionV0WithLookupTable(
			connection,
			[ix],
			testAccountOne,
			lookupTablePubkey,
		);

		await printBalances(
			connection,
			"After",
			testAccountOne.publicKey,
			testAccountTwo.publicKey,
		);
	});
});
