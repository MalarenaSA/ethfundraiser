"use strict";
/* global Web3 DEFAULTS ETH_NETWORKS FUNDRAISER_ABI FUNDRAISER_BYTE_CODE $ */
/* eslint-disable no-unused-vars */

/**
 * Ether Fund Raiser
 * @fileoverview Deploys & interacts with FundRaiser Smart Contracts on Ethereum
 * @author Malarena SA - www.malarena.com
 */

// Set-up web3 & BN
const web3 = new Web3(Web3.givenProvider);
const BN = web3.utils.BN;

// Set-up initial variables
let network; // Object for Ethereum Network selected
let networkID;  // ID for Ethereum Network selected
let networkAvgBlockTime;  // Ethereum Network Average Block Time
let defaultAccount;  // Ethereum Account of user
let contractInstance;  // Object containing current contract code
let contractOwner;  // Ethereum Account of contract owner
let rateUSD;  // Current ETH:USD rate
let contractDlPassed;  // True/False of whether contract Deadline is passed or open
let contractIPDlPassed;  // True/False of whether contract Initial Payment Deadline is passed or not
let goalWei = new BN;  // Contract Goal in Wei
let goalPassed;  // True/False of whether contract Goal is passed or open
let minContWei = new BN;  // Contract Minimum Contribution Amount in Wei
let totContributors;  // Contract Total Contributors
let balWei = new BN; // Contract Balance in Wei
let totRequests;  // Total number of Spending Requests
let contractAmtPaidOutWei = new BN;  // Contract Amount Paid Out in Wei
let accountBalWei = new BN;  // Account Balance in Wei
let accountContWei = new BN; // Account Contribution Amount in Wei
let chosenRequestId;  // Chosen Spending Request Id
let requestCompleted; // True/False of whether Spending Request is completed or not
let requestUserVoted; // True/False of whether user has voted for Spending Request
let requestMajorityVoted; // True/False of whether majority of contributors have voted for Spending Request
let requestValWei = new BN; // Request Value in Wei
let message;  // Message text to display
let linkMessage;  // Message text with hyperlink to display

// Check Ethereum Browser API is loaded and available
if (typeof window.ethereum == "undefined") {
  networkID = 0;
  alert("This dApp will not work without an Ethereum Browser Wallet. Please install/activate MetaMask to use this dApp!");
  console.log("MetaMask not loaded/activated.");
  $(document).ready(function(){
    message = `Error - Browser Wallet Not Connected.`;
    showMessage("alert alert-danger", message, 2, 1);
    document.getElementById("top-network").innerHTML = `Error - Not Connected`;
  });

} else {
  // Connect to Wallet and initialise dApp
  window.ethereum.enable()
    .then(function (accounts) {
      getNetwork();
      getAccount(accounts);
      getETHPrices();
      loadContractABI();
      setDonationAddress();
      setRequestCountMax();
    })
    .catch(function (error) {
      genericError(error);
      document.getElementById("top-network").innerHTML = `Error - Not Connected`;
    });
  
  // TODO: Will need this section if/when MetaMask does not auto re-load on Network Change
  // Handle Browser API Network Change
  // window.ethereum.on("networkChanged", function(accounts) {
  //   location.reload(true);  // although at present this just cycles...
  // });

  // Handle Browser API Account Change
  window.ethereum.on("accountsChanged", function(accounts) {
    networkID = window.ethereum.networkVersion;
    network = ETH_NETWORKS.find(item => item.ID == networkID);
    if (network == undefined) network = ETH_NETWORKS.find(item => item.ID == 0);
    getAccount(accounts);
    if (contractInstance != undefined) {
      if (contractInstance.options.address != null) {
        readContract(contractInstance.options.address);  // Refresh Contract Information Screen
      }
      if (chosenRequestId != null) {
        getSpendRequest();  // Refresh Spending Request Screen
      }
    }
  });
}

/**
 * Function to get selected network details
 */
async function getNetwork() {
  networkID = window.ethereum.networkVersion;
  network = ETH_NETWORKS.find(item => item.ID == networkID);
  if (network == undefined) network = ETH_NETWORKS.find(item => item.ID == 0);
  document.getElementById("top-network").innerHTML = (`<a href="${network.statsURL}  "class="text-info" target="_blank" title="View Network Stats">${networkID}</a> - <a href="${network.etherscanURL}" class="text-info" target="etherscan" title="View on Etherscan">${network.description}</a>`);
  console.log(`Ethereum Network selected: ${networkID}-${network.description}`);
  getAvgBlockTime();  // Get current average block time for selected network
}

/**
 * Function to get selected account details
 * @param {string} accounts Ethereum Account Address
 */
function getAccount(accounts) {
  defaultAccount = web3.utils.toChecksumAddress(accounts[0]);
  web3.eth.getBalance(defaultAccount)
    .then(function (balance) {
      accountBalWei = web3.utils.toBN(balance);
    });
  document.getElementById("top-account").innerHTML = esAddressLink(defaultAccount);
  console.log(`Account selected: ${defaultAccount}`);
}

/**
 * Function to load contract ABI
 */
async function loadContractABI() {
  await web3.eth.getGasPrice()
    .then (function (curGasPrice) {
      contractInstance = new web3.eth.Contract(FUNDRAISER_ABI, {
        from: defaultAccount,
        gasPrice: curGasPrice  // default gas price in wei
      });
      console.log(`Contract ABI loaded. Current Gas Price:`, curGasPrice);
    })
    .catch(function (error) {
      genericError(error);
    });
}

/**
 * Function to update Home Page with address of Ethereum Donation Account
 */
function setDonationAddress() {
  document.getElementById("donationAddress").innerHTML = `<a href="https://etherscan.io/address/${DEFAULTS.donationAccount}" target="etherscan">${DEFAULTS.donationAccount}</a>`;
}

/**
 * Function to update Home Page & Spending Request Page with requestCountMax for Contract
 */
function setRequestCountMax() {
  document.getElementById("maxRequests").innerHTML = +DEFAULTS.requestCountMax;
  let IDToUpdate = document.getElementById("requestId");
  let newAttribute1 = document.createAttribute("max");
  newAttribute1.value = (+DEFAULTS.requestCountMax - 1);
  IDToUpdate.setAttributeNode(newAttribute1);
  let newAttribute2 = document.createAttribute("placeholder");
  newAttribute2.value = "Request ID, starting from 0 to maximum ID of " + (+DEFAULTS.requestCountMax - 1);
  IDToUpdate.setAttributeNode(newAttribute2);
  console.log(`Request Count Max set to: ${DEFAULTS.requestCountMax}`);
}

/**
 * Function to Deploy a New FundRaiser Smart Contract
 */
