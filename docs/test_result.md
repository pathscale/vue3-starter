# Test Results

### Flume Channel
M3 Pro + VMWare + Ubuntu Aarch64
```
Sync flume limit (both tx/rx sync): 4,900,000 messages/second
Async flume limit (both tx/rx async): 4,400,000 messages/second
Sync flume limit (tx sync, tx sync, rx async): tx sync 1,200,000 rx async 1,200,000
```
Above we can see that, between sync and async receiver, there is no noticeable throughput difference.  
And with multiple sync receiver, it becomes way slower.  
This is because with mpsc (original receiver), data is being sent,  
whereas with mpmc (every cloned receiver), data is being cloned.


### GlueSQL price table performance benchmark [test code here](../src/db/gluesql/schema/price.rs)
```
1 single selection:
in-memory DB 1hr data: 700ms
persistent DB 1hr data: 2700ms
in-memory DB 24hr data: 23000ms
persistent DB 24hr data: 82500ms
```

### Comparison between databases
target/debug/test_db_gluesql_ast
```
Time taken to CREATE: 2.16406125s
Time taken to READ:   973.094375ms
Time taken to UPDATE: 2.36418475s
Time taken to DELETE: 2.397680959s
```

target/debug/test_db_gluesql_string
```
Time taken to CREATE: 22.136918666s
Time taken to READ:   503.521875ms
Time taken to UPDATE: 1.93740275s
Time taken to DELETE: 2.132748416s
```

target/debug/test_db_postgres
```
Time taken to CREATE: 15.24647275s
Time taken to READ:   537.357708ms
Time taken to UPDATE: 142.776125ms
Time taken to DELETE: 32.372583ms
```

target/debug/test_db_reindeer_loadall
```
Time taken to CREATE: 1.253265291s
Time taken to READ:   130.536875ms
Time taken to UPDATE: 696.724958ms
Time taken to DELETE: 2.296734667s
```

target/debug/test_db_reindeer
```
Time taken to CREATE: 1.238880333s
Time taken to READ: 272.135916ms
Time taken to UPDATE: 673.383417ms
Time taken to DELETE: 2.282613958s
```

target/debug/test_db_rusqlite_raw_transactional_condition
```
Time taken to CREATE: 273.577708ms
Time taken to READ:   51.459µs
Time taken to UPDATE: 19.792584ms
Time taken to DELETE: 1.324166ms
```

target/debug/test_db_rusqlite_raw_transactional
```
Time taken to CREATE: 288.251834ms
Time taken to READ:   37.792µs
Time taken to UPDATE: 20.276916ms
Time taken to DELETE: 1.257583ms
```

target/debug/test_db_rusqlite_raw
```
Time taken to store: 17.69727275s
Time taken to READ:   31.041µs
Time taken to UPDATE: 21.272416ms
Time taken to DELETE: 1.32025ms
```

target/debug/test_db_rusqlite_serde
```
Time taken to CREATE: 17.584063875s
Time taken to READ:   53.375µs
Time taken to UPDATE: 207.875µs
Time taken to DELETE: 1.667167ms
```

target/debug/test_db_im_rusqlite_transactional
```
Time taken to CREATE: 275.836583ms
Time taken to READ:   18.125µs
Time taken to UPDATE: 16.212125ms
Time taken to DELETE: 1.155833ms
```

target/debug/test_db_im_rusqlite
```
Time taken to CREATE: 388.231791ms
Time taken to READ:   31.25µs
Time taken to UPDATE: 16.43225ms
Time taken to DELETE: 978.209µs
```
