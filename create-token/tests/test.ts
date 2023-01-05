import {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    sendAndConfirmTransaction,
    SystemProgram,
    Transaction,
} from '@solana/web3.js';
import {
    createAssociatedTokenAccountInstruction, 
    createBurnInstruction, 
    createCloseAccountInstruction, 
    createInitializeMintInstruction, 
    createMintToInstruction, 
    getAssociatedTokenAddressSync,
    MINT_SIZE,
    TOKEN_PROGRAM_ID,
} from '@solana/spl-token'


function createKeypairFromFile(path: string): Keypair {
    return Keypair.fromSecretKey(
        Buffer.from(JSON.parse(require('fs').readFileSync(path, "utf-8")))
    )
};


describe("Create a new SPL token", async () => {

    // const connection = new Connection(`http://localhost:8899`, 'confirmed');
    const connection = new Connection(`https://api.devnet.solana.com`, 'confirmed');
    const payer = createKeypairFromFile(require('os').homedir() + '/.config/solana/id.json');

    const mintKeypair = Keypair.generate();
    const testKeypair = Keypair.generate();
    let associatedTokenAddress: PublicKey;

    it("Create our test user account", async () => {

        let ix = SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: testKeypair.publicKey,
            lamports: 1 * LAMPORTS_PER_SOL,
            space: 0,
            programId: SystemProgram.programId,
        });

        await sendAndConfirmTransaction(
            connection, 
            new Transaction().add(ix),
            [payer, testKeypair]
        );

        console.log(`-- Test User Address: ${testKeypair.publicKey.toBase58()}`);
    });

    it("Create the mint account", async () => {

        let ix = SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: mintKeypair.publicKey,
            lamports: 1 * LAMPORTS_PER_SOL,
            space: MINT_SIZE,
            programId: TOKEN_PROGRAM_ID,
        });

        await sendAndConfirmTransaction(
            connection,
            new Transaction().add(ix),
            [payer, mintKeypair]
        );

        console.log(`-- Mint Address: ${mintKeypair.publicKey.toBase58()}`);
    });

    it("Initialize the mint account as an SPL token mint", async () => {

        let ix = createInitializeMintInstruction(
            mintKeypair.publicKey,
            9,
            testKeypair.publicKey,
            testKeypair.publicKey,
        );

        await sendAndConfirmTransaction(
            connection,
            new Transaction().add(ix),
            [payer, mintKeypair]
        );
    });

    it("Create a token account for that mint under our test account", async () => {

        associatedTokenAddress = getAssociatedTokenAddressSync(
            mintKeypair.publicKey,
            testKeypair.publicKey,
        );

        let ix = createAssociatedTokenAccountInstruction(
            payer.publicKey,
            associatedTokenAddress,
            testKeypair.publicKey,
            mintKeypair.publicKey,
        );

        await sendAndConfirmTransaction(
            connection,
            new Transaction().add(ix),
            [payer, testKeypair]
        );

        console.log(`-- Associated Token Address: ${associatedTokenAddress.toBase58()}`);
    });

    it("Mint to that token account", async () => {

        let ix = createMintToInstruction(
            mintKeypair.publicKey,
            associatedTokenAddress,
            testKeypair.publicKey,
            1,
        );

        await sendAndConfirmTransaction(
            connection,
            new Transaction().add(ix),
            [payer, testKeypair]
        );
  });

  it("Burn all tokens in the token account", async () => {

    let ix = createBurnInstruction(
        associatedTokenAddress,
        mintKeypair.publicKey,
        testKeypair.publicKey,
        1,
    );

    await sendAndConfirmTransaction(
        connection,
        new Transaction().add(ix),
        [payer, testKeypair]
    );
});

  it("Close the token account", async () => {

    let ix = createCloseAccountInstruction(
        associatedTokenAddress,
        testKeypair.publicKey,
        testKeypair.publicKey,
    );

    await sendAndConfirmTransaction(
        connection,
        new Transaction().add(ix),
        [payer, testKeypair]
    );
  })
});