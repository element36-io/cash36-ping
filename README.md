
Try the contract (Dapp) online [here](https://element36-io.github.io/cash36-ping/). 
To try this example locally, do: 

```
truffle build
npm truffle migrate
npm run dev
```

Play with [dapp.js](./src/dapp.js) and [MyPing.sol](./contracts/MyPing.sol)  and do a truffle migrate to deploy your MyPing Contract. 
The app.js can connect to an existing Ping (not MyPing) contract - so you dont have to set up a
local blockchain - see line 4 and 5 of app.js.
