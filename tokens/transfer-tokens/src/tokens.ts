import {
    createCreateMasterEditionV3Instruction,
    createCreateMetadataAccountV3Instruction, PROGRAM_ID,
} from '@metaplex-foundation/mpl-token-metadata'
import {
    createAssociatedTokenAccountInstruction,
    createInitializeMintInstruction, 
    createMintToInstruction, 
    getAssociatedTokenAddressSync, 
    MINT_SIZE, 
    TOKEN_PROGRAM_ID,
    transfer,
} from "@solana/spl-token"
import { 
    Connection, 
    Keypair, 
    PublicKey, 
    SystemProgram,
    TransactionInstruction, 
} from "@solana/web3.js"
import {
    buildTransaction,
    logBalance,
    logNewKeypair,
    logNewMint,
    logTransaction,
    newLogSection,
} from './util'


const connection = new Connection(
    "https://api.devnet.solana.com", 
    {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
    },
)

export async function createAccount(accountName: string, newAccountKeypair: Keypair, payerKeypair: Keypair) {
    const lamports = 
        await connection.getMinimumBalanceForRentExemption(0)
    const createAccountInstruction = SystemProgram.createAccount({
        fromPubkey: payerKeypair.publicKey,
        newAccountPubkey: newAccountKeypair.publicKey,
        lamports,
        space: 0,
        programId: SystemProgram.programId,
    })
    const createAccountTransaction = await buildTransaction(
        connection, 
        payerKeypair.publicKey, 
        [payerKeypair, newAccountKeypair], 
        [createAccountInstruction]
    )
    const signature = await connection.sendTransaction(createAccountTransaction)
    
    newLogSection()
    logNewKeypair(newAccountKeypair)
    await logTransaction(connection, signature)
    await logBalance(accountName, connection, newAccountKeypair.publicKey)
}

export async function createSplToken(
    mintKeypair: Keypair, 
    payerKeypair: Keypair,
    tokenName: string,
    tokenSymbol: string,
    tokenUri: string,
) {
    // Create the account for the Mint
    const createMintAccountInstruction = SystemProgram.createAccount({
        fromPubkey: payerKeypair.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        lamports: await connection.getMinimumBalanceForRentExemption(MINT_SIZE),
        space: MINT_SIZE,
        programId: TOKEN_PROGRAM_ID,
    });
    // Initialize that account as a Mint
    const initializeMintInstruction = createInitializeMintInstruction(
        mintKeypair.publicKey,
        9,
        payerKeypair.publicKey,
        payerKeypair.publicKey,
    );
    // Create the Metadata account for the Mint
    const createMetadataInstruction = createCreateMetadataAccountV3Instruction(
        {
            metadata: PublicKey.findProgramAddressSync(
                [ Buffer.from('metadata'), PROGRAM_ID.toBuffer(), mintKeypair.publicKey.toBuffer() ],
                PROGRAM_ID,
            )[0],
            mint: mintKeypair.publicKey,
            mintAuthority: payerKeypair.publicKey,
            payer: payerKeypair.publicKey,
            updateAuthority: payerKeypair.publicKey,
        },
        {
            createMetadataAccountArgsV3: {
                data: {
                    name: tokenName,
                    symbol: tokenSymbol,
                    uri: tokenUri,
                    creators: null,
                    sellerFeeBasisPoints: 0,
                    uses: null,
                    collection: null,
                },
                isMutable: false,
                collectionDetails: null,
            }
        }
    )
    const tx = await buildTransaction(
        connection, 
        payerKeypair.publicKey, 
        [payerKeypair, mintKeypair], 
        [createMintAccountInstruction, initializeMintInstruction, createMetadataInstruction],
    )
    const signature = await connection.sendTransaction(tx)

    newLogSection()
    await logTransaction(connection, signature)
    logNewMint(mintKeypair.publicKey, 9)
}

