document.addEventListener('DOMContentLoaded', () => {
    // === State Management ===
    const state = {
        walletConnected: false,
        walletAddress: '',
        huanBalance: 100.0,
        minedHuan: 0.0,
        miningInterval: null,
        isMining: false,
        currentBlockHeight: 1204912,
        totalTransactions: 8419250,
        tokens: [
            { name: 'HuanChain Gold', symbol: 'HUANG', supply: '1,000,000', decimals: 18, address: '0x321aF...9eB3' },
            { name: 'HuanChain USD', symbol: 'HUSD', supply: '50,000,000', decimals: 6, address: '0x992bE...71c8' }
        ],
        swapRates: {
            HUAN: { USDT: 2500, ETH: 0.8 },
            ETH: { HUAN: 1.25, USDT: 3125 },
            USDT: { HUAN: 0.0004, ETH: 0.00032 }
        }
    };

    // === Load README.md ===
    function loadReadme() {
        const readmeContainer = document.getElementById('readme-content');
        fetch('README.md')
            .then(response => {
                if (!response.ok) throw new Error('Failed to load README.md');
                return response.text();
            })
            .then(text => {
                // Set marked options if available
                if (typeof marked !== 'undefined') {
                    readmeContainer.innerHTML = marked.parse(text);
                    // Force all links inside the README container to open in a new tab
                    readmeContainer.querySelectorAll('a').forEach(link => {
                        link.setAttribute('target', '_blank');
                        link.setAttribute('rel', 'noopener noreferrer');
                    });
                } else {
                    readmeContainer.textContent = text;
                }
            })
            .catch(err => {
                readmeContainer.innerHTML = `
                    <div style="color: var(--error); padding: 20px; text-align: center;">
                        <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; margin-bottom: 10px;"></i>
                        <p>Error loading README.md: ${err.message}</p>
                    </div>
                `;
            });
    }
    loadReadme();

    document.getElementById('reload-readme-btn').addEventListener('click', () => {
        const readmeContainer = document.getElementById('readme-content');
        readmeContainer.innerHTML = `
            <div class="loading-spinner">
                <i class="fa-solid fa-circle-notch fa-spin"></i>
                <span>Reloading README.md...</span>
            </div>
        `;
        loadReadme();
    });

    // === Navigation (Main Sidebar tabs) ===
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.remove('active'));

            item.classList.add('active');
            const tabId = item.getAttribute('data-tab');
            document.getElementById(`tab-${tabId}`).classList.add('active');
        });
    });

    // === Navigation (DApps Sub-Sidebar tabs) ===
    const dappMenuBtns = document.querySelectorAll('.dapp-menu-btn');
    const dappModules = document.querySelectorAll('.dapp-module');

    dappMenuBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            dappMenuBtns.forEach(b => b.classList.remove('active'));
            dappModules.forEach(m => m.classList.remove('active'));

            btn.classList.add('active');
            const moduleId = btn.getAttribute('data-module');
            document.getElementById(`module-${moduleId}`).classList.add('active');
        });
    });

    // === Wallet Connection Simulation ===
    const walletConnectBtn = document.getElementById('wallet-connect-btn');
    const walletAddressText = document.getElementById('wallet-address-text');
    const faucetAddressInput = document.getElementById('faucet-address');

    walletConnectBtn.addEventListener('click', () => {
        if (!state.walletConnected) {
            // Connect Wallet
            state.walletConnected = true;
            // Generate random mock address
            const randHex = Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('');
            state.walletAddress = '0x' + randHex.substring(0, 5) + '...' + randHex.substring(35);
            
            walletAddressText.innerText = state.walletAddress;
            walletConnectBtn.classList.add('connected');
            faucetAddressInput.value = '0x' + randHex;

            showToast('Wallet Connected Successfully!', 'success');
        } else {
            // Disconnect
            state.walletConnected = false;
            state.walletAddress = '';
            walletAddressText.innerText = 'Connect Wallet';
            walletConnectBtn.classList.remove('connected');
            faucetAddressInput.value = '';

            showToast('Wallet Disconnected', 'info');
        }
    });

    // === Swap Module Logic ===
    const swapFromAmount = document.getElementById('swap-from-amount');
    const swapToAmount = document.getElementById('swap-to-amount');
    const swapFromToken = document.getElementById('swap-from-token');
    const swapToToken = document.getElementById('swap-to-token');
    const swapSwitchBtn = document.getElementById('swap-switch-btn');
    const swapSubmitBtn = document.getElementById('swap-submit-btn');
    const swapMetaRate = document.getElementById('swap-meta-rate');
    const swapMetaMin = document.getElementById('swap-meta-min');

    function updateSwapRate() {
        const from = swapFromToken.value;
        const to = swapToToken.value;
        
        if (from === to) {
            swapToAmount.value = swapFromAmount.value;
            swapMetaRate.innerText = `1 ${from} = 1 ${to}`;
            swapMetaMin.innerText = `${(swapFromAmount.value * 0.995).toFixed(4)} ${to}`;
            return;
        }

        const rate = state.swapRates[from]?.[to] || 1;
        const calculated = (swapFromAmount.value * rate).toFixed(4);
        swapToAmount.value = calculated;
        swapMetaRate.innerText = `1 ${from} = ${rate.toLocaleString()} ${to}`;
        swapMetaMin.innerText = `${(calculated * 0.995).toLocaleString()} ${to}`;
    }

    swapFromAmount.addEventListener('input', updateSwapRate);
    swapFromToken.addEventListener('change', updateSwapRate);
    swapToToken.addEventListener('change', updateSwapRate);

    swapSwitchBtn.addEventListener('click', () => {
        const fromVal = swapFromToken.value;
        swapFromToken.value = swapToToken.value;
        swapToToken.value = fromVal;
        updateSwapRate();
    });

    swapSubmitBtn.addEventListener('click', () => {
        if (parseFloat(swapFromAmount.value) <= 0 || isNaN(parseFloat(swapFromAmount.value))) {
            showToast('Please enter a valid amount', 'warning');
            return;
        }
        
        swapSubmitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Submitting Swap...';
        swapSubmitBtn.disabled = true;

        setTimeout(() => {
            showToast(`Successfully swapped ${swapFromAmount.value} ${swapFromToken.value} for ${swapToAmount.value} ${swapToToken.value}!`, 'success');
            
            // Add mock transaction to Explorer list
            const hash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
            addMockTransaction(
                hash, 
                state.walletAddress || '0xDemoWalletAddress', 
                `Swap ${swapFromAmount.value} ${swapFromToken.value}`
            );

            swapSubmitBtn.innerText = 'Swap Tokens';
            swapSubmitBtn.disabled = false;
        }, 1200);
    });

    // Initial rate setup
    updateSwapRate();

    // === Faucet Module Logic ===
    const faucetClaimBtn = document.getElementById('faucet-claim-btn');
    const faucetStatusMsg = document.getElementById('faucet-status-msg');

    faucetClaimBtn.addEventListener('click', () => {
        const address = faucetAddressInput.value.trim();
        if (!address.startsWith('0x') || address.length < 40) {
            showToast('Please enter a valid Ethereum-style wallet address.', 'warning');
            return;
        }

        faucetClaimBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Claiming tokens...';
        faucetClaimBtn.disabled = true;

        setTimeout(() => {
            showToast('10.00 HUAN tokens sent to your wallet address!', 'success');
            
            // Add mock transaction
            const hash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
            addMockTransaction(hash, address, 'Faucet Claim +10 HUAN');

            // Start cooldown
            let cooldown = 60;
            faucetClaimBtn.innerText = `Claim Locked (${cooldown}s)`;
            faucetStatusMsg.innerHTML = `<span style="color: var(--success)"><i class="fa-solid fa-check"></i> Transfer successful. Tx: ${hash.substring(0, 12)}...</span>`;

            const timer = setInterval(() => {
                cooldown--;
                if (cooldown <= 0) {
                    clearInterval(timer);
                    faucetClaimBtn.innerText = 'Request 10.00 HUAN';
                    faucetClaimBtn.disabled = false;
                    faucetStatusMsg.innerText = '';
                } else {
                    faucetClaimBtn.innerText = `Claim Locked (${cooldown}s)`;
                }
            }, 1000);

        }, 1500);
    });

    // === Token Creator Logic ===
    const tokenCreatorForm = document.getElementById('token-creator-form');
    const deployedTokensList = document.getElementById('deployed-tokens-list');

    function renderTokens() {
        deployedTokensList.innerHTML = '';
        state.tokens.forEach(tok => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${tok.name}</td>
                <td>${tok.symbol}</td>
                <td>${tok.supply}</td>
                <td>${tok.decimals}</td>
                <td><code>${tok.address}</code></td>
            `;
            deployedTokensList.appendChild(tr);
        });
    }

    tokenCreatorForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('creator-name').value;
        const symbol = document.getElementById('creator-symbol').value;
        const decimals = parseInt(document.getElementById('creator-decimals').value);
        const supply = parseFloat(document.getElementById('creator-supply').value).toLocaleString();

        const submitBtn = tokenCreatorForm.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Deploying Smart Contract...';
        submitBtn.disabled = true;

        setTimeout(() => {
            const randHex = Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('');
            const address = '0x' + randHex.substring(0, 5) + '...' + randHex.substring(35);
            
            state.tokens.push({ name, symbol, supply, decimals, address });
            renderTokens();
            
            showToast(`Token contract ${symbol} successfully deployed at ${address}!`, 'success');

            // Add mock transaction
            const hash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
            addMockTransaction(hash, address, `Deploy ${symbol} ERC20 Contract`);

            tokenCreatorForm.reset();
            document.getElementById('creator-decimals').value = 18;
            submitBtn.innerText = 'Create Utility Token';
            submitBtn.disabled = false;
        }, 2000);
    });

    renderTokens();

    // === Mining Simulator Logic ===
    const miningToggleBtn = document.getElementById('mining-toggle-btn');
    const miningIcon = document.getElementById('mining-icon');
    const miningHashrateVal = document.getElementById('mining-hashrate-val');
    const miningThreadsVal = document.getElementById('mining-threads-val');
    const miningBalanceVal = document.getElementById('mining-balance-val');
    const miningThreadSelect = document.getElementById('mining-thread-select');

    miningToggleBtn.addEventListener('click', () => {
        if (!state.isMining) {
            // Start Mining
            state.isMining = true;
            miningToggleBtn.innerText = 'Stop Mining Simulator';
            miningToggleBtn.classList.remove('btn-success');
            miningToggleBtn.classList.add('btn-error');
            miningIcon.classList.add('active');
            
            const threads = parseInt(miningThreadSelect.value);
            miningThreadsVal.innerText = `${threads} / 8`;
            
            // Simulate random fluctuating hashrate based on threads
            state.miningInterval = setInterval(() => {
                const randomHashrate = (threads * 1.5 + (Math.random() - 0.5) * 0.5).toFixed(2);
                miningHashrateVal.innerText = `${randomHashrate} KH/s`;
                
                // Accumulate rewards
                state.minedHuan += 0.0005 * threads;
                miningBalanceVal.innerText = `${state.minedHuan.toFixed(6)} HUAN`;
            }, 1000);

            showToast('Mining Simulator started successfully', 'success');
        } else {
            // Stop Mining
            clearInterval(state.miningInterval);
            state.isMining = false;
            miningToggleBtn.innerText = 'Start Mining Simulator';
            miningToggleBtn.classList.remove('btn-error');
            miningToggleBtn.classList.add('btn-success');
            miningIcon.classList.remove('active');
            miningHashrateVal.innerText = '0.00 KH/s';
            miningThreadsVal.innerText = '0 / 8';

            showToast(`Stopped mining. Accumulated rewards: ${state.minedHuan.toFixed(6)} HUAN`, 'info');
        }
    });

    // === Smart Contract IDE Logic ===
    const ideDeployBtn = document.getElementById('ide-deploy-btn');
    const ideConsoleVal = document.getElementById('ide-console-val');
    const ideEditor = document.getElementById('ide-editor');

    ideDeployBtn.addEventListener('click', () => {
        const code = ideEditor.value;
        ideConsoleVal.innerText = '> Initializing Solidity Solc Compiler...\n';
        ideDeployBtn.disabled = true;

        setTimeout(() => {
            ideConsoleVal.innerText += '> Compilation successful. Compiled bytecode: 0x608060405234801561001057600080fd5b506040...\n';
            
            setTimeout(() => {
                ideConsoleVal.innerText += '> Deploying contract bytecode to HuanChain Chain...\n';
                
                setTimeout(() => {
                    const randHex = Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('');
                    const contractAddr = '0x' + randHex;
                    
                    ideConsoleVal.innerText += `> Transaction confirmed: Block #${state.currentBlockHeight + 1}\n`;
                    ideConsoleVal.innerText += `> Contract successfully deployed at: ${contractAddr}\n`;
                    ideConsoleVal.innerText += `> ABI mapping: [mint, transfer, balanceOf, totalSupply]`;
                    
                    showToast('Smart Contract compiled & deployed!', 'success');
                    
                    // Add mock transaction
                    const hash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
                    addMockTransaction(hash, contractAddr.substring(0, 10) + '...', 'Smart Contract Deployment');

                    ideDeployBtn.disabled = false;
                }, 800);
            }, 800);
        }, 1000);
    });

    // === Blockchain Explorer (Scan) Logic ===
    const scanBlocksList = document.getElementById('scan-blocks-list');
    const scanTxsList = document.getElementById('scan-txs-list');
    const statsBlocks = document.getElementById('stats-blocks');
    const statsTxs = document.getElementById('stats-txs');

    function addMockBlock() {
        state.currentBlockHeight++;
        statsBlocks.innerText = state.currentBlockHeight.toLocaleString();
        
        const timeStr = 'Just now';
        const validator = '0xSlot' + Math.floor(Math.random()*100);
        const txCount = Math.floor(Math.random() * 15) + 1;
        
        const div = document.createElement('div');
        div.className = 'scan-item';
        div.innerHTML = `
            <div class="scan-meta-left">
                <span class="scan-label">Block #${state.currentBlockHeight}</span>
                <span class="scan-subtext">Validator: ${validator} • ${txCount} transactions</span>
            </div>
            <div class="scan-meta-right">
                <span class="text-secondary font-bold">${timeStr}</span>
            </div>
        `;

        scanBlocksList.insertBefore(div, scanBlocksList.firstChild);
        if (scanBlocksList.children.length > 5) {
            scanBlocksList.removeChild(scanBlocksList.lastChild);
        }
    }

    function addMockTransaction(hash, address, description) {
        state.totalTransactions++;
        statsTxs.innerText = state.totalTransactions.toLocaleString();

        const timeStr = 'Just now';
        const shortHash = hash.substring(0, 12) + '...';
        
        const div = document.createElement('div');
        div.className = 'scan-item';
        div.innerHTML = `
            <div class="scan-meta-left">
                <span class="scan-label">${description}</span>
                <span class="scan-subtext">To: ${address} • Hash: ${shortHash}</span>
            </div>
            <div class="scan-meta-right">
                <span class="text-primary font-bold">${timeStr}</span>
            </div>
        `;

        scanTxsList.insertBefore(div, scanTxsList.firstChild);
        if (scanTxsList.children.length > 5) {
            scanTxsList.removeChild(scanTxsList.lastChild);
        }
    }

    // Populate initial mock blocks
    for (let i = 4; i >= 0; i--) {
        const blockNum = state.currentBlockHeight - i;
        const validator = '0xSlot' + Math.floor(Math.random()*100);
        const txCount = Math.floor(Math.random() * 15) + 1;
        const timeStr = `${i * 12}s ago`;

        const div = document.createElement('div');
        div.className = 'scan-item';
        div.innerHTML = `
            <div class="scan-meta-left">
                <span class="scan-label">Block #${blockNum}</span>
                <span class="scan-subtext">Validator: ${validator} • ${txCount} txs</span>
            </div>
            <div class="scan-meta-right">
                <span class="text-secondary">${timeStr}</span>
            </div>
        `;
        scanBlocksList.appendChild(div);
    }

    // Populate initial mock transactions
    const mockTxDescs = ['Swap ETH for USDT', 'Token Transfer', 'Contract Execution', 'Liquidity Deposit', 'Validator Reward'];
    for (let i = 4; i >= 0; i--) {
        const hash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
        const shortHash = hash.substring(0, 12) + '...';
        const addr = '0x' + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('').substring(0, 6) + '...';
        const desc = mockTxDescs[i];
        const timeStr = `${i * 15}s ago`;

        const div = document.createElement('div');
        div.className = 'scan-item';
        div.innerHTML = `
            <div class="scan-meta-left">
                <span class="scan-label">${desc}</span>
                <span class="scan-subtext">To: ${addr} • Hash: ${shortHash}</span>
            </div>
            <div class="scan-meta-right">
                <span class="text-primary">${timeStr}</span>
            </div>
        `;
        scanTxsList.appendChild(div);
    }

    // Simulate automatic block generation (every 12 seconds)
    setInterval(() => {
        addMockBlock();
        
        // Add a random transaction from time to time
        if (Math.random() > 0.4) {
            const hash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
            const addr = '0x' + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('').substring(0, 6) + '...';
            const randDesc = mockTxDescs[Math.floor(Math.random() * mockTxDescs.length)];
            addMockTransaction(hash, addr, randDesc);
        }
    }, 12000);

    // === Toast Notification System ===
    function showToast(message, type = 'info') {
        // Remove existing toast container if not present
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.position = 'fixed';
            container.style.bottom = '24px';
            container.style.right = '24px';
            container.style.zIndex = '9999';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.gap = '8px';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.style.padding = '14px 20px';
        toast.style.borderRadius = 'var(--radius-sm)';
        toast.style.boxShadow = 'var(--shadow-main)';
        toast.style.fontFamily = 'var(--font-sans)';
        toast.style.fontSize = '0.9rem';
        toast.style.fontWeight = '600';
        toast.style.color = '#ffffff';
        toast.style.backdropFilter = 'blur(10px)';
        toast.style.transition = 'all 0.3s ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';

        let bgColor, icon;
        if (type === 'success') {
            bgColor = 'hsla(145, 80%, 45%, 0.85)';
            icon = '<i class="fa-solid fa-circle-check" style="margin-right: 8px;"></i>';
        } else if (type === 'warning') {
            bgColor = 'hsla(40, 90%, 55%, 0.85)';
            icon = '<i class="fa-solid fa-triangle-exclamation" style="margin-right: 8px;"></i>';
        } else if (type === 'error') {
            bgColor = 'hsla(0, 85%, 60%, 0.85)';
            icon = '<i class="fa-solid fa-circle-xmark" style="margin-right: 8px;"></i>';
        } else {
            bgColor = 'hsla(250, 80%, 65%, 0.85)';
            icon = '<i class="fa-solid fa-circle-info" style="margin-right: 8px;"></i>';
        }

        toast.style.backgroundColor = bgColor;
        toast.style.border = '1px solid var(--border-color)';
        toast.innerHTML = `${icon} ${message}`;

        container.appendChild(toast);

        // Animation in
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        }, 50);

        // Animation out & remove
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 4000);
    }
});
