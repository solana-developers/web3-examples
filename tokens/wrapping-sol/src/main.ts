import { NATIVE_MINT, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, createSyncNativeInstruction, getAccount, closeAccount } from "@solana/spl-token";
import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";

(async () => {

  // setting up devnet connection

  const connection = new Connection(
    clusterApiUrl('devnet'),
    'confirmed'
  )
  const wallet = Keypair.generate();

  // airdropping sol to wallet

  const airdropSignature = await connection.requestAirdrop(
    wallet.publicKey,
    2 * LAMPORTS_PER_SOL,
  );

  await connection.confirmTransaction(airdropSignature);

  // getting associatedTokenAccount address with native mint

  const associatedTokenAccount = await getAssociatedTokenAddress(
    NATIVE_MINT,
    wallet.publicKey
  )

  // Create associated token account to hold your wrapped SOL

  const ataTransaction = new Transaction()
    .add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        associatedTokenAccount,
        wallet.publicKey,
        NATIVE_MINT
      )
    );

  await sendAndConfirmTransaction(connection, ataTransaction, [wallet]);

  // Transfer SOL to associated token account and use SyncNative to update wrapped SOL balance

  const solTransferTransaction = new Transaction()
    .add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: associatedTokenAccount,
        lamports: LAMPORTS_PER_SOL
      }),
      createSyncNativeInstruction(
        associatedTokenAccount
      )
    )

  // transaction for sending sol
  const tx = await sendAndConfirmTransaction(connection, solTransferTransaction, [wallet]);
  console.log(`tx signature: ${tx}`)
  // getting account information
  const accountInfo = await getAccount(connection, associatedTokenAccount);
  console.log(`Native: ${accountInfo.isNative}, Lamports: ${accountInfo.amount}`);
  const walletBalance = await connection.getBalance(wallet.publicKey);
  console.log(`Balance before unwrapping 1 WSOL: ${walletBalance}`)

  // retrieving WSOL and send tokens to wallet
  await closeAccount(connection, wallet, associatedTokenAccount, wallet.publicKey, wallet);
  const walletBalancePostClose = await connection.getBalance(wallet.publicKey);
  console.log(`Balance after unwrapping 1 WSOL: ${walletBalancePostClose}`)

})();