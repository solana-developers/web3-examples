import solana
from solana.rpc.api import Client
from solana.account import Account

# Initialize a Solana RPC client
rpc_url = "https://api.mainnet-beta.solana.com"  # Use the desired Solana network
client = Client(rpc_url)

# Define the Solana address you want to query
solana_address = "SOLANA_ADDRESS_GOES_HERE"

# Convert the address to bytes
address_bytes = solana.decode(solana_address)

# Query account information
response = client.get_account_info(address_bytes)

if response:
    account_data = response.get("result", {})
    balance = account_data.get("value", {}).get("lamports", 0) / 10**9  # Convert lamports to SOL
    owner = account_data.get("value", {}).get("owner", "")
    print(f"Solana Address: {solana_address}")
    print(f"Balance: {balance} SOL")
    print(f"Owner: {owner}")
else:
    print(f"Failed to retrieve account information for {solana_address}")
