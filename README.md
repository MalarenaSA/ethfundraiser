# ethfundraiser
_An Ethereum DApp that can be used to raise funds, with payments then released based on contributors voting for each spending request._
> Created by Malarena SA - [www.malarena.com](https://www.malarena.com)

## Basic DApp functionality
The DApp has the following pages:
- Home - Provides an overview of the application and how the process works for Fund Raisers and Contributors
- New Contract - Provides the ability to deploy a new FundRaiser Smart Contract onto the Ethereum Blockchain by supplying the contract duration, initial payment duration, goal and minimum contribution level for the fundraising campaign
- Existing Contract - Provides the ability to view the current status and interact with an existing contract already deployed, including making contributions, getting a refund (if allowed) and changing the contract owner
- Spending Requests - Provides the ability for the contract owner to raise spending requests, for contributors to vote on them, and once approved for the funds to be released

In addition there are two pop-up tools:
- Block Converter - This provides a conversion between number of blocks and duration (in Days/Hours/Minutes) based on the current network block time, which can be set manually or uses the current Network Average Block Time from Etherscan
- Wei Converter - A simple converter between Wei, Ether and USD based on the current rates published in Etherscan

## FundRaiser Smart Contract functionality
For a complete overview of the FundRaiser Smart Contract functionality, including all test and verification routines completed, please see the [fundraiser](https://github.com/MalarenaSA/fundraiser) repository.

The Smart Contract is deployed using the "New Contract" option in the DApp. However, it can also be compiled and deployed stand-alone using [Remix](https://remix.ethereum.org/) or [Truffle](https://www.trufflesuite.com/truffle).

## Tooling Overview
This DApp has an HTML front-end built using the [Bootstrap](https://getbootstrap.com/) toolkit, and uses JavaScript and the [web3.js](https://github.com/ethereum/web3.js) API to process transactions via an Ethererum Wallet (such as [MetaMask](https://metamask.io/)) onto the Ethereum Blockchain using the "FundRaiser" smart contract, all of which is supported using data from [Etherscan](https://etherscan.io/).

The web server is hosted using the [express](https://www.npmjs.com/package/express) Node.js module in HTTPS mode.

## Installation and set-up
This DApp is currently running at https://www.ethfundraiser.xyz. However, to install a stand-alone version of the DApp you will need to have [npm](https://www.npmjs.com/) and [Node.js](https://nodejs.org/en/) installed, and then:
1) Open a terminal windows/command prompt, navigate to the directory required and then `git clone` the ethfundraiser repository
2) Change to the newly created directory and run `npm install` to load the required npm modules
3) Edit the `./public/js/ethfundraiser_defaults_ToDo.js` file and update the DApp default values, such as your donation address, Etherscan API Key and WebHosting URL. Save this file in the same directory using `ethfundraiser_defaults.js` as the filename
4) If you wish to use HTTPS the edit `server.js` and modify the certPath = '' directory with the path to your HTTPS certificate & key files
5) To start-up the webserver run `npm run server`. The webserver should then be running on http://localhost:3000/. Adjust the port settings in `server.js` as required

## Project Structure
```powershell
ethfundraiser
  ├── public                  # Contains the front-end HTML, JavaScript, Image and Test files
  ├── node_modules            # Created by NPM to hold all the Node Modules and dependencies
  ├ server.js                 # The Node.js WebServer Hosting application
  ├ ...                       # Various other configuration files used by the tools
```

## Future Updates/Ideas
- Review MetaMask breaking changes (due Q2/2020) and update app as required
- See if the DApp can be used with other wallets such as MyCrypto Desktop and MyEtherWallet/MyCrypto web wallets
- Potential to improve method for iterating over a struct to remove votes during a refund rather than putting a hard-coded max limit on Spending Requests
