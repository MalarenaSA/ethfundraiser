# Test scenarios checked for ethfundraiser front-end

| Ref\# | Details | Results \- 21/05/2020 | Results \- 18/02/2020 | Results \- 27/01/2020 |
|-------|---------|-----------------------|-----------------------|-----------------------|
| **00** | **Startup & Home Page** | | | |
| 00\.01 | Load WebPage and get "This dApp will not…" alert message if MetaMask not installed | Passed | Passed \- Minor updates | Passed |
| 00\.02 | Connect to Metamask and get generic F12 error if disallowed | Passed | Passed \- Minor updates | FAILED \- Now Fixed |
| 00\.03 | Connect to Metamask & allow connection shows Network / Account \(with hyperlinks\) & also open Console \(F12\) to see contract ABI, gas price, ETH:USD price, current block, average block time loaded and request count max all set | Passed | Passed | Passed |
| 00\.04 | Change Metamask Network changes Network details | Passed | Passed | Passed |
| 00\.05 | Change Metamask Account changes Account details | Passed | Passed | Passed |
| 00\.06 | Click on all hyperlinks on Home page works OK | Passed | Passed | Passed |
| **01** | **New Contract Page, including FRTests\-01 \- Setup/Deploy** | | | |
| 01\.01 | Block Converter works as expected with saved changes/reset now working | Passed | Passed \- Minor updates | Passed |
| 01\.02 | Wei Converter works as expected | Passed \- Minor updates | Passed \- Minor updates | Passed |
| 01\.03 | Deploy from account with 0 wei gives "Insufficient funds" error | Passed | Passed | Passed |
| 01\.04 | Blank or 0 Duration gives "Invalid Duration" error, & negative / decimal not allowed | Passed | Passed | Passed |
| 01\.05 | Duration over 1048320 \(15Sec Block Time\) gives "Duration over" error \+ on Server | Passed | Passed | Passed |
| 01\.06 | Blank or 0 IPDuration gives "Invalid IP duration" error, & negative / decimal not allowed | Passed | Passed | Passed |
| 01\.07 | Duration over 524160 \(15s Block Time\) gives "IP Duration over" error | Passed | Passed | Passed |
| 01\.08 | Blank Goal gives "Invalid Goal" error, & negative / decimal not allowed \(0 OK\) | Passed | Passed | Passed |
| 01\.09 | Blank Min Contribution gives "Invalid Min Cont" error, & negative / decimal not allowed \(0 OK\) | Passed | Passed | Passed |
| 01\.10 | Normal Deploy that is then Rejected in MetaMask gives error \+ on Server | Passed | Passed | Passed |
| 01\.11 | Normal Deploy works OK \(including hyperlinks & server log\) and Existing Contract Screen updated correctly | Passed | Passed | Passed |
| 01\.12 | Email Link works OK | Passed | Passed \- Minor updates | Passed |
| 01\.13 | Change Owner to blank or invalid address gives "not valid address" error | Passed | Passed \- Minor updates | FAILED \- Does not clear account field & error message \- Now Fixed |
| 01\.14 | Change Owner to Address 0 gives "cannot be zero" error | Passed | Passed | Passed |
| 01\.15 | Change Owner to self gives "ALREADY owner" error | Passed | Passed | FAILED \- Now Fixed |
| 01\.16 | Change Owner to another account works OK, with warning, \(including hyperlinks & server log\) and Existing Contract Screen updated correctly | Passed | Passed | Passed |
| 01\.17 | Try to change owner again \(now no longer owner\) gives "only owner" error | Passed | Passed | Passed |
| 01\.18 | Normal Deploy with longer duration & larger amounts on different network works OK | Passed | Passed | FAILED\. Top Smart Contract is not hyperlinked \- Now Fixed |
| 01\.19 | Deploy to Mainnet of duration below 100 blocks gives warning message | Passed | New | New |
| **02** | **Existing Contract Page, including FRTests\-02 \- Contributions** | | | |
| 02\.01 | Blank contract address gives "No Contract" error on ALL buttons except \[Get Details\] | Passed | Passed | Passed |
| 02\.02 | Get Details with blank or invalid address gives "not valid address"error | Passed | Passed | Passed |
| 02\.03 | Get Details with Address 0 gives "cannot be zero" error | Passed | Passed | Passed |
| 02\.04 | Valid address but on different network gives "not deployed on this network" error | Passed | Passed | Passed |
| 02\.05 | Normal Get Details works OK \(including hyperlinks & server log\) and Existing Contract Screen updated correctly | Passed | Passed | Passed |
| 02\.06 | Repeat for blank Get Details gives "not valid address" error and clears all fields | Passed | Passed | Passed |
| 02\.07 | Change Accounts and make 50% contribution works OK \(including hyperlinks & server log\) and Existing Contract Screen updated correctly | Passed | Passed | Passed |
| 02\.08 | Make another 30% contribution from SAME account works OK \(including hyperlinks & server log\) and Existing Contract Screen & Spending Request/Number of Voters updated correctly | Passed | Passed | Passed |
| 02\.09 | Make another 30% contribution from a different account works OK \(including hyperlinks & server log\) and Existing Contract Screen & Spending Request/Number of Voters updated correctly | Passed | Passed | Passed |
| 02\.10 | Contribution from account with zero balance gives "account balance" error | Passed | Passed | Passed |
| 02\.11 | Contribution below minimum level gives "minimum contribution" error | Passed | Passed | Passed |
| 02\.12 | Contribution to contract passed its deadline \(wait if required\) gives "contract deadline" error \+ on Server | Passed | Passed | Passed |
| 02\.13 | Check Contribution from invalid address gives "contributor invalid" error | Passed | Passed | FAILED \- Does not clear account field & error message \- Now Fixed |
| 02\.14 | Check Contribution from Address 0 gives "cannot be zero" error | Passed | Passed | Passed |
| 02\.15 | Check Contribution from valid Contributor and Non\-Contributor works OK | Passed | Passed | Passed |
| 02\.16 | Create contract with 0 min contribution & contribution of 0 gives "cannot be less" error | Passed | Passed | FAILED \- no error check for blank/zero amount of contribution \- Now Fixed |
| **03** | **Existing Contract Page, including FRTests\-03 \- Refunds** | | | |
| 03\.01 | Create short \(10\) contract & make 2 diff contributions from different accounts below goal\. Refund before deadline gives "contract deadline not reached" error \+ on Server | Passed | Passed | Passed |
| 03\.02 | Refund from non\-contributor gives "no contribution" error | Passed | Passed | Passed |
| 03\.03 | Wait for deadline to pass then Standard Refund for both contributors works OK \(including hyperlinks & server log\) and Existing Contract Screen updated correctly | Passed | Passed | Passed |
| 03\.04 | Create short \(10\) contract, make 2 contributions up to goal amount\. Refund after deadline but before IP deadline gives "IP deadline not reached" error \+ on Server | Passed | Passed | Passed |
| 03\.05 | Refund after deadline and after IP deadline works OK \(including hyperlinks & server log\) and Existing Contract Screen updated correctly, including Check Contribution | Passed | Passed | Passed |
| 03\.06 | Create short \(10\) contract, make 3 contributions up to goal amount, raise SR for 1, Vote for SR from all 3\. Refund after IP deadline for 1 works OK, including vote removal | Passed | Passed | Passed |
| 03\.07 | Pay SR \(which is still approved\)\. Final refund after IP deadline gives "payments already made" error \+ on Server | Passed | Passed | New |
| **04** | **Spending Requests Page, including FRTests\-04 \- Spending Requests** | | | |
| 04\.01 | No contract selected and blank spending request gives "No contract selected" error on Get Details, Email Link & Create Request | Passed | Passed | Passed |
| 04\.02 | No contract selected and blank spending request gives "No spending request selected" error on Pay Request, Check if voted & Vote for Request | Passed | Passed | Passed |
| 04\.03 | Create short \(10\) contract and try to create a spending request gives "Goal not reached" error \+ on Server | Passed | Passed | Passed |
| 04\.04 | Make contribution of goal amount, and blank spending request gives "No spending request" error on Get Details and Email Link | Passed | Passed | Passed |
| 04\.05 | Enter non\-existant spending request gives "does not exist" error | Passed | Passed | Passed |
| 04\.06 | Blank Description and Create Request gives "Description required" error | Passed | Passed | Passed |
| 04\.07 | Blank or 0 Request Value gives "greater than zero" error, & negative / decimal not allowed | Passed | Passed | Passed |
| 04\.08 | Request Value of greater than contract balance gives "greater than contract" error \+ on Server | Passed | Passed \- Minor updates | Passed |
| 04\.09 | Recipient Account of blank or invalid address gives "account invalid" error | Passed | Passed | Passed |
| 04\.10 | Recipient Account of Address 0 gives "cannot be zero" error | Passed | Passed | Passed |
| 04\.11 | Change to non\-owner and create normal spending request gives "only owner" error | Passed | Passed | Passed |
| 04\.12 | Change to owner and Standard Spending Request works OK \(including hyperlinks & server log\) and Spending Request Screen & Existing Contract/Number of Spending Requests updated correctly | Passed | Passed | Passed |
| 04\.13 | Email Link Works | Passed | Passed | Passed |
| 04\.14 | Enter non\-existant spending request gives "does not exist" error & clears all fields | Passed | Passed | New |
| 04\.15 | Change Recipient Account and create Spending Request for 50% works OK, but with warning message \(including hyperlinks & server log\) and Spending Request Screen & Existing Contract/Number of Spending Requests updated correctly | Passed | Passed | Passed |
| 04\.16 | Edit ethfundraiser\_defaults so that requestCountMax is total spending requests already issued\. Refresh dApp and re\-load contract\. Should now show max requests "reached"\. Create request now gives "max number" error \+ on Server\. Reset ethfundraiser\_defaults | Passed | Passed | New |
| 04\.17 | Display existing spending request and then create new contract \(next test\) resets create new spending request page | Passed | Passed | FAILED as page not cleared \- Now Fixed |
| **05** | **Spending Requests Page, including FRTests\-05 \- Voting** | | | |
| 05\.01 | Create short \(10\) contract, make 3 contributions up to goal amount, and raise SR for total\. Connect as non\-contributor, get request details and Vote for Request gives "zero contribution" error \+ on Server | Passed | Passed | Passed |
| 05\.02 | Connect as 2 contributors and Vote for request works OK \(including hyperlinks & server log\) and Spending Request Screen updated correctly | Passed | Passed | Passed |
| 05\.03 | Vote again for same Request gives "already voted" error | Passed | Passed | Passed |
| 05\.04 | Pay request and then attempt to vote as third contributor gives "request completed" error | Passed | Passed | New |
| 05\.05 | Check Voted from invalid address gives "account is invalid" error | Passed | Passed | FAILED as Account field not blanked\. Now Fixed |
| 05\.06 | Check Voted from Address 0 gives "cannot be zero" error | Passed | Passed | Passed |
| 05\.07 | Check Voted for contributor gives positive event message | Passed | Passed | Passed |
| 05\.08 | Check Voted for non\-contributor gives negative event message | Passed | Passed | Passed |
| **06** | **Spending Requests Page, including FRTests\-06 \- Payment Release** | | | |
| 06\.01 | Create short \(10\) contract, make contribution up to goal amount, raise 2 SRs for 60%\. Vote for both\. Connect as non\-owner and Pay Request gives "only owner" error | Passed | Passed | Passed |
| 06\.02 | Connect as owner and Pay Request works OK \(including hyperlinks & server log\) and Spending Request Screen & Existing Contract/Amount Paid Out updated correctly | Passed | Passed | Passed |
| 06\.03 | Attempt to Pay Same Request gives "already completed" error | Passed | Passed | Passed |
| 06\.04 | Select 2nd request and attempt to Pay Request \(which is now above contract balance\) gives "greater than contract balance" error \+ on Server | Passed | Passed | Passed |
| 06\.05 | Create new spending request for remaining balance, vote and Pay Request works OK \(including hyperlinks & server log\) and Spending Request Screen & Existing Contract/Amount Paid Out updated correctly | Passed | Passed | Passed |
| 06\.07 | Create short \(10\) contract, make 3 contributions up to goal amount, and raise SR for total\. Vote from first account and attempt to Pay Request gives "less than majority" error \+ on Server | Passed | Passed | Passed |
| 06\.08 | Vote from second account and Pay Request works OK | Passed | Passed | Passed |
| **07** | **Other tests** | | | |
| 07\.01 | FRTests\-07 \- SafeMath Tests implicitly checked as part of above so no additional test scenarios created | | | |
| 07\.02 | Run above tests across ALL Test Networks | Done for Goerli | Done for Goerli | Done for Goerli |
| 07\.03 | Connect to non\-updated node and check error message on block times | Passed | Passed | Passed |