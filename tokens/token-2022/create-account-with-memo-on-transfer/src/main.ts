import {
	clusterApiUrl,
	sendAndConfirmTransaction,
	Connection,
	Keypair,
	SystemProgram,
	Transaction,
	LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
	createMint,
	createEnableRequiredMemoTransfersInstruction,
	createInitializeAccountInstruction,
	disableRequiredMemoTransfers,
	enableRequiredMemoTransfers,
	getAccountLen,
	ExtensionType,
	TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

(async () => {
	const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

	const payer = Keypair.generate();
	const airdropSignature = await connection.requestAirdrop(
		payer.publicKey,
		2 * LAMPORTS_PER_SOL,
	);
	await connection.confirmTransaction({
		signature: airdropSignature,
		...(await connection.getLatestBlockhash()),
	});

	const mintAuthority = Keypair.generate();
	const decimals = 9;
	const mint = await createMint(
		connection,
		payer,
		mintAuthority.publicKey,
		mintAuthority.publicKey,
		decimals,
		undefined,
		undefined,
		TOKEN_2022_PROGRAM_ID,
	);

	const accountLen = getAccountLen([ExtensionType.MemoTransfer]);
	const lamports = await connection.getMinimumBalanceForRentExemption(
		accountLen,
	);
	const owner = Keypair.generate();
	const destinationKeypair = Keypair.generate();
	const destination = destinationKeypair.publicKey;

	const transaction = new Transaction().add(
		SystemProgram.createAccount({
			fromPubkey: payer.publicKey,
			newAccountPubkey: destination,
			space: accountLen,
			lamports,
			programId: TOKEN_2022_PROGRAM_ID,
		}),
		// Create account with required memo transfers
		createInitializeAccountInstruction(
			destination,
			mint,
			owner.publicKey,
			TOKEN_2022_PROGRAM_ID,
		),
		// enable memo instruction after creating account instruction
		createEnableRequiredMemoTransfersInstruction(
			destination,
			owner.publicKey,
			[],
			TOKEN_2022_PROGRAM_ID,
		),
	);

	const signature = await sendAndConfirmTransaction(
		connection,
		transaction,
		[payer, owner, destinationKeypair],
		undefined,
	);
	console.log("transaction signature key:", signature);

	//Enabling required memo transfers
	const enableRequiredMemoSignature = await enableRequiredMemoTransfers(
		connection,
		payer,
		destination,
		owner,
		[],
		undefined,
		TOKEN_2022_PROGRAM_ID,
	);
	console.log("enableRequiredMemoSignature key:", enableRequiredMemoSignature);
	//disabling required memo transfers
	const disableRequiredMemoSignature = await disableRequiredMemoTransfers(
		connection,
		payer,
		destination,
		owner,
		[],
		undefined,
		TOKEN_2022_PROGRAM_ID,
	);
	console.log(
		"disableRequiredMemoSignature key:",
		disableRequiredMemoSignature,
	);
})();
