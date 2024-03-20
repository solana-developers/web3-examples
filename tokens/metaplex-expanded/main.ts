import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { userKeypair } from "./helpers";
import { generateSigner, keypairIdentity, percentAmount } from "@metaplex-foundation/umi";
import { TokenStandard, createFungible, createV1, mintV1, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";

const umi = createUmi('https://api.devnet.solana.com');
const keypair = umi.eddsa.createKeypairFromSecretKey(userKeypair.secretKey);
umi.use(keypairIdentity(keypair))
    .use(mplTokenMetadata())

const metadata = {
    name: "Token name!",
    symbol: "Token Symbol!",
    uri: "https://your-uri-url.json",

        // uri-url consist of:
        // {
        //     "name": "token name!",
        //     "symbol": "token symbol!",
        //     "description": "small token description!",
        //     "image": "token image url"
        // }
};

const mint = generateSigner(umi);
async function createMetadataDetails() {
    await createV1(umi, {
        mint,
        authority: umi.identity,
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadata.uri,
        sellerFeeBasisPoints: percentAmount(0),
        decimals: 9,
        tokenStandard: TokenStandard.Fungible,
    }).sendAndConfirm(umi)
}
async function minToken() {
    await mintV1(umi, {
        mint: mint.publicKey,
        authority: umi.identity,
        amount: 10_00000000000,
        tokenOwner: umi.identity.publicKey,
        tokenStandard: TokenStandard.Fungible,
    }).sendAndConfirm(umi)
}

createMetadataDetails().then(() => {
    minToken().then(() => {
        console.log("Token minted successfully");
    });
});
