# Wrapped tokens

Create a Wrapped Token example for (Wrapping sol).
`yarn main` or `npm run main`

## What is a Wrapped Token?

Wrapped tokens are digital assets that represent the value of an original cryptocurrency from a different blockchain or adhere to a different token standard on the current blockchain. They serve as bridges between different blockchain ecosystems, enabling cross-chain compatibility and expanding the utility of native assets.

## Wrapped SOL (wSOL)

Wrapped SOL, also known as wSOL, is a tokenized representation of Solana's native token, SOL. Each wSOL token is designed to maintain a 1:1 peg with SOL, meaning that one wSOL is always equal to one SOL. wSOL was specifically created to allow users to utilize SOL on blockchain platforms that support the ERC-20 token standard, such as Ethereum. This compatibility enables SOL holders to access decentralized finance (DeFi) protocols and non-fungible token (NFT) markets on these alternative chains.

## Creating and Retrieving wSOL

When you want to wrap SOL, you need to send SOL to an associated token account on the native mint and call syncNative. syncNative updates the amount field on the token account to match the amount of wrapped SOL available.

1. Getting associatedTokenAccount address

The associated token account is where the wrapped SOL tokens will be stored.
Use the getAssociatedTokenAddress function to retrieve the associated token account address, providing the native mint (SOL) and the wallet's public key.

```TypeScript
  const associatedTokenAccount = await getAssociatedTokenAddress(
    NATIVE_MINT,      // native mint
    wallet.publicKey  // the wallet where we want to send sol
  )
```

2. Creating associated token account

Build a transaction (ataTransaction) that includes the createAssociatedTokenAccountInstruction to create the associated token account.
Specify the payer, associated token account address, owner, and the native mint (SOL).

```TypeScript
 const ataTransaction = new Transaction()
    .add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,        // payer
        associatedTokenAccount,  //associatedToken address
        wallet.publicKey,        // owner
        NATIVE_MINT             // native mint
      )
    )
```

3. Transferring sol to associated token account

Construct a transaction (solTransferTransaction) that transfers SOL from the sender's address to the associated token account.
Include the SystemProgram.transfer instruction to initiate the transfer.
Add the createSyncNativeInstruction to update the amount field on the token account to match the wrapped SOL amount.

```TypeScript
const solTransferTransaction = new Transaction()
    .add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,     // sending from
        toPubkey: associatedTokenAccount, // receiving to
        lamports: LAMPORTS_PER_SOL        // amount
      }),
      createSyncNativeInstruction(        // syncNative instruction
        associatedTokenAccount
      )
    )
```

4. To retrieve the wrapped SOL tokens, close the associated token account and send the corresponding SOL amount to the desired address (in this case, the wallet address).

```TypeScript
 await closeAccount(connection, wallet, associatedTokenAccount, wallet.publicKey, wallet);
```

5. Here we are checking amount of sol after unwrapping

Verify the wallet's SOL balance post-unwrapping by using the getBalance function with the wallet's public key.

```TypeScript
const walletBalancePostClose = await connection.getBalance(wallet.publicKey);
```
