import {
	clusterApiUrl,
	Connection,
	Keypair,
	LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
	createInterestBearingMint,
	updateRateInterestBearingMint,
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
	const freezeAuthority = Keypair.generate();
	const rateAuthority = Keypair.generate();
	const mintKeypair = Keypair.generate();
	const rate = 10;
	const decimals = 9;
	const mint = await createInterestBearingMint(
		connection,
		payer,
		mintAuthority.publicKey,
		freezeAuthority.publicKey,
		rateAuthority.publicKey,
		rate,
		decimals,
		mintKeypair,
		undefined,
		TOKEN_2022_PROGRAM_ID,
	);

	// Update rate
	const updatedRate = 50;
	const updatedMint = await updateRateInterestBearingMint(
		connection,
		payer,
		mint,
		rateAuthority,
		updatedRate,
		[],
		undefined,
		TOKEN_2022_PROGRAM_ID,
	);
	console.log(
		"Your transaction signature for updating the Token Rate",
		updatedMint,
	);

	console.log("Your Token mint PublicKey", mintKeypair.publicKey.toBase58());
})();
