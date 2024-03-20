import { readFileSync } from 'fs';
import { homedir } from 'os';
import { Keypair } from '@solana/web3.js';

const USER_KEYPAIR_PATH = "/home/shubh/.config/solana/id.json";
export const userKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(readFileSync(USER_KEYPAIR_PATH, "utf-8")))
);
