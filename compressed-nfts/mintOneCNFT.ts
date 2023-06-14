import { createCreateTreeInstruction, PROGRAM_ID as BUBBLEGUM_PROGRAM_ID, createMintToCollectionV1Instruction, TokenProgramVersion } from "@metaplex-foundation/mpl-bubblegum";
import { loadWalletKey, sendVersionedTx } from "./utils";
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, VersionedMessage } from "@solana/web3.js";
import { SPL_ACCOUNT_COMPRESSION_PROGRAM_ID, SPL_NOOP_PROGRAM_ID, ValidDepthSizePair, getConcurrentMerkleTreeAccountSize } from "@solana/spl-account-compression";
import {
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";

async function mintOneCNFT() {
  // Load the wallet key for the user who will mint the CNFT
  const keypair = loadWalletKey("CNFT.json");

  // Create a connection to the Solana network
  const connection = new Connection("https://api.devnet.solana.com");

  // Load the wallet key for the merkle tree account
  const merkleTree = loadWalletKey("TREE.json").publicKey;

  // load the Merkle Tree account

  // Find the tree authority public key and bump seed
  const [treeAuthority, _bump] = PublicKey.findProgramAddressSync(
    [merkleTree.toBuffer()],
    BUBBLEGUM_PROGRAM_ID,
  );

  // Define the collection mint public key
  const collectionMint = new PublicKey("COLL"); //Replace with your Collection Account

  // Find the collection metadata account public key
  const [collectionMetadataAccount, _b1] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata", "utf8"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      collectionMint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );

  // Find the collection edition account public key
  const [collectionEditionAccount, _b2] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata", "utf8"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      collectionMint.toBuffer(),
      Buffer.from("edition", "utf8"),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );

  // Find the bubblegum signer public key
  const [bgumSigner, __] = PublicKey.findProgramAddressSync(
    [Buffer.from("collection_cpi", "utf8")],
    BUBBLEGUM_PROGRAM_ID
  );

  // Create the mint-to-collection instruction
  const ix = await createMintToCollectionV1Instruction({
    treeAuthority: treeAuthority,
    leafOwner: keypair.publicKey,
    leafDelegate: keypair.publicKey,
    merkleTree: merkleTree,
    payer: keypair.publicKey,
    treeDelegate: keypair.publicKey,
    logWrapper: SPL_NOOP_PROGRAM_ID,
    compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    collectionAuthority: keypair.publicKey,
    collectionAuthorityRecordPda: BUBBLEGUM_PROGRAM_ID,
    collectionMint: collectionMint,
    collectionMetadata: collectionMetadataAccount,
    editionAccount: collectionEditionAccount,
    bubblegumSigner: bgumSigner,
    tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
  }, {
    metadataArgs: {
      collection: { key: collectionMint, verified: false },
      creators: [],
      isMutable: true,
      name: "Just a cNFT",
      primarySaleHappened: true,
      sellerFeeBasisPoints: 0,
      symbol: "cNFT",
      uri: "https://shdw-drive.genesysgo.net/QZNGUVnJgkw6sGQddwZVZkhyUWSUXAjXF9HQAjiVZ55/collection.json",
      uses: null,
      tokenStandard: null,
      editionNonce: null,
      tokenProgramVersion: TokenProgramVersion.Original
    }
  });

  // Send the transaction with the mint-to-collection instruction
  const sx = await sendVersionedTx(connection, [ix], keypair.publicKey, [keypair]);
  console.log(sx);
}

mintOneCNFT();
