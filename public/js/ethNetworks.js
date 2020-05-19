"use strict";
/* eslint-disable no-unused-vars */

/**
 * Ethereum - Networks
 * Specifies Default Values and URL's for connecting to various Ethereum Networks
 */

const ETH_NETWORKS = [
  {
    "ID": 1,
    "description": "Main Ethereum Network",
    "etherscanURL": "https://etherscan.io/",
    "etherscanAPIURL": "https://api.etherscan.io/",
    "statsURL": "https://ethstats.net/",
  },
  {
    "ID": 3,
    "description": "Ropsten Test Network",
    "etherscanURL": "https://ropsten.etherscan.io/",
    "etherscanAPIURL": "https://api-ropsten.etherscan.io/",
    "statsURL": "https://ropsten-stats.parity.io/",
  },
  {
    "ID": 4,
    "description": "Rinkeby Test Network",
    "etherscanURL": "https://rinkeby.etherscan.io/",
    "etherscanAPIURL": "https://api-rinkeby.etherscan.io/",
    "statsURL": "https://www.rinkeby.io/#stats",
  },
  {
    "ID": 42,
    "description": "Kovan Test Network",
    "etherscanURL": "https://kovan.etherscan.io/",
    "etherscanAPIURL": "https://api-kovan.etherscan.io/",
    "statsURL": "https://blockscout.com/eth/kovan",
  },
  {
    "ID": 5,
    "description": "Goerli Test Network",
    "etherscanURL": "https://goerli.etherscan.io/",
    "etherscanAPIURL": "https://api-goerli.etherscan.io/",
    "statsURL": "https://stats.goerli.net/",
  },
  {
    "ID": 0,  // Default if network not found
    "description": "Other Network",
    "etherscanURL": "https://etherscan.io/",
    "etherscanAPIURL": "https://api.etherscan.io/",
    "statsURL": "https://ethstats.net/",
  },
];
