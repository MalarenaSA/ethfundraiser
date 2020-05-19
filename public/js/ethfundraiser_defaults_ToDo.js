"use strict";
/* eslint-disable no-unused-vars */

/**
 * Ether Fund Raiser - Defaults
 * Specifies Default Values and Keys used by ethfundraiser.js
 * Update values as required and then save this file to ethfundraiser_defaults.js
 */

const DEFAULTS = {
  donationAccount: "<Your_Donation_Address>",  // Address of account that will receive any donations
  etherscanAPIKey: "<Your_API_Key>",  // Etherscan API Key
  callGas: 3000000,  // Default amount of Gas to set for Call (Read) Methods, although not actually used
  maxDurationSeconds: (604800 * 26),  // Maximum Contract duration in seconds - set to 26 weeks
  maxIPDurationSeconds: (604800 * 13),  // Maximum Initial Payment period after deadline - set to 13 weeks
  requestCountMax: 100,  // Maximum Count of Spending Requests - see FundRaiser.sol
  webHostingURL: "<Your_Website_Address>",  // Web Hosting URL used in email links
  timestampLocale: "en-gb",  // Used to determine timestamp locale to be used
  timestampOptions: {  // Format options for displaying timestamp
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  },
};