async function deployContract() {
  let deployDurationBlocks = document.getElementById("inputDuration").value;
  let deployDurationSeconds = (+deployDurationBlocks * +networkAvgBlockTime);
  let deployIPDurationBlocks = document.getElementById("inputIPDuration").value;
  let deployIPDurationSeconds = (+deployIPDurationBlocks * +networkAvgBlockTime);
  let deployGoal = document.getElementById("inputGoal").value;
  let deployMinContribution = document.getElementById("inputMinContribution").value;
  if (accountBalWei.isZero()) {
    message = `Error: Insufficient Funds to Deploy.`;
    showMessage("alert alert-danger", message, 2, 0);
  } else if (deployDurationBlocks == "" || +deployDurationBlocks <=0) {
    message = `Error: Invalid Duration.`;
    showMessage("alert alert-danger", message, 2, 0);
  } else if (+deployDurationSeconds > +DEFAULTS.maxDurationSeconds) {
    message = `Error: Duration over ${(+DEFAULTS.maxDurationSeconds / 604800)} weeks currently not allowed.`;
    showMessage("alert alert-danger", message, 2, 1);
  } else if (deployIPDurationBlocks == "" || +deployIPDurationBlocks < 0) {
    message = `Error: Invalid Initial Payment Duration.`;
    showMessage("alert alert-danger", message, 2, 0);
  } else if (+deployIPDurationSeconds > +DEFAULTS.maxIPDurationSeconds) {
    message = `Error: Initial Payment duration over ${(+DEFAULTS.maxIPDurationSeconds / 604800)} weeks currently not allowed.`;
    showMessage("alert alert-danger", message, 2, 1);
  } else if (deployGoal == "" || +deployGoal < 0) {
    message = `Error: Invalid Goal Amount.`;
    showMessage("alert alert-danger", message, 2, 0);
  } else if (deployMinContribution == "" || +deployMinContribution < 0) {
    message = `Error: Invalid Minimum Contribution Amount.`;
    showMessage("alert alert-danger", message, 2, 0);
  } else {
    if (networkID == 1 && deployDurationBlocks < 100) {
      message = `Warning: Short Duration! (Mainnet may take longer to process contributions)...but processing anyway.`;
      showMessage("alert alert-warning", message, 0, 0);
    }
    await contractInstance.deploy( {
      data: FUNDRAISER_BYTE_CODE,
      arguments: [deployDurationBlocks, deployIPDurationBlocks, deployGoal, deployMinContribution]
    }).send( {
      from: defaultAccount,
      gasPrice: contractInstance.options.gasPrice  // default gas price
    }).on("transactionHash", function(hash) {
      message = `Deploy Transaction ${hash} submitted to Network.`;
      linkMessage = `Deploy Transaction ${esTransactionLink(hash)} submitted to Network.`;
      showMessage("alert alert-warning", message, 1, 0, linkMessage);
    }).on("error", function(error) {
      genericError(error);
    }).then(function(newContractInstance) {
      message = `New FundRaiser Contract deployed successfully at: ${newContractInstance.options.address}.`;
      linkMessage = `New FundRaiser Contract deployed successfully at: ${esAddressLink(newContractInstance.options.address)}.`;
      showMessage("alert alert-success", message, 1, 1, linkMessage);
      contractInstance.options.address = newContractInstance.options.address;
      document.getElementById("top-contract").innerHTML = esAddressLink(newContractInstance.options.address);
      document.getElementById("contractAccount").value = newContractInstance.options.address;
      document.getElementById("inputDuration").value = "";
      document.getElementById("inputIPDuration").value = "";
      document.getElementById("inputGoal").value = "";
      document.getElementById("inputMinContribution").value = "";
      clearSpendRequest();  // Clear Spending Request Tab of any old data
      readContract(contractInstance.options.address);  // Refresh Contract Information Screen
      $("#existing-tab").tab("show");
    });
  }
}

/**
 * Function to connect to existing Smart Contract & check it is a valid address
 */
async function connectContract() {
  let contractAddress = document.getElementById("contractAccount").value.trim();
  document.getElementById("contractAccount").value = contractAddress;
  if (web3.utils.isAddress(contractAddress) == false) { 
    message = `Error: Smart Contract address "${contractAddress}" is not a valid Ethereum Address.`;
    showMessage("alert alert-danger", message, 2, 0);
    clearContract();  // Refresh Existing Contract Screen on Entry Error
    clearSpendRequest();  // Refresh Spending Request Screen on Entry Error
  } else if (web3.utils.toBN(contractAddress).isZero()) {
    message = `Error: Contract address cannot be Zero.`;
    showMessage("alert alert-danger", message, 2, 0);
    clearContract();  // Refresh Existing Contract Screen on Entry Error
    clearSpendRequest();  // Refresh Spending Request Screen on Entry Error
  } else {
    await getContract(contractAddress);
  }
}

/**
 * Function to check Smart Contract exists on current network
 * @param {string} contractAddress Ethereum Smart Contract Address
 */
async function getContract(contractAddress) {
  await web3.eth.getCode(contractAddress)
    .then (function (result) {
      if (result == "0x") {
        message = `Error: Looks like your Smart Contract "${contractAddress}" is not deployed on this Network.`;
        showMessage("alert alert-danger", message, 2, 0);
        clearContract();  // Refresh Existing Contract Screen on Entry Error
        clearSpendRequest();  // Refresh Spending Request Screen on Entry Error
      } else {
        contractInstance.options.address = contractAddress;
        document.getElementById("top-contract").innerHTML = esAddressLink(contractAddress);
        message = `Contract at ${contractAddress} is connected.`;
        linkMessage = `Contract at ${esAddressLink(contractAddress)} is connected.`;
        showMessage("alert alert-success", message, 1, 1, linkMessage);
        clearSpendRequest();  // Clear Spending Request Tab of any old data
        readContract(contractAddress);
      }
    })
    .catch(function (error) {
      genericError(error);
    });
}

/**
 * Function to Read Smart Contract details
 * @param {string} contractAddress Ethereum Smart Contract Address
 */
