## Signals

ID: 1 - anonymously_funded_smart_contract_triggered

|Requires|Output|
|--------|------|
|block, suspicious_contracts| contract_address, transaction_hash, block|

contract_address - address of the contract that has been called 

ID: 2 - anonymously_funded_smart_contract_triggered_with_profit

|Requires|Output|
|--------|------|
|block, suspicious_contracts| contract_address, transaction_hash, block|

contract_address - address of the contract that has been called 

ID: 3 - transfer_from_fixed_float

|Requires|Output|
|--------|------|
|block| recipient, value , block_timestamp, block, transaction_hash|

recipient - the account that received from fixed float, this is the account that we suspect

ID: 4 - tornado_cash_withdraw

|Requires|Output|
|--------|------|
|block| tornado_address, recipient, relayer, tornado_address_name, block_timestamp, block, transaction_hash|

tornado_address - the tornado cash address that the contract call is interacting with, tornado_address_name is the human-readable version of this

recipient - the account that received from tornado cash, this is the account that we suspect

relayer - some relay services build on top of tornado cash, this is tracked because it may be linked to severity later but is not material currently

tornado_address_name - tornado cash splits addresses based on amounts


ID: 5 - tornado_cash_deposit

|Requires|Output|
|--------|------|
|block| tornado_address, tornado_address_name, from_address, block_timestamp, block, transaction_hash|

tornado_address - the tornado cash address that the contract call is interacting with, tornado_address_name is the human-readable version of this

tornado_address_name - tornado cash splits addresses based on amounts

from_address - the account deposited to tornado cash, this is the account that we suspect

## Events


ID: 3 - suspicious_contract_created

|Requires|Output|
|--------|------|
|block, api, suspicious_addresses|creator, contract_code, contract_address, block_timestamp, block, transaction_hash|

creator - the account that created the smart contract, this is the account that has been previously identified as being suspect

contract_code - the code of the smart contract

contract_address - the address of the smart contract


## Explain

Suspicious contract call is defined by these events:
* An account funds itself with an anonymous source
* The same account creates a contract
* The same account calls that contract

The final event triggers a signal.

Suspicious addresses and contracts should be cached.

When an address creates a contract, we have to call eth_getTransactionReceipt in order to get the contract address.

Future:
* When a signal is triggered, we should call eth_getBalance to see if the transaction has triggered a state change.

Example of suspicious contract call with GROK exploit:
* [Transfer from FixedFloat](https://etherscan.io/tx/0x3e9bcee951cdad84805e0c82d2a1e982e71f2ec301a1cbd344c832e0acaee813) 
* [Suspicious contract creation](https://etherscan.io/tx/0xc727091f212aa24561e1ab7693b752b584013c3e914b177a2675d108d487738f)
* [Suspicious contract call](https://etherscan.io/tx/0x3e9bcee951cdad84805e0c82d2a1e982e71f2ec301a1cbd344c832e0acaee813)