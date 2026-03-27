import json
from web3 import Web3

class ContractWrapper:
    def __init__(self, contract_address, provider_url):
        with open("abi/HustToken.json", "r") as f:
            abi = json.load(f)['abi']

        self.w3 = Web3(Web3.HTTPProvider(provider_url))
        self.contract_address = contract_address
        self.contract = self.w3.eth.contract(address=contract_address, abi=abi)

    def get_balance(self, address):
        return self.contract.functions.balanceOf(address).call()

    def mint(self, to_address, amount, private_key):
        # The address you are acting as is derived from the private key you provide
        sender_account = self.w3.eth.account.from_key(private_key)
        sender_address = sender_account.address
        
        tx = self.contract.functions.mint(to_address, amount).build_transaction({
            'from': sender_address,
            'nonce': self.w3.eth.get_transaction_count(sender_address),
            'gas': 2000000,
            'gasPrice': self.w3.eth.gas_price,
        })
        signed_tx = self.w3.eth.account.sign_transaction(tx, private_key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        return self.w3.to_hex(tx_hash)