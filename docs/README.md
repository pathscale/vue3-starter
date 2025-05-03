
# auth Server
ID: 1
## Endpoints
|Method Code|Method Name|Parameters|Response|Description|
|-----------|-----------|----------|--------|-----------|
|10020|Login|username, password, service, device_id, device_os|username, display_name, avatar, role, user_id, user_token, admin_token||
|10010|Signup|username, password, email, phone, agreed_tos, agreed_privacy|username, user_id||
|10030|Authorize|username, token, service, device_id, device_os|success, user_id, role||
|10040|Logout||||

# user Server
ID: 2
## Endpoints
|Method Code|Method Name|Parameters|Response|Description|
|-----------|-----------|----------|--------|-----------|
|20000|UserStatus||status, time||
|20010|UserSubLogs||||
|20020|UserSubEvents|topic|||
|20030|UserSubPosition|unsubscribe|data||
|20031|UserCancelOrClosePosition|id|||
|20040|UserSubOrders|strategy_id, unsubscribe|data||
|20100|UserListStrategy|name|strategies||
|20110|UserInitStrategy|strategy_id|success, reason||
|20120|UserSubPrice0|unsubscribe_other_symbol, symbol|data||
|20130|UserGetPrice0|time_start, time_end, symbol|data||
|20140|UserControlStrategy|strategy_id, config, paused|success, reason||
|20150|UserGetStrategyZeroSymbol|symbol|data||
|20160|UserSubSignal0|unsubscribe_other_symbol, symbol|data||
|20170|UserGetSignal0|min_level, time_start, time_end, symbol|data||
|20180|UserGetDebugLog|limit, page|data||
|21000|UserSetEncryptedKey|key|success, reason||
|21010|UserStartService|keys|success, reason||
|21020|UserSetStrategyStatus|set_status|data||
|20200|UserGetStrategyOneSymbol|symbol|data||
|20210|UserSetSymbolFlag1|flag, symbol|success, reason||
|20240|UserGetEvent1|id, time_start, time_end, symbol|data||
|20250|UserSubEvent1|symbol|data||
|20260|UserGetStrategyOneAccuracy||count_correct, count_wrong, accuracy||
|20261|UserGetAccuracy|symbol|count_correct, count_wrong, accuracy||
|20271|UserGetOrdersPerStrategy|event_id, client_id, strategy_id, time_start, time_end, symbol|data||
|20280|UserSubStrategyOneOrder|symbol|data||
|20291|UserGetLedger|client_id, include_ack, strategy_id, time_start, time_end, symbol|data||
|20292|UserGetHedgedOrders|strategy_id|data||
|20300|UserSubLedgerStrategyOne|symbol|data||
|20301|UserSubLedger|strategy_id, symbol|data||
|20310|UserGetLiveTestAccuracyLog|tag, time_start, time_end|data||
|20320|UserGetSignal1|signal, min_level, symbol, time_start, time_end|data||
|20330|UserSubSignal1|symbol|data||
|20340|UserGetEncryptedKey||data||
|20350|UserDeleteEncryptedKey|exchange, account_id|success, reason||
|20360|UserDecryptEncryptedKey|encryption_key, exchange, account_id|success, reason||
|20370|UserGetPriceDifference|time_start, time_end, symbol|data||
|20380|UserSubPriceDifference|unsubscribe_other_symbol, symbol|data||
|20390|UserSubFundingRates|exchange, symbol, unsub|data||
|20400|UserAddBlacklist|strategy_id, list|success, reason||
|20410|UserRemoveBlacklist|strategy_id, list|success, reason||
|20420|UserGetBlacklist|strategy_id|data||
|20430|UserGetSymbol2|symbol|data||
|20440|UserGetBestBidAskAcrossExchanges|latest, time_start, time_end, symbol|data||
|20450|UserSubBestBidAskAcrossExchanges|unsubscribe_other_symbol, symbol|data||
|20460|UserGetSignal2|signal, min_level, symbol, time_start, time_end|data||
|20470|UserSubSignal2|symbol|data||
|20520|UserPlaceOrderMarket|exchange, symbol, side, price, size, local_id|success, reason, local_id, client_id||
|20521|UserPlaceOrderLimit|exchange, symbol, side, price, size, local_id|success, reason, local_id, client_id||
|20522|UserS3CaptureEvent|event_id|success, reason, local_id, client_id||
|20523|UserS3ReleasePosition|event_id|success, reason, local_id, client_id||
|20524|UserSubStrategy3PositionsOpening|unsubscribe|data||
|20525|UserSubStrategy3PositionsClosing|unsubscribe|data||
|20530|UserCancelOrder|exchange, symbol, local_id|success, reason||
|20540|UserListTradingSymbols||data||
|20550|UserGetLiveTestCloseOrder1||data||
|20560|UserSubExchangeLatency|unsub, time_start, time_end|data||
|20610|SubS3TerminalBestAskBestBid|unsubscribe_other_symbol, symbol|data||
|20620|UserGetBestBidAskAcrossExchangesWithPositionEvent|id, time_start, time_end, symbol|data||
|20630|UserSubBestBidAskAcrossExchangesWithPositionEvent|symbol|data||
|20640|UserGet5MinSpreadMean||data||
|20650|UserSetS2Configure|configuration|success, reason||