async function readContract(contractAddress) {
  // Update contractTimestamp with current Date/Time
  document.getElementById("contractTimestamp").innerHTML = "(Last updated: " + new Date().toLocaleString(DEFAULTS.timestampLocale, DEFAULTS.timestampOptions) + ")";

  // Get Current ETH:USD Exchange Rate
  await getETHPrices();

  // Get Contract Owner
  await contractInstance.methods.owner().call({gas: DEFAULTS.callGas}, function (error, result) {
    if (error) console.error(error);
    if (result) {
      contractOwner = result;
      if (contractOwner == defaultAccount) {
        document.getElementById("contractOwnedStatusBg").className = "table-success";
        document.getElementById("contractOwnedStatus").innerHTML = "Me";
      } else {
        document.getElementById("contractOwnedStatusBg").className = "table-danger";
        document.getElementById("contractOwnedStatus").innerHTML = "Not Me";
      }
      document.getElementById("contractOwner").innerHTML = esAddressLink(result);
      document.getElementById("inputReqRecipient").value = result;  // Recipient defaults to owner
      console.log("Contract Owner:", result);
    }
  });

  // Get Current Block Number
  let currentBlockNumber;
  await web3.eth.getBlockNumber((error, result) => {
    if (error) console.error(error);
    if (result) {
      currentBlockNumber = result;
      document.getElementById("top-curBlock").innerHTML = result;
      console.log("Current Block Number:", result);
    }
  });

  // Get Contract Deadline
  await contractInstance.methods.deadline().call({gas: DEFAULTS.callGas}, function (error, result) {
    if (error) console.error(error);
    if (result) {
      let remBlocks = (+currentBlockNumber > +result) ? 0 : (+result - +currentBlockNumber);
      if ((+remBlocks * +networkAvgBlockTime) > 86400) {  // > 1 Day left = "Open"
        contractDlPassed = false;
        document.getElementById("contractDeadlineStatusBg").className = "table-success";
        document.getElementById("contractDeadlineStatus").innerHTML = "Open";
      } else if (+remBlocks > 0) {  // < 1 Day left but > 0 = "Near"
        contractDlPassed = false;
        document.getElementById("contractDeadlineStatusBg").className = "table-warning";
        document.getElementById("contractDeadlineStatus").innerHTML = "Near";
      } else {  // <=0 days left = "Passed"
        contractDlPassed = true;
        document.getElementById("contractDeadlineStatusBg").className= "table-danger";
        document.getElementById("contractDeadlineStatus").innerHTML = "Passed";
      }
      document.getElementById("contractDeadlineBlock").innerHTML = result;
      let remBlockWord = (+remBlocks == 1) ? "block" : "blocks";
      document.getElementById("contractDeadlineLeft").innerHTML = `${remBlocks} ${remBlockWord} left`;
      document.getElementById("contractDeadlineDHM").innerHTML = blockDHM(remBlocks, networkAvgBlockTime);
      console.log("Contract Deadline:", result);
    }
  });

  // Get Contract Initial Payment Deadline
  await contractInstance.methods.initialPaymentDeadline().call({gas: DEFAULTS.callGas}, function (error, result) {
    if (error) console.error(error);
    if (result) {
      let remBlocks = (+currentBlockNumber > +result) ? 0 : (+result - +currentBlockNumber);
      if (+remBlocks > 0) {
        contractIPDlPassed = false;
        document.getElementById("contractIPDeadlineStatusBg").className = "table-success";
        document.getElementById("contractIPDeadlineStatus").innerHTML = "Not Reached";
      } else {
        contractIPDlPassed = true;
        document.getElementById("contractIPDeadlineStatusBg").className= "table-warning";
        document.getElementById("contractIPDeadlineStatus").innerHTML = "Passed";
      }
      document.getElementById("contractIPDeadlineBlock").innerHTML = result;
      let remBlockWord = (+remBlocks == 1) ? "block" : "blocks";
      document.getElementById("contractIPDeadlineLeft").innerHTML = `${remBlocks} ${remBlockWord} left`;
      document.getElementById("contractIPDeadlineDHM").innerHTML = blockDHM(remBlocks, networkAvgBlockTime);
      console.log("Contract Initial Payment Deadline:", result);
    }
  });

  // Get Contract Goal
  await contractInstance.methods.goal().call({gas: DEFAULTS.callGas}, function (error, result) {
    if (error) console.error(error);
    if (result) {
      goalWei = web3.utils.toBN(result);
      document.getElementById("contractGoalWei").innerHTML = goalWei.toString();
      let goalETH = web3.utils.fromWei(goalWei, "ether");
      document.getElementById("contractGoalETH").innerHTML = goalETH;
      let goalUSD = (+goalETH > 0) ? (+goalETH * +rateUSD) : 0.00;
      document.getElementById("contractGoalUSD").innerHTML = goalUSD.toFixed(2);
      console.log("Contract Goal:", result);
    }
  });

  // Get Contract Amount Raised & Calculate Amount Left To Raise
  await contractInstance.methods.amountRaised().call({gas: DEFAULTS.callGas}, function (error, result) {
    if (error) console.error(error);
    if (result) {
      let contractAmtRaisedWei = web3.utils.toBN(result);
      document.getElementById("contractAmtRaisedWei").innerHTML = contractAmtRaisedWei.toString();
      let contractAmtRaisedETH = web3.utils.fromWei(contractAmtRaisedWei, "ether");
      document.getElementById("contractAmtRaisedETH").innerHTML = contractAmtRaisedETH;
      let contractAmtRaisedUSD = (+contractAmtRaisedETH > 0) ? (+contractAmtRaisedETH * +rateUSD) : 0.00;
      document.getElementById("contractAmtRaisedUSD").innerHTML = contractAmtRaisedUSD.toFixed(2);

      let toRaiseWei = new BN();
      toRaiseWei = goalWei.gt(contractAmtRaisedWei) ?
        goalWei.sub(contractAmtRaisedWei) : web3.utils.toBN(0);
      if (toRaiseWei.gtn(0)) {
        goalPassed = false;
        document.getElementById("contractGoalStatusBg").className = "table-warning";
        document.getElementById("contractGoalStatus").innerHTML = "Outstanding";
      } else {
        goalPassed = true;
        document.getElementById("contractGoalStatusBg").className = "table-success";
        document.getElementById("contractGoalStatus").innerHTML = "Reached";
      }
      document.getElementById("contractAmtToRaiseWei").innerHTML = toRaiseWei.toString();
      let toRaiseETH = web3.utils.fromWei(toRaiseWei, "ether");
      document.getElementById("contractAmtToRaiseETH").innerHTML = toRaiseETH;
      let toRaiseUSD = (+toRaiseETH > 0) ? (+toRaiseETH * +rateUSD) : 0.00;
      document.getElementById("contractAmtToRaiseUSD").innerHTML = toRaiseUSD.toFixed(2);
      console.log("Contract Amount To Raise:", toRaiseWei.toString());
    }
  });

  // Get Contract Minimum Contribution
  await contractInstance.methods.minimumContribution().call({gas: DEFAULTS.callGas}, function (error, result) {
    if (error) console.error(error);
    if (result) {
      minContWei = web3.utils.toBN(result);
      document.getElementById("contractMinContWei").innerHTML = minContWei.toString();
      if (minContWei.lten(0)) {  // Pre-fill contributionAmt
        document.getElementById("contributionAmt").value = "1";
      } else {
        document.getElementById("contributionAmt").value = minContWei.toString();
      }
      let minContETH = web3.utils.fromWei(minContWei, "ether");
      document.getElementById("contractMinContETH").innerHTML = minContETH;
      let minContUSD = (+minContETH > 0) ? (+minContETH * +rateUSD) : 0.00;
      document.getElementById("contractMinContUSD").innerHTML = minContUSD.toFixed(2);
      console.log("Contract Minimum Contribution:", result);
    }
  });

  // Get Contract Total Contributors
  await contractInstance.methods.totalContributors().call({gas: DEFAULTS.callGas}, function (error, result) {
    if (error) console.error(error);
    if (result) {
      totContributors = result;
      document.getElementById("contractTotalContributors").innerHTML = result;
      console.log("Contract Total Contributors:", result);
    }
  });

  // Get Contract Balance
  await web3.eth.getBalance(contractAddress, (error, result) => {
    if (error) console.error(error);
    if (result) {
      if (parseInt(result) == 0) {
        document.getElementById("contractBalanceStatusBg").className = "table-danger";
        document.getElementById("contractBalanceStatus").innerHTML = "None";
      } else if (goalPassed == true){
        document.getElementById("contractBalanceStatusBg").className = "table-success";
        document.getElementById("contractBalanceStatus").innerHTML = "Spendable";
      } else if (goalPassed == false && contractDlPassed == true) {
        document.getElementById("contractBalanceStatusBg").className = "table-warning";
        document.getElementById("contractBalanceStatus").innerHTML = "Refundable";
      } else {
        document.getElementById("contractBalanceStatusBg").className = "table-warning";
        document.getElementById("contractBalanceStatus").innerHTML = "Locked";
      }
      balWei = web3.utils.toBN(result);
      document.getElementById("contractBalanceWei").innerHTML = result;
      document.getElementById("inputReqValue").value = result;  // Request Value defaults to Bal
      let contractBalETH = web3.utils.fromWei(result, "ether");
      document.getElementById("contractBalanceETH").innerHTML = contractBalETH;
      let contractBalUSD = (+contractBalETH > 0) ? (+contractBalETH * +rateUSD) : 0.00;
      document.getElementById("contractBalanceUSD").innerHTML = contractBalUSD.toFixed(2);
      console.log("Contract Balance:", result);
    }
  });

  // Get Total Spending Requests
  await contractInstance.methods.totalRequests().call({gas: DEFAULTS.callGas}, function (error, result) {
    if (error) console.error(error);
    if (result) {
      totRequests = result;
      let requestsLeft = (+DEFAULTS.requestCountMax > +totRequests) ? (+DEFAULTS.requestCountMax - +totRequests) : 0;
      if (+DEFAULTS.requestCountMax <= +totRequests) {
        document.getElementById("contractSpendReqBg").className = "table-danger";
        document.getElementById("contractSpendReqStatus").innerHTML = "Max Reached";
      } else if (requestsLeft <= 10) {
        document.getElementById("contractSpendReqBg").className = "table-warning";
        document.getElementById("contractSpendReqStatus").innerHTML = "Near";
      } else {
        document.getElementById("contractSpendReqBg").className = "table-success";
        document.getElementById("contractSpendReqStatus").innerHTML = "Available";
      }
      document.getElementById("contractSpendingRequests").innerHTML = result;
      let reqWord = (+requestsLeft == 1) ? "request" : "requests";
      document.getElementById("contractRequestCountLeft").innerHTML = `${requestsLeft} ${reqWord} left`;
      document.getElementById("contractRequestCountMax").innerHTML = `Maximum: ${DEFAULTS.requestCountMax}`;
      console.log("Total Spending Requests:", result, "/ Max:", DEFAULTS.requestCountMax);
    }
  });

  // Get Contract Amount Paid Out
  await contractInstance.methods.amountPaidOut().call({gas: DEFAULTS.callGas}, function (error, result) {
    if (error) console.error(error);
    if (result) {
      contractAmtPaidOutWei = web3.utils.toBN(result);
      document.getElementById("contractPaidOutWei").innerHTML = result;
      let contractAmtPaidOutETH = web3.utils.fromWei(result, "ether");
      document.getElementById("contractPaidOutETH").innerHTML = contractAmtPaidOutETH;
      let contractAmtPaidOutUSD = (+contractAmtPaidOutETH > 0) ? (+contractAmtPaidOutETH * +rateUSD) : 0.00;
      document.getElementById("contractPaidOutUSD").innerHTML = contractAmtPaidOutUSD.toFixed(2);
      console.log("Amount Paid Out:", result);
    }
  });

  // Get Default Account Balance
  await web3.eth.getBalance(defaultAccount, (error, result) => {
    if (error) console.error(error);
    if (result) {
      accountBalWei = web3.utils.toBN(result);
      if (accountBalWei.gtn(0)) {
        document.getElementById("accountBalanceStatusBg").className = "table-success";
        document.getElementById("accountBalanceStatus").innerHTML = "Available";
      } else {
        document.getElementById("accountBalanceStatusBg").className = "table-danger";
        document.getElementById("accountBalanceStatus").innerHTML = "Insufficient";
      }
      document.getElementById("accountBalanceWei").innerHTML = result;
      let accountBalETH = web3.utils.fromWei(result, "ether");
      document.getElementById("accountBalanceETH").innerHTML = accountBalETH;
      let accountBalUSD = (+accountBalETH > 0) ? (+accountBalETH * +rateUSD) : 0.00;
      document.getElementById("accountBalanceUSD").innerHTML = accountBalUSD.toFixed(2);
      console.log("Account Balance:", result);
    }
  });

  // Get Default Account Actual Contributions
  await contractInstance.methods.contributions(defaultAccount).call({gas: DEFAULTS.callGas}, function (error, result) {
    if (error) console.error(error);
    if (result) {
      accountContWei = web3.utils.toBN(result);
      document.getElementById("accountContributionsWei").innerHTML = result;
      document.getElementById("refundAmt").value = accountContWei.toString();  // Pre-fill potential refundAmt
      let accountContETH = web3.utils.fromWei(result, "ether");
      document.getElementById("accountContributionsETH").innerHTML = accountContETH;
      let accountContUSD = (+accountContETH > 0) ? (+accountContETH * +rateUSD) : 0.00;
      document.getElementById("accountContributionsUSD").innerHTML = accountContUSD.toFixed(2);
      console.log("Account Contributions:", result);
    }
  });
}

/**
 * Function to clear Existing Contract tab & relevant variables
 */
function clearContract() {
  contractInstance.options.address = null;
  document.getElementById("contractAccount").value = "";
  document.getElementById("top-contract").innerHTML = "";
  document.getElementById("contractTimestamp").innerHTML = "";
  contractOwner = null;
  document.getElementById("contractOwnedStatusBg").className = "";
  document.getElementById("contractOwnedStatus").innerHTML = "";
  document.getElementById("contractOwner").innerHTML = "";
  document.getElementById("inputReqRecipient").value = "";
  contractDlPassed = null;
  document.getElementById("contractDeadlineStatusBg").className= "";
  document.getElementById("contractDeadlineStatus").innerHTML = "";
  document.getElementById("contractDeadlineBlock").innerHTML = "";
  document.getElementById("contractDeadlineLeft").innerHTML = "";
  document.getElementById("contractDeadlineDHM").innerHTML = "";
  contractIPDlPassed = null;
  document.getElementById("contractIPDeadlineStatusBg").className= "";
  document.getElementById("contractIPDeadlineStatus").innerHTML = "";
  document.getElementById("contractIPDeadlineBlock").innerHTML = "";
  document.getElementById("contractIPDeadlineLeft").innerHTML = "";
  document.getElementById("contractIPDeadlineDHM").innerHTML = "";
  goalWei = null;
  document.getElementById("contractGoalStatusBg").className = "";
  document.getElementById("contractGoalStatus").innerHTML = "";
  document.getElementById("contractGoalWei").innerHTML = "";
  document.getElementById("contractGoalETH").innerHTML = "";
  document.getElementById("contractGoalUSD").innerHTML = "";
  goalPassed = false;
  document.getElementById("contractAmtRaisedWei").innerHTML = "";
  document.getElementById("contractAmtRaisedETH").innerHTML = "";
  document.getElementById("contractAmtRaisedUSD").innerHTML = "";
  document.getElementById("contractAmtToRaiseWei").innerHTML = "";
  document.getElementById("contractAmtToRaiseETH").innerHTML = "";
  document.getElementById("contractAmtToRaiseUSD").innerHTML = "";
  minContWei = null;
  document.getElementById("contractMinContWei").innerHTML = "";
  document.getElementById("contributionAmt").value = "";
  document.getElementById("contractMinContETH").innerHTML = "";
  document.getElementById("contractMinContUSD").innerHTML = "";
  totContributors = null;
  document.getElementById("contractTotalContributors").innerHTML = "";
  balWei = null;
  document.getElementById("contractBalanceStatusBg").className = "";
  document.getElementById("contractBalanceStatus").innerHTML = "";
  document.getElementById("contractBalanceWei").innerHTML = "";
  document.getElementById("inputReqValue").value = "";
  document.getElementById("contractBalanceETH").innerHTML = "";
  document.getElementById("contractBalanceUSD").innerHTML = "";
  totRequests = null;
  document.getElementById("contractSpendReqBg").className = "";
  document.getElementById("contractSpendReqStatus").innerHTML = "";
  document.getElementById("contractSpendingRequests").innerHTML = "";
  document.getElementById("contractRequestCountLeft").innerHTML = "";
  document.getElementById("contractRequestCountMax").innerHTML = "";
  contractAmtPaidOutWei = null;
  document.getElementById("contractPaidOutWei").innerHTML = "";
  document.getElementById("contractPaidOutETH").innerHTML = "";
  document.getElementById("contractPaidOutUSD").innerHTML = "";
  document.getElementById("accountBalanceStatusBg").className = "";
  document.getElementById("accountBalanceStatus").innerHTML = "";
  document.getElementById("accountBalanceWei").innerHTML = "";
  document.getElementById("accountBalanceETH").innerHTML = "";
  document.getElementById("accountBalanceUSD").innerHTML = "";
  accountContWei = null;
  document.getElementById("accountContributionsWei").innerHTML = "";
  document.getElementById("refundAmt").value = "";
  document.getElementById("accountContributionsETH").innerHTML = "";
  document.getElementById("accountContributionsUSD").innerHTML = "";
  console.log("Existing Contract Tab Cleared.");
}

/**
 * Function to Create Contract Email Link
 */
function emailContractLink() {
  if (contractInstance.options.address == null) {
    message = `Error: No Contract Selected.`;
    showMessage("alert alert-danger", message, 2, 0);
  } else {
    let emailSubject = `My Ether Fund Raiser Campaign`;
    let emailBody1 = `Please contribute to my Ether Fund Raiser Campaign.`;
    let emailBody2 = `Go to: ${DEFAULTS.webHostingURL}, connect your browser's Ethereum Wallet to the "${network.description}", select [Existing Contract] and then enter "${contractInstance.options.address}" and click on [Get Details] to see the contract and options to contribute.`;
    let email = "mailto:?subject=" + emailSubject + "&body=" + emailBody1 + "%0D%0A%0D%0A" + emailBody2;
    window.open(email, "emailWindow");
  }
}

/**
 * Function to Check Contribution from individual account
 */
async function checkContribution() {
  let checkAddress = document.getElementById("contributorAccount").value.trim();
  if (contractInstance.options.address == null) {
    message = `Error: No Contract Selected.`;
    showMessage("alert alert-danger", message, 2, 0);
  } else if (web3.utils.isAddress(checkAddress) == false) {
    message = `Error: Contributor Account "${checkAddress}" is invalid.`;
    showMessage("alert alert-danger", message, 2, 0);
    document.getElementById("contributorAccount").value = "";
  } else if (web3.utils.toBN(checkAddress).isZero()) {
    message = `Error: Contributor Account cannot be Zero.`;
    showMessage("alert alert-danger", message, 2, 0);
  } else {
    await contractInstance.methods.contributions(checkAddress).call({gas: DEFAULTS.callGas}, function (error, result) {
      if (error) {
        genericError(error);
      } 
      if (result) {
        message = `Contribution from ${checkAddress} of ${result} wei.`;
        linkMessage = `Contribution from ${esAddressLink(checkAddress)} of ${result} wei.`;
        showMessage("alert alert-success", message, 1, 0, linkMessage);
        document.getElementById("contributorAccount").value = "";  // Reset contributorAccount
      }
    });
  }
}

/**
 * Function to Change Contract Owner. Can only be actioned by current owner
 */
async function changeOwner() {
  let newAddress = document.getElementById("newOwnerAccount").value.trim();
  if (contractInstance.options.address == null) {
    message = `Error: No Contract Selected.`;
    showMessage("alert alert-danger", message, 2, 0);
  } else if (web3.utils.isAddress(newAddress) == false) {
    message = `Error: New Owner Account "${newAddress}" is invalid.`;
    showMessage("alert alert-danger", message, 2, 0);
    document.getElementById("newOwnerAccount").value = "";
  } else if (web3.utils.toBN(newAddress).isZero()) {
    message = `Error: New Owner Account cannot be Zero.`;
    showMessage("alert alert-danger", message, 2, 0);
  } else if (contractOwner != defaultAccount) {
    message = `Error: This action can only be processed by the Contract Owner.`;
    showMessage("alert alert-danger", message, 2, 0);
  } else if (contractOwner == newAddress){
    message = `Error: Account "${newAddress}" is ALREADY the Contract Owner.`;
    showMessage("alert alert-danger", message, 2, 0);
    document.getElementById("newOwnerAccount").value = "";
  } else {
    message = `Warning: This changes which account can process certain Owner Actions...but processing anyway.`;
    showMessage("alert alert-warning", message, 0, 0);
    await contractInstance.methods.changeOwner(newAddress).send( {
      from: defaultAccount
    }).once("transactionHash", function(hash) {
      message = `Owner Change Transaction ${hash} submitted to Network.`;
      linkMessage = `Owner Change Transaction ${esTransactionLink(hash)} submitted to Network.`;
      showMessage("alert alert-warning", message, 1, 0, linkMessage);
    }).on("error", function(error) {
      genericError(error);
    }).then(function(receipt) {
      let eventAddressFrom = receipt.events.OwnerChanged.returnValues.from;
      let eventAddressTo = receipt.events.OwnerChanged.returnValues.to;
      message = `Owner Change from ${eventAddressFrom} to ${eventAddressTo} processed successfully.`;
      linkMessage = `Owner Change from ${esAddressLink(eventAddressFrom)} to ${esAddressLink(eventAddressTo)} processed successfully.`;
      showMessage("alert alert-success", message, 1, 1, linkMessage);
      readContract(contractInstance.options.address);  // Refresh Contract Information Screen
      document.getElementById("newOwnerAccount").value = "";  // Reset newOwnerAccount
    });
  }
}

/**
 * Function to Send a Contribution
 */
async function sendContribution() {
  let sendAmountWei = web3.utils.toBN(document.getElementById("contributionAmt").value);
  if (contractInstance.options.address == null) {
    message = `Error: No Contract Selected.`;
    showMessage("alert alert-danger", message, 2, 0);
  } else if (accountBalWei.lt(minContWei)) {
    message = `Error: Your Account Balance is less than the Minimum Contribution Amount.`;
    showMessage("alert alert-danger", message, 2, 0);
  } else if (sendAmountWei.lt(minContWei)) {
    message = `Error: Minimum Contribution Amount not met.`;
    showMessage("alert alert-danger", message, 2, 0);
  } else if (sendAmountWei.ltn(1)) {
    message = `Error: Contribution Amount cannot be less than 1 wei.`;
    showMessage("alert alert-danger", message, 2, 0);
  } else if (contractDlPassed == true) {
    message = `Error: Contract Deadline has passed. No further contributions accepted.`;
    showMessage("alert alert-danger", message, 2, 1);
  } else {
    await contractInstance.methods.contribute().send( {
      from: defaultAccount,
      value: sendAmountWei
    })
      .once("transactionHash", function(hash) {
        message = `Contribute Transaction ${hash} submitted to Network.`;
        linkMessage = `Contribute Transaction ${esTransactionLink(hash)} submitted to Network.`;
        showMessage("alert alert-warning", message, 1, 0, linkMessage);
      })
      .on("error", function(error) {
        genericError(error);
      })
      .then(function(receipt) {
        let eventAddress = receipt.events.Contribution.returnValues.from; 
        let eventValue = receipt.events.Contribution.returnValues.value;
        message = `Contribution from ${eventAddress} of ${eventValue} wei processed successfully.`;
        linkMessage = `Contribution from ${esAddressLink(eventAddress)} of ${eventValue} wei processed successfully.`;
        showMessage("alert alert-success", message, 1, 1, linkMessage);
        readContract(contractInstance.options.address);  // Refresh Contract Information Screen
        if (chosenRequestId != null) {
          getSpendRequest();  // Refresh Spending Request Screen
        }
      });
  }
}

/**
 * Function to Process a Refund
 */
async function processRefund() {
  if (contractInstance.options.address == null) {
    message = `Error: No Contract Selected.`;
    showMessage("alert alert-danger", message, 2, 0);
  } else if (accountContWei.isZero()) {
    message = `Error: No Contribution received. Refund cannot be processed.`;
    showMessage("alert alert-danger", message, 2, 0);
  } else if  (contractDlPassed == false) {
    message = `Error: Contract Deadline not yet passed. Refund cannot be processed.`;
    showMessage("alert alert-danger", message, 2, 1);
  } else if (goalPassed == true && contractAmtPaidOutWei.gtn(0)) {
    message = `Error: Payments have already been made. Refund cannot be processed.`;
    showMessage("alert alert-danger", message, 2, 1);
  } else if (goalPassed == true && contractIPDlPassed == false) {
    message = `Error: Initial Payment Deadline not yet reached. Refund cannot be processed.`;
    showMessage("alert alert-danger", message, 2, 1);
  } else {
    await contractInstance.methods.getRefund().send( {
      from: defaultAccount
    }).once("transactionHash", function(hash) {
      message = `Refund Transaction ${hash} submitted to Network.`;
      linkMessage = `Refund Transaction ${esTransactionLink(hash)} submitted to Network.`;
      showMessage("alert alert-warning", message, 1, 0, linkMessage);
    }).on("error", function(error) {
      genericError(error);
    }).then(function(receipt) {
      let eventAddress = receipt.events.Refund.returnValues.to; 
      let eventValue = receipt.events.Refund.returnValues.value;
      message = `Refund to ${eventAddress} of ${eventValue} wei processed successfully.`;
      linkMessage = `Refund to ${esAddressLink(eventAddress)} of ${eventValue} wei processed successfully.`;
      showMessage("alert alert-success", message, 1, 1, linkMessage);
      readContract(contractInstance.options.address);  // Refresh Contract Information Screen
      if (chosenRequestId != null) {
        getSpendRequest();  // Refresh Spending Request Screen
      }
    });
  }
}

/**
 * Function to connect and load Spending Request
 */
async function getSpendRequest() {
  chosenRequestId = document.getElementById("requestId").value;
  if (contractInstance.options.address == null) {
    message = `Error: No Contract Selected.`;
    showMessage("alert alert-danger", message, 2, 0);
    clearSpendRequest();  // Refresh Spending Request Screen on Entry Error
  } else if (chosenRequestId == "") {
    message = `Error: No Spending Request selected.`;
    showMessage("alert alert-danger", message, 2, 0);
    clearSpendRequest();  // Refresh Spending Request Screen on Entry Error
  } else if (+chosenRequestId >= +totRequests) {
    message = `Error: Spending Request ID "${chosenRequestId}" does not exist.`;
    showMessage("alert alert-danger", message, 2, 0);
    clearSpendRequest();  // Refresh Spending Request Screen on Entry Error
  } else {
    // Get Spending Request details
    await contractInstance.methods.requests(chosenRequestId).call({gas: DEFAULTS.callGas}, function (error, result) {
      if (error) {
        genericError(error);
      }
      if (result) {
        // message = `Spending Request ${chosenRequestId} is connected.`; // Not needed..?
        // showMessage("alert alert-success", message, 1, 0);  // Not needed..?
        console.log("Spending Request:", result);
        document.getElementById("requestTimestamp").innerHTML = "(Last updated: " + new Date().toLocaleString(DEFAULTS.timestampLocale, DEFAULTS.timestampOptions) + ")";
        document.getElementById("requestDescription").innerHTML = result.description;
        requestValWei = web3.utils.toBN(result.value);
        document.getElementById("requestValueWei").innerHTML = result.value;
        let requestValETH = web3.utils.fromWei(result.value, "ether");
        document.getElementById("requestValueETH").innerHTML = requestValETH;
        let requestValUSD = (+requestValETH > 0) ? (+requestValETH * +rateUSD) : 0.00;
        document.getElementById("requestValueUSD").innerHTML = requestValUSD.toFixed(2);
        document.getElementById("requestRecipient").innerHTML = esAddressLink(result.recipient);
        document.getElementById("requestNoOfVoters").innerHTML = `${result.numberOfVoters} of ${totContributors}`;

        requestMajorityVoted = (parseInt(result.numberOfVoters) > (parseInt(totContributors) / 2)) ? true : false;
        if (requestMajorityVoted == true) {
          document.getElementById("requestVoterStatusBg").className = "table-success";
          document.getElementById("requestVoterStatus").innerHTML = "Approved";
        } else {
          document.getElementById("requestVoterStatusBg").className = "table-danger";
          document.getElementById("requestVoterStatus").innerHTML = "Unapproved";
        }

        requestCompleted = result.completed;
        if (requestCompleted == true) {
          document.getElementById("requestStatusBg").className = "table-success";
          document.getElementById("requestStatus").innerHTML = "Paid";
        } else if (requestMajorityVoted == true) {
          document.getElementById("requestStatusBg").className = "table-warning";
          document.getElementById("requestStatus").innerHTML = "Payable";
        } else {
          document.getElementById("requestStatusBg").className = "table-danger";
          document.getElementById("requestStatus").innerHTML = "Outstanding";
        }
      }
    });

    // Get Default Account Vote
    await contractInstance.methods.hasVoted(chosenRequestId, defaultAccount).call({gas: DEFAULTS.callGas}, function (error, result) {
      if (error) {
        genericError(error);
      }
      requestUserVoted = (result);
      if (requestUserVoted == true) {
        document.getElementById("requestAccountVote").innerHTML = "Yes";
      } else {
        document.getElementById("requestAccountVote").innerHTML = "No";
      }
      console.log("Account Vote:", result);
    });
  }
}

/**
 * Function to clear Spending Request tab & relevant variables
 */
function clearSpendRequest() {
  chosenRequestId = null;
  document.getElementById("requestTimestamp").innerHTML = "";
  document.getElementById("requestId").value = "";
  document.getElementById("requestDescription").innerHTML = "";
  requestValWei = null;
  document.getElementById("requestValueWei").innerHTML = "";
  document.getElementById("requestValueETH").innerHTML = "";
  document.getElementById("requestValueUSD").innerHTML = "";
  document.getElementById("requestRecipient").innerHTML = "";
  document.getElementById("requestNoOfVoters").innerHTML = "";
  requestMajorityVoted = null;
  document.getElementById("requestVoterStatusBg").className = "";
  document.getElementById("requestVoterStatus").innerHTML = "";
  requestCompleted = null;
  document.getElementById("requestStatusBg").className = "";
  document.getElementById("requestStatus").innerHTML = "";
  requestUserVoted = null;
  document.getElementById("requestAccountVote").innerHTML = "";
  console.log("Spending Request Tab Cleared.");
}

/**
 * Function to Create Spending Request Email Link
 */
function emailSpendReqLink() {
  if (contractInstance.options.address == null) {
    message = `Error: No Contract Selected.`;
    showMessage("alert alert-danger", message, 2, 0);
  } else if (chosenRequestId == null || chosenRequestId == "") {
    message = `Error: No Spending Request Selected.`;
    showMessage("alert alert-danger", message, 2, 0);
  } else {
    let emailSubject = `My Ether Fund Raiser Campaign - Please Vote`;
    let emailBody1 = `If you have contributed to my Ether Fund Raising Campaign, please now vote for my spending request in order to release the funds.`;
    let emailBody2 = `Go to: ${DEFAULTS.webHostingURL}, connect to the "${network.description}", select [Existing Contract] and then enter "${contractInstance.options.address}" and click on [Get Details] to see the contract. Then click on [Spending Requests] and enter Spending Request ID "${chosenRequestId}" and click on [Get Details] to see the spending request details and then click on [Vote for Request] to approve the release of these funds.`;
    let email = "mailto:?subject=" + emailSubject + "&body=" + emailBody1 + "%0D%0A%0D%0A" + emailBody2;
    window.open(email, "emailWindow");
  }
}

/**
 * Function to Create a Spending Request. Can only be actioned by current owner
 */
async function createSpendRequest() {
  let createReqDescription = document.getElementById("inputReqDesc").value;
  let createReqValueWei = web3.utils.toBN(document.getElementById("inputReqValue").value);
  let createReqRecipient = document.getElementById("inputReqRecipient").value.trim();
  if (contractInstance.options.address == null) {
    message = `Error: No Contract Selected.`;
    showMessage("alert alert-danger", message, 2, 0);
  } else if (+totRequests == +DEFAULTS.requestCountMax) {
    message = `Error: Maximum Number of Spending Requests (${DEFAULTS.requestCountMax}) reached.`;
    showMessage("alert alert-danger", message, 2, 1);
  } else if (goalPassed == false) {
    message = `Error: Goal not yet reached.`;
    showMessage("alert alert-danger", message, 2, 1);
  } else if (createReqDescription == "") {
    message = `Error: Description required.`;
    showMessage("alert alert-danger", message, 2, 0);
  } else if (createReqValueWei == "" || createReqValueWei.lten(0)) {
    message = `Error: Request value must be greater than zero.`;
    showMessage("alert alert-danger", message, 2, 0);
  } else if (createReqValueWei.gt(balWei)) {
    message = `Error: Request Value of ${createReqValueWei} is greater than Contract Balance of ${balWei} wei.`;
    showMessage("alert alert-danger", message, 2, 1);
  } else if (web3.utils.isAddress(createReqRecipient) == false) {
    message = `Error: Recipient Account is invalid.`;
    showMessage("alert alert-danger", message, 2, 0);
  } else if (web3.utils.toBN(createReqRecipient).isZero()) {
    message = `Error: Recipient Account cannot be Zero.`;
    showMessage("alert alert-danger", message, 2, 0);
  } else if (contractOwner != defaultAccount) {
    message = `Error: This action can only be processed by the Contract Owner.`;
    showMessage("alert alert-danger", message, 2, 0);
  } else {
    if (createReqRecipient != contractOwner) {
      message = `Warning: Recipient Account is NOT the Contract Owner...but processing anyway.`;
      showMessage("alert alert-warning", message, 0, 0);
    }
    await contractInstance.methods.createRequest(createReqDescription, createReqValueWei.toString(), createReqRecipient).send( {
      from: defaultAccount
    }).once("transactionHash", function(hash) {
      message = `Spending Request Transaction ${hash} submitted to Network.`;
      linkMessage = `Spending Request Transaction ${esTransactionLink(hash)} submitted to Network.`;
      showMessage("alert alert-warning", message, 1, 0, linkMessage);
    }).on("error", function(error) {
      genericError(error);
    }).then(function(receipt) {
      let eventRequestId = receipt.events.RequestCreated.returnValues.requestId;  
      let eventAddress = receipt.events.RequestCreated.returnValues.from;
      let eventValue = receipt.events.RequestCreated.returnValues.value;
      message = `Spending Request ID ${eventRequestId} from ${eventAddress} of ${eventValue} wei processed successfully (${+DEFAULTS.requestCountMax - +eventRequestId - 1} requests left).`;
      linkMessage = `Spending Request ID ${eventRequestId} from ${esAddressLink(eventAddress)} of ${eventValue} wei processed successfully (${+DEFAULTS.requestCountMax - +eventRequestId - 1} requests left).`;      
      showMessage("alert alert-success", message, 1, 1, linkMessage);
      totRequests+=1;
      document.getElementById("requestId").value = eventRequestId;
      document.getElementById("inputReqDesc").value = "";
      document.getElementById("inputReqValue").value = "";
      document.getElementById("inputReqRecipient").value = contractOwner;
      readContract(contractInstance.options.address);  // Refresh Contract Information Screen
      getSpendRequest();  // Refresh Spending Request Screen
    });
  }
}

/**
 * Function to Release Payment for a Spending Request. Can only be actioned by current owner
 */
async function paySpendRequest() {
  if (chosenRequestId == null || chosenRequestId == "") {
    message = `Error: No Spending Request Selected.`;
    showMessage("alert alert-danger", message, 2, 0);
  } else if (+chosenRequestId >= +totRequests) {
    message = `Error: Spending Request does not exist.`;
    showMessage("alert alert-danger", message, 2, 0);
  } else if (requestCompleted == true) {
    message = `Error: Request is already completed.`;
    showMessage("alert alert-danger", message, 2, 0);
  } else if (requestMajorityVoted == false) {
    message = `Error: Less than majority have voted so request cannot be paid.`;
    showMessage("alert alert-danger", message, 2, 1);
  } else if (requestValWei.gt(balWei)) {
    message = `Error: Request value is greater than contract balance remaining.`;
    showMessage("alert alert-danger", message, 2, 1);
  } else if (contractOwner != defaultAccount) {
    message = `Error: This action can only be processed by the Contract Owner.`;
    showMessage("alert alert-danger", message, 2, 0);
  } else {
    await contractInstance.methods.releasePayment(chosenRequestId).send( {
      from: defaultAccount
    }).once("transactionHash", function(hash) {
      message = `Payment Release Transaction ${hash} submitted to Network.`;
      linkMessage = `Payment Release Transaction ${esTransactionLink(hash)} submitted to Network.`;
      showMessage("alert alert-warning", message, 1, 0, linkMessage);
    }).on("error", function(error) {
      genericError(error);
    }).then(function(receipt) {
      let eventRequestId = receipt.events.PaymentReleased.returnValues.requestId;
      let eventValue = receipt.events.PaymentReleased.returnValues.value;
      let eventRecipient = receipt.events.PaymentReleased.returnValues.recipient;
      message = `Payment Release from request ID ${eventRequestId} of ${eventValue} wei to ${eventRecipient} processed successfully.`;
      linkMessage = `Payment Release from request ID ${eventRequestId} of ${eventValue} wei to ${esAddressLink(eventRecipient)} processed successfully.`;
      showMessage("alert alert-success", message, 1, 1, linkMessage);
      readContract(contractInstance.options.address);  // Refresh Contract Information Screen
      getSpendRequest();  // Refresh Spending Request Screen
    });
  }
}

/**
 * Function to Check Contributor has Voted
 */
async function checkVoted() {
  let voteAddress = document.getElementById("voterAccount").value.trim();
  if (chosenRequestId == null || chosenRequestId == "") {
    message = `Error: No Spending Request Selected.`;
    showMessage("alert alert-danger", message, 2, 0);
  } else if (+chosenRequestId >= +totRequests) {
    message = `Error: Spending Request does not exist.`;
    showMessage("alert alert-danger", message, 2, 0);
  } else if (web3.utils.isAddress(voteAddress) == false) {
    message = `Error: Contributor Account "${voteAddress}" is invalid.`;
    showMessage("alert alert-danger", message, 2, 0);
    document.getElementById("voterAccount").value = "";
  } else if (web3.utils.toBN(voteAddress).isZero()) {
    message = `Error: Contributor Account cannot be Zero.`;
    showMessage("alert alert-danger", message, 2, 0);
  } else {
    await contractInstance.methods.hasVoted(chosenRequestId, voteAddress).call({gas: DEFAULTS.callGas}, function (error, result) {
      if (error) {
        genericError(error);
      }
      let checkUserVoted = (result);
      if (checkUserVoted == true) {
        message = `Account ${voteAddress} HAS voted for request ID ${chosenRequestId}.`;
        linkMessage = `Account ${esAddressLink(voteAddress)} HAS voted for request ID ${chosenRequestId}.`;
        showMessage("alert alert-success", message, 1, 0, linkMessage);
        document.getElementById("voterAccount").value = "";  // Reset voterAccount
      } else {
        message = `Account ${voteAddress} has NOT voted for request ID ${chosenRequestId}.`;
        linkMessage = `Account ${esAddressLink(voteAddress)} has NOT voted for request ID ${chosenRequestId}.`;
        showMessage("alert alert-success", message, 1, 0, linkMessage);
        document.getElementById("voterAccount").value = "";  // Reset voterAccount
      }
    });
  }
}

/**
 * Function to Vote for a Spending Request
 */
async function voteSpendRequest() {
  if (chosenRequestId == null || chosenRequestId == "") {
    message = `Error: No Spending Request selected.`;
    showMessage("alert alert-danger", message, 2, 0);
  } else if (+chosenRequestId >= +totRequests) {
    message = `Error: Spending Request does not exist.`;
    showMessage("alert alert-danger", message, 2, 0);
  } else if (accountContWei.isZero()) {
    message = `Error: Your contribution is 0 wei so you cannot vote.`;
    showMessage("alert alert-danger", message, 2, 1);
  } else if (requestUserVoted == true) {
    message = `Error: You have already voted for this request.`;
    showMessage("alert alert-danger", message, 2, 0);
  } else if (requestCompleted == true) {
    message = `Error: Request is already completed.`;
    showMessage("alert alert-danger", message, 2, 0);
  } else {
    await contractInstance.methods.voteForRequest(chosenRequestId).send( {
      from: defaultAccount
    }).once("transactionHash", function(hash) {
      message = `Vote Transaction ${hash} submitted to Network.`;
      linkMessage = `Vote Transaction ${esTransactionLink(hash)} submitted to Network.`;
      showMessage("alert alert-warning", message, 1, 0, linkMessage);
    }).on("error", function(error) {
      genericError(error);
    }).then(function(receipt) {
      let eventAddress = receipt.events.Vote.returnValues.from;
      let eventRequestId = receipt.events.Vote.returnValues.requestId;
      message = `Vote from ${eventAddress} for request ID ${eventRequestId} processed successfully.`;
      linkMessage = `Vote from ${esAddressLink(eventAddress)} for request ID ${eventRequestId} processed successfully.`;
      showMessage("alert alert-success", message, 1, 1, linkMessage);
      readContract(contractInstance.options.address);  // Refresh Contract Information Screen
      getSpendRequest();  // Refresh Spending Request Screen
    });
  }
}

/**
 * Function to Initialise Block Converter Modal
 */
function blockConvertInit() {
  document.getElementById("blockTime").value = networkAvgBlockTime;
  document.getElementById("blocksNumber").value = "1";
  document.getElementById("blocksDHM").value = "0D : 0H : 0M";
  let blocksExampleD = Math.ceil(86400 / +networkAvgBlockTime);
  let blocksExampleH = Math.ceil(3600 / +networkAvgBlockTime);
  let blocksExampleM = Math.ceil(60 / +networkAvgBlockTime);
  document.getElementById("blocksExampleDHM").value = `1D=${blocksExampleD} Blocks : 1H=${blocksExampleH} Blocks : 1M=${blocksExampleM} Blocks`;
}

/**
 * Function to Perform Convertion between Blocks and DHM
 */
function blockConvertNow() {
  let blockTimeSeconds = document.getElementById("blockTime").value;
  let blocksToFix = document.getElementById("blocksNumber").value + ".";
  let blocksToConvert = blocksToFix.substr(0, blocksToFix.indexOf(".")); 
  document.getElementById("blocksNumber").value = blocksToConvert;
  document.getElementById("blocksDHM").value = blockDHM(blocksToConvert, blockTimeSeconds);
  let blocksExampleD = Math.ceil(86400 / +blockTimeSeconds);
  let blocksExampleH = Math.ceil(3600 / +blockTimeSeconds);
  let blocksExampleM = Math.ceil(60 / +blockTimeSeconds);
  document.getElementById("blocksExampleDHM").value = `1D=${blocksExampleD} Blocks : 1H=${blocksExampleH} Blocks : 1M=${blocksExampleM} Blocks`;
}

/**
 * Function to reset networkAvgBlockTime in use
 * @param {number} type Type of reset required. 0=To Entered; 1=To Etherscan
 */
function blockConvertReset(type) {
  if (type == 0) {  // Reset to Manually Entered time
    let blockTimeSeconds = document.getElementById("blockTime").value;
    networkAvgBlockTime = blockTimeSeconds;
    blockConvertInit();
  }
  if (type == 1) {  // Reset to Etherscan time
    getAvgBlockTime()
      .then(function() {
        return blockConvertInit();
      });
  }
  console.log(`Network Average Block time: ${networkAvgBlockTime} seconds.`);
  setBlockTimeAttributes();  // Reset Block Time Attributes
  if (contractInstance.options.address != null) {
    readContract(contractInstance.options.address);  // Refresh Contract Information Screen
  }
}

/**
 * Function to Initialise Wei Converter Modal
 */
function weiConvertInit() {
  document.getElementById("convertWei").value = "1000000000000000000";
  document.getElementById("convertEth").value = "1";
  document.getElementById("convertUSD").value = Number(rateUSD).toFixed(2);
  document.getElementById("convertRate").value = Number(rateUSD).toFixed(2);
}

/**
 * Function to Perform Convertion between Wei<>Eth<>USD
 * @param {object} element HTML InputEvent Object
 */
function weiConvertNow(element) {
  if (element.id == "convertWei") {
    removeDecimals(element);
    let toConvert = document.getElementById(element.id).value;
    let ethValue = web3.utils.fromWei(toConvert, "ether");
    document.getElementById("convertEth").value = ethValue;
    document.getElementById("convertUSD").value = (+ethValue * +rateUSD);
  } else if (element.id == "convertEth") {
    checkDecimals(element);
    let toConvert = document.getElementById(element.id).value;
    if (toConvert == "") toConvert = "0";
    document.getElementById("convertWei").value = web3.utils.toWei(toConvert, "ether");
    document.getElementById("convertUSD").value = (+toConvert * +rateUSD);
  } else if (element.id == "convertUSD") {
    let toConvert = document.getElementById(element.id).value;
    if (+toConvert > 1000000000000000000000) {  // Max it can handle before errors
      toConvert = 1000000000000000000000;
      document.getElementById("convertUSD").value = toConvert;
    }
    let ethValue = (+toConvert / +rateUSD).toString();
    if (ethValue.includes(".")) {  // Ensure max of 18 decimals for web3 utils
      ethValue = (ethValue.substr(0, (ethValue.indexOf(".")))) + (ethValue.substr((ethValue.indexOf(".")), 19));
    }
    document.getElementById("convertEth").value = ethValue;
    document.getElementById("convertWei").value = web3.utils.toWei(ethValue, "ether");
  }
}

/**
 * Function to create an Etherscan Address HyperLink
 * @param {string} addressLink Ethereum Account Address
 */
function esAddressLink(addressLink) {
  return (`<a href="${network.etherscanURL}address/${addressLink}" class="text-info" target="etherscan" title="View on Etherscan">${addressLink}</a>`);
}

/**
 * Function to create an Etherscan Transaction Link
 * @param {string} transactionLink Ethereum Transaction ID
 */
function esTransactionLink(transactionLink) {
  return (`<a href="${network.etherscanURL}tx/${transactionLink}" class="text-info" target="etherscan" title="View on Etherscan">${transactionLink}</a>`);
}

/**
 * Function to display messages
 * @param {string} msgClass CSS Class for HTML object
 * @param {string} message Message text
 * @param {number} msgConsole Define if message passed to console log. 0=No; 1=Log; 2=Error
 * @param {number} msgServer Define if message passed to Server Log. 0=No; 1=Log
 * @param {string} linkMessage (Optional) Message text with HyperLinks
 */
function showMessage(msgClass, message, msgConsole, msgServer, linkMessage) {
  // Display Message in Events Section of HTML Page
  let node = document.createElement("div");
  node.className = msgClass;
  if (linkMessage !== undefined) {
    node.innerHTML = linkMessage;
  } else {
    node.innerHTML = message;
  }
  let list = document.getElementById("events");
  list.insertBefore(node, list.childNodes[0]);

  // Display Console Message if required
  if (msgConsole == 1) {
    console.log(message);
  } else if (msgConsole == 2) {
    console.error(message);
  }
  
  // Display Server Message if required
  if (msgServer == 1) {
    let serverLog = new XMLHttpRequest();
    let serverMessage = new Date().toLocaleString(DEFAULTS.timestampLocale, DEFAULTS.timestampOptions) + ": " + networkID + ":" + defaultAccount + "> " + message;
    serverLog.open(
      "PUT",
      "/logs/" + serverMessage,
      true
    );
    serverLog.send();
  }
}

/**
 * Function to display generic Error Message if Async Calls unexpectedly fail
 * @param {object} error Returned Error Object
 */
function genericError(error) {
  message = `Error: ${error.message} Please see console (F12) for further details.`;
  showMessage("alert alert-danger", message, 2, 1);
}


/**
 * Function to get current NetworkAverageBlockTime from Etherscan
 */
async function getAvgBlockTime() {
  await web3.eth.getBlockNumber()
    .then(async function (currentBlockNumber){
      document.getElementById("top-curBlock").innerHTML = currentBlockNumber;
      let fetchURL = network.etherscanAPIURL + "api?module=block&action=getblockcountdown&blockno=" + (+currentBlockNumber + 100) + "&apikey=" + DEFAULTS.etherscanAPIKey;
      await fetch(fetchURL)
        .then(response => response.json())
        .then(function (jsonBlockTime){
          let ethscanCurrentBlock = parseInt(jsonBlockTime.result["CurrentBlock"]);
          console.log(`Current Block: Network=${currentBlockNumber} / Etherscan=${ethscanCurrentBlock}`);
          if (isNaN(ethscanCurrentBlock)) {  // Block passed on Etherscan-e.g.Ganache
            networkAvgBlockTime = 15;  // Set to Ethereum Standard
            console.log(`Network Average Block time: ${networkAvgBlockTime} seconds.`);
          } else if ((+currentBlockNumber + 20) < +ethscanCurrentBlock || (+currentBlockNumber - 20) > +ethscanCurrentBlock) {  // Warning if Etherscan/MetaMask current block numbers are not within 20 blocks
            message = `Warning: Network & Etherscan Current Block Numbers are not similar. Please check. Network Average Block time set to 15 seconds.`;
            showMessage("alert alert-warning", message, 2, 0);
            networkAvgBlockTime = 15;  // Set to Ethereum Standard
          } else {
            networkAvgBlockTime = parseInt(jsonBlockTime.result["EstimateTimeInSec"]) / 100;
            console.log(`Network Average Block time: ${networkAvgBlockTime} seconds.`);
          }
          setBlockTimeAttributes();
        })
        .catch(function (error) {
          genericError(error);
        });
    })
    .catch(function (error) {
      genericError(error);
    });
}

/**
 * Function to set attributes for inputDuration & inputIPDuration fields on new contract page 
 */
function setBlockTimeAttributes() {
  let IDToUpdate1 = document.getElementById("inputDuration");
  let newAttribute1 = document.createAttribute("max");
  newAttribute1.value = Math.floor(+DEFAULTS.maxDurationSeconds / +networkAvgBlockTime).toString();
  IDToUpdate1.setAttributeNode(newAttribute1);
  let IDToUpdate2 = document.getElementById("inputIPDuration");
  let newAttribute2 = document.createAttribute("max");
  newAttribute2.value = Math.floor(+DEFAULTS.maxIPDurationSeconds / +networkAvgBlockTime).toString();
  IDToUpdate2.setAttributeNode(newAttribute2);  
}

/**
 * Function to get current ETH Prices
 */
async function getETHPrices() {
  let fetchURL = network.etherscanAPIURL + "api?module=stats&action=ethprice&apikey=" + DEFAULTS.etherscanAPIKey;
  let response = await fetch(fetchURL);
  if (response.ok) { // if HTTP-status is 200-299
    let jsonPrices = await response.json();
    rateUSD = jsonPrices.result["ethusd"];    // Fetching eth_usd value
    console.log("Current ETH:USD price: ETH 1 = USD", rateUSD);
  } else {
    console.log("ETH:USD HTTP-Error: " + response.status);
  }
}

/**
 * Function to convert blocks to DayHourMin format
 * @param {string} blocks Number of blocks to convert
 * @param {string} blockDuration Single block duration in seconds
 */
function blockDHM(blocks, blockDuration) {
  let seconds = (+blocks * +blockDuration);
  let days = (+seconds >= 86400) ? Math.floor(+seconds / 86400) : 0;
  seconds -= Math.floor(+days * 86400);
  let hours = (+seconds >= 3600) ? Math.floor(+seconds / 3600) : 0;
  seconds -= Math.floor(+hours * 3600);
  let mins = (+seconds >= 60) ? Math.floor(+seconds / 60) : 0;
  return (`${days}D : ${hours}H : ${mins}M`);
}

/**
 * Function to remove decimal places from element values
 * @param {object} element  HTML Element Object
 */
function removeDecimals(element) {
  let toConvert = document.getElementById(element.id).value + ".";
  let converted = toConvert.substr(0, toConvert.indexOf(".")); 
  document.getElementById(element.id).value = converted;
}

/**
 * Function to fix decimal places of element values to maximum of 18 places after decimal 
 * @param {object} element  HTML Element Object
 */
function checkDecimals(element) {
  let toConvert =  document.getElementById(element.id).value;
  if (toConvert.includes(".")) {
    let decimalPlace = toConvert.indexOf(".");
    let convertLeft = toConvert.substr(0, decimalPlace);
    let convertRight = toConvert.substr(decimalPlace, 19);
    let converted = convertLeft + convertRight;
    document.getElementById(element.id).value = converted;
  }
}