export async function createNft(
    mintKeypair: Keypair, 
    payerKeypair: Keypair,
    tokenName: string,
    tokenSymbol: string,
    tokenUri: string,
) {
    // Create the account for the Mint
    const createMintAccountInstruction = SystemProgram.createAccount({
        fromPubkey: payerKeypair.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        lamports: await connection.getMinimumBalanceForRentExemption(MINT_SIZE),
        space: MINT_SIZE,
        programId: TOKEN_PROGRAM_ID,
    });
    // Initialize that account as a Mint
    const initializeMintInstruction = createInitializeMintInstruction(
        mintKeypair.publicKey,
        0,
        payerKeypair.publicKey,
        payerKeypair.publicKey,
    );
    // Create the Metadata account for the Mint
    const createMetadataInstruction = createCreateMetadataAccountV3Instruction(
        {
            metadata: PublicKey.findProgramAddressSync(
                [ Buffer.from('metadata'), PROGRAM_ID.toBuffer(), mintKeypair.publicKey.toBuffer() ],
                PROGRAM_ID,
            )[0],
            mint: mintKeypair.publicKey,
            mintAuthority: payerKeypair.publicKey,
            payer: payerKeypair.publicKey,
            updateAuthority: payerKeypair.publicKey,
        },
        {
            createMetadataAccountArgsV3: {
                data: {
                    name: tokenName,
                    symbol: tokenSymbol,
                    uri: tokenUri,
                    creators: null,
                    sellerFeeBasisPoints: 0,
                    uses: null,
                    collection: null,
                },
                isMutable: false,
                collectionDetails: null,
            }
        }
    )
    const tx = await buildTransaction(
        connection, 
        payerKeypair.publicKey, 
        [payerKeypair, mintKeypair], 
        [createMintAccountInstruction, initializeMintInstruction, createMetadataInstruction],
    )
    const signature = await connection.sendTransaction(tx)

    newLogSection()
    await logTransaction(connection, signature)
    logNewMint(mintKeypair.publicKey, 0)
}

export async function mintSplTokens(
    mintPublicKey: PublicKey,
    mintAuthority: Keypair,
    payerKeypair: Keypair,
    recipientPublicKey: PublicKey,
    quantity: number,
) {
    newLogSection()
    console.log(`Minting ${quantity} tokens to recipient: ${recipientPublicKey}`)

    // Check to see if their Associated Token Account exists
    //      If not, create it
    //      -> Can also use `getOrCreateAssociatedTokenAccount()`
    //
    const ixList: TransactionInstruction[] = [];
    const associatedTokenAddress = getAssociatedTokenAddressSync(
        mintPublicKey,
        recipientPublicKey,
    );
    console.log(`   Recipient Associated Token Address: ${associatedTokenAddress}`)
    const associatedTokenAccountInfo = await connection.getAccountInfo(associatedTokenAddress)
    if (!associatedTokenAccountInfo || associatedTokenAccountInfo.lamports === 0) {
        ixList.push(
            createAssociatedTokenAccountInstruction(
                payerKeypair.publicKey,
                associatedTokenAddress,
                recipientPublicKey,
                mintPublicKey,
            )
        )
    }

    // Now mint to the recipient's Associated Token Account
    //
    ixList.push(
        createMintToInstruction(
            mintPublicKey,
            associatedTokenAddress,
            mintAuthority.publicKey,
            quantity,
        )
    )

    const tx = await buildTransaction(
        connection, 
        payerKeypair.publicKey, 
        [mintAuthority, payerKeypair], 
        ixList,
    )
    const signature = await connection.sendTransaction(tx)
    await logTransaction(connection, signature)
}

export async function mintNft(
    mintPublicKey: PublicKey,
    mintAuthority: Keypair,
    payerKeypair: Keypair,
    recipientPublicKey: PublicKey,
) {
    newLogSection()
    console.log(`Minting NFT to recipient: ${recipientPublicKey}`)

    // Check to see if their Associated Token Account exists
    //      If not, create it
    //      -> Can also use `getOrCreateAssociatedTokenAccount()`
    //
    const ixList: TransactionInstruction[] = [];
    const associatedTokenAddress = getAssociatedTokenAddressSync(
        mintPublicKey,
        recipientPublicKey,
    );
    console.log(`   Recipient Associated Token Address: ${associatedTokenAddress}`)
    const associatedTokenAccountInfo = await connection.getAccountInfo(associatedTokenAddress)
    if (!associatedTokenAccountInfo || associatedTokenAccountInfo.lamports === 0) {
        ixList.push(
            createAssociatedTokenAccountInstruction(
                payerKeypair.publicKey,
                associatedTokenAddress,
                recipientPublicKey,
                mintPublicKey,
            )
        )
    }

    // Now mint to the recipient's Associated Token Account
    //
    ixList.push(
        createMintToInstruction(
            mintPublicKey,
            associatedTokenAddress,
            mintAuthority.publicKey,
            1,
        )
    )

    // We can make this a Limited Edition NFT through Metaplex,
    //      which will disable minting by setting the Mint & Freeze Authorities to the
    //      Edition Account.
    //
    ixList.push(
        createCreateMasterEditionV3Instruction(
            {
                edition: PublicKey.findProgramAddressSync(
                    [ Buffer.from('metadata'), PROGRAM_ID.toBuffer(), mintPublicKey.toBuffer(), Buffer.from('edition') ],
                    PROGRAM_ID,
                )[0],
                metadata: PublicKey.findProgramAddressSync(
                    [ Buffer.from('metadata'), PROGRAM_ID.toBuffer(), mintPublicKey.toBuffer() ],
                    PROGRAM_ID,
                )[0],
                mint: mintPublicKey,
                mintAuthority: payerKeypair.publicKey,
                payer: payerKeypair.publicKey,
                updateAuthority: payerKeypair.publicKey,
            },
            {
                createMasterEditionArgs: { maxSupply: 1 }
            }
        )
    )

    // If we don't use Metaplex Editions, we must disable minting manually
    //
    // -------------------------------------------------------------------
    // ixList.push(
    //     createSetAuthorityInstruction(
    //         mintPublicKey,
    //         mintAuthority.publicKey,
    //         AuthorityType.MintTokens,
    //         null,
    //     )
    // )
    // ixList.push(
    //     createSetAuthorityInstruction(
    //         mintPublicKey,
    //         mintAuthority.publicKey,
    //         AuthorityType.FreezeAccount,
    //         null,
    //     )
    // )

    const tx = await buildTransaction(
        connection, 
        payerKeypair.publicKey, 
        [mintAuthority, payerKeypair], 
        ixList,
    )
    const signature = await connection.sendTransaction(tx)
    await logTransaction(connection, signature)
}

export async function transferTokens(
    mintPublicKey: PublicKey,
    payerKeypair: Keypair, 
    fromKeypair: Keypair, 
    toPublicKey: PublicKey, 
    quantity: number,
) {
    
    const ixList: TransactionInstruction[] = [];

    // Again, we're just checking to see if the Associated Token Account exists
    //      If not, we need to create it so we can use it in the transfer
    async function checkAndAddAssociatedTokenAccountInstruction(owner: PublicKey): Promise<PublicKey> {
        const associatedTokenAddress = getAssociatedTokenAddressSync(
            mintPublicKey,
            fromKeypair.publicKey,
        )
        const associatedTokenAccountInfo = await connection.getAccountInfo(associatedTokenAddress)
        if (!associatedTokenAccountInfo || associatedTokenAccountInfo.lamports === 0) {
            ixList.push(
                createAssociatedTokenAccountInstruction(
                    payerKeypair.publicKey,
                    associatedTokenAddress,
                    owner,
                    mintPublicKey,
                )
            )
        }
        return associatedTokenAddress
    }
    const fromAtaAddress = await checkAndAddAssociatedTokenAccountInstruction(fromKeypair.publicKey)
    const toAtaAddress = await checkAndAddAssociatedTokenAccountInstruction(toPublicKey)

    // Transfer the tokens
    const signature = await transfer(
        connection,
        payerKeypair,
        fromAtaAddress,
        toAtaAddress,
        fromKeypair,
        quantity,
    )
    newLogSection()
    await logTransaction(connection, signature)
}