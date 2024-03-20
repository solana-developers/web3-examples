# Metaplex Metadata Expanded




# Adding Metadata to SPL Token using Metaplex




This repository contains an example showcasing how to add metadata to a SPL token using Metaplex on the Solana blockchain.




## Prerequisites




Before running the example, ensure you have the following installed:




- Node.js

- npm or yarn

- Solana CLI




## Setup




1. Clone this repository:




    ```bash

    git clone https://github.com/yourusername/metaplex-spl-token-metadata-example.git

    cd metaplex-spl-token-metadata-example

    ```




2. Install dependencies:




    ```bash

    npm install

    # or

    yarn install

    ```




3. Ensure you have a Solana wallet set up and funded.




## Usage




1. Set up your Solana wallet:




    - Ensure you have a Solana wallet created and funded.

    - Export your wallet's secret key and save it in JSON format. You can do this using the Solana CLI or any other wallet management tool.

    - Replace the `USER_KEYPAIR_PATH` variable in `helpers.ts` with the path to your wallet's JSON file.




2. Run the example:




    ```bash

    npm start

    # or

    yarn start

    ```




    This will create a new SPL token with associated metadata and mint 10 tokens.




## Explanation




The example consists of two main files:




- `helpers.ts`: Contains helper functions and configurations, including setting up the Solana connection and loading the user's keypair.




```typescript

import { readFileSync } from 'fs';

import { homedir } from 'os';

import { Keypair } from '@solana/web3.js';




const USER_KEYPAIR_PATH = "/home/shubh/.config/solana/id.json";

export const userKeypair = Keypair.fromSecretKey(

    Buffer.from(JSON.parse(readFileSync(USER_KEYPAIR_PATH, "utf-8")))

);

```

- `main.ts`: Contains the main logic for creating metadata and minting tokens using Metaplex.

```typescript

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";

import { userKeypair } from "./helpers";

import { generateSigner, keypairIdentity, percentAmount } from "@metaplex-foundation/umi";

import { TokenStandard, createFungible, createV1, mintV1, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";




// Code omitted for brevity




createMetadataDetails().then(() => {

    minToken().then(() => {

        console.log("Token minted successfully");

    });

});

```

We use the `@metaplex-foundation/umi-bundle-defaults` package to create a UMI instance for interacting with the Solana blockchain. Then, we use the `mplTokenMetadata()` plugin to enable metadata-related functionalities.




The `createMetadataDetails()` function creates metadata for the token, specifying details such as name, symbol, URI, etc. The `minToken()` function then mints the specified number of tokens associated with the created metadata.




## Additional Notes




- Ensure you're connected to the correct Solana network (devnet, testnet, or mainnet) as specified in `helpers.ts`.

- Modify the metadata object in `main.ts` to customize the token's details.

-This example is set up for the Solana devnet. Adjust network configurations accordingly for testnet or mainnet deployment.
