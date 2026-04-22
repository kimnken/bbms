const API = {
    async get(path) {
        const res = await fetch(path);
        return res.json();
    },
    async post(path, body) {
        const res = await fetch(path, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        return res.json();
    }
};

const state = {
    chain: [],
    selectedBlock: null
};

const fmt = {
    money: (n) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n),
    time: (s) => new Date(s).toLocaleString(),
    hash: (h) => h ? `${h.substring(0, 10)}...${h.substring(h.length - 10)}` : 'N/A'
};

function toast(msg, type = 'info') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = `show ${type}`;
    setTimeout(() => t.className = '', 3600);
}

function startClock() {
    const el = document.getElementById('headerClock');
    setInterval(() => {
        el.textContent = new Date().toLocaleTimeString();
    }, 1000);
}

async function loadStats() {
    const data = await API.get('/api/stats');
    if (data.success) {
        const s = data.stats;
        document.getElementById('statBlocks').textContent = s.totalBlocks;
        document.getElementById('statRecords').textContent = s.evidenceRecords;
        document.getElementById('statTamper').textContent = s.tamperAttempts;
        document.getElementById('headerBlocks').textContent = `${s.totalBlocks} Blocks`;
        
        const statusEl = document.getElementById('statStatus');
        statusEl.textContent = s.chainValid ? 'SECURE' : 'COMPROMISED';
        statusEl.parentElement.className = `stat ${s.chainValid ? 'green' : 'orange'}`;
    }
}

async function loadChain() {
    const data = await API.get('/api/chain');
    if (data.success) {
        state.chain = data.chain;
        renderChain(data.chain);
    }
}

function renderChain(chain) {
    const container = document.getElementById('chainDisplay');
    container.innerHTML = '';

    chain.forEach((block, i) => {
        if (i > 0) {
            const link = document.createElement('div');
            const isValid = block.previousHash === chain[i-1].hash;
            link.className = `chain-link ${isValid ? 'valid' : 'invalid'}`;
            link.innerHTML = '→';
            container.appendChild(link);
        }

        const card = document.createElement('div');
        const isGenesis = i === 0;
        const isSelected = state.selectedBlock && state.selectedBlock.index === i;
        
        // Simple client-side tamper check
        let isTampered = false;
        if (i > 0) {
            isTampered = block.previousHash !== chain[i-1].hash;
        }

        card.className = `block-card ${isGenesis ? 'genesis' : ''} ${isSelected ? 'selected' : ''} ${isTampered ? 'tampered' : ''}`;
        card.onclick = () => inspectBlock(i);

        card.innerHTML = `
            <div class="b-index">BLOCK #${block.index}</div>
            <div class="b-hash">${fmt.hash(block.hash)}</div>
            <div class="b-preview">${block.data.txId || block.data.type}</div>
            <div class="b-ts">${new Date(block.timestamp).toLocaleTimeString()}</div>
        `;
        container.appendChild(card);
    });
}

function inspectBlock(index) {
    const block = state.chain[index];
    state.selectedBlock = block;
    renderChain(state.chain);

    const detail = document.getElementById('blockDetail');
    let html = `
        <div class="inspector-grid">
            <div class="inspector-row"><span class="key">Index</span><span class="val">${block.index}</span></div>
            <div class="inspector-row"><span class="key">Timestamp</span><span class="val">${fmt.time(block.timestamp)}</span></div>
            <div class="inspector-row"><span class="key">Nonce</span><span class="val">${block.nonce}</span></div>
            <div class="inspector-row"><span class="key">Hash</span><span class="val" style="font-size:0.6rem">${block.hash}</span></div>
            <div class="inspector-row"><span class="key">Prev Hash</span><span class="val" style="font-size:0.6rem">${block.previousHash}</span></div>
    `;

    if (block.data.txId) {
        html += `
            <hr style="border:0; border-top:1px solid var(--border); margin:0.5rem 0">
            <div class="inspector-row"><span class="key">TX ID</span><span class="val">${block.data.txId}</span></div>
            <div class="inspector-row"><span class="key">Amount</span><span class="val">${fmt.money(block.data.amount)}</span></div>
            <div class="inspector-row"><span class="key">Sender</span><span class="val">${block.data.sender}</span></div>
            <div class="inspector-row"><span class="key">Receiver</span><span class="val">${block.data.receiver}</span></div>
            <div class="inspector-row"><span class="key">Type</span><span class="val">${block.data.type}</span></div>
            <div class="inspector-row"><span class="key">Flag</span><span class="val">${block.data.flagLevel}</span></div>
            <div class="inspector-row"><span class="key">Sealed By</span><span class="val">${block.data.sealedBy}</span></div>
        `;
    }

    html += `</div>`;
    detail.innerHTML = html;
}

async function loadEvidenceList() {
    const data = await API.get('/api/chain');
    const list = document.getElementById('evidenceList');
    list.innerHTML = '';

    const evidenceBlocks = data.chain.filter(b => b.data.txId).reverse();
    
    if (evidenceBlocks.length === 0) {
        list.innerHTML = '<div class="empty-state">No evidence records found.</div>';
        return;
    }

    evidenceBlocks.forEach(b => {
        const item = document.createElement('div');
        item.className = 'ev-item';
        item.innerHTML = `
            <div class="ev-txid">${b.data.txId}</div>
            <div class="ev-desc">${b.data.description || 'No description'}</div>
            <div class="ev-badge" style="background:var(--${getFlagColor(b.data.flagLevel)})">${b.data.flagLevel}</div>
        `;
        list.appendChild(item);
    });
}

function getFlagColor(level) {
    switch(level) {
        case 'LOW': return 'green';
        case 'MEDIUM': return 'accent';
        case 'HIGH': return 'orange';
        case 'CRITICAL': return 'red';
        default: return 'border2';
    }
}

async function loadAuditLog() {
    const data = await API.get('/api/audit');
    const log = document.getElementById('auditLog');
    log.innerHTML = '';

    data.log.forEach(entry => {
        const row = document.createElement('div');
        row.className = `log-row ${entry.type}`;
        row.innerHTML = `
            <div>${new Date(entry.timestamp).toLocaleTimeString()}</div>
            <div style="font-weight:bold">${entry.type}</div>
            <div>${entry.message}</div>
        `;
        log.appendChild(row);
    });
}

async function addEvidence() {
    const btn = document.getElementById('sealBtn');
    const txId = document.getElementById('txId').value;
    const amount = document.getElementById('txAmount').value;
    const sender = document.getElementById('txSender').value;
    const receiver = document.getElementById('txReceiver').value;
    const type = document.getElementById('txType').value;
    const description = document.getElementById('txCase').value;
    const flagLevel = document.getElementById('txFlag').value;

    if (!txId || !amount || !sender || !receiver) {
        return toast('Please fill all required fields', 'error');
    }

    btn.disabled = true;
    btn.textContent = 'Mining Block...';

    try {
        const res = await API.post('/api/evidence', {
            txId, amount: parseFloat(amount), sender, receiver, type, description, flagLevel
        });

        if (res.success) {
            toast('Evidence sealed to blockchain!', 'success');
            document.getElementById('evidenceForm').reset();
            setFlag('MEDIUM');
            await refresh();
            inspectBlock(state.chain.length - 1);
        } else {
            toast(res.message, 'error');
        }
    } catch (e) {
        toast('Server error', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Seal to Blockchain';
    }
}

async function verifyChain() {
    const data = await API.get('/api/verify/chain');
    if (data.success) {
        if (data.result.valid) {
            toast(`Chain is valid! ${data.result.blocks} blocks verified.`, 'success');
        } else {
            toast(`ALERT: Chain compromised at block ${data.result.blockIndex}!`, 'error');
        }
        refresh();
    }
}

async function simulateTamper() {
    const evidenceBlocks = state.chain.filter(b => b.data.txId);
    if (evidenceBlocks.length === 0) return toast('No evidence to tamper with!', 'error');

    const target = evidenceBlocks[Math.floor(Math.random() * evidenceBlocks.length)];
    
    const res = await API.post('/api/tamper', {
        blockIndex: target.index,
        field: 'amount',
        newValue: target.data.amount * 10
    });

    if (res.success) {
        toast('CRITICAL: Block data mutated! Chain integrity broken.', 'error');
        refresh();
    }
}

function setFlag(flag) {
    document.querySelectorAll('.flag-opt').forEach(el => {
        el.classList.toggle('flag-selected', el.dataset.flag === flag);
    });
    document.getElementById('txFlag').value = flag;
}

function switchTab(name) {
    document.querySelectorAll('.tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === name);
    });
    document.querySelectorAll('.tab-pane').forEach(p => {
        p.classList.toggle('active', p.id === `tab-${name}`);
    });

    if (name === 'list') loadEvidenceList();
    if (name === 'audit') loadAuditLog();
}

async function refresh() {
    await Promise.all([loadChain(), loadStats()]);
}

function loadSample() {
    const samples = [
        { id: 'TXN-9921', amt: 500000, s: 'John Doe', r: 'Crypto Exchange', t: 'crypto_tx', d: 'Suspicious crypto purchase after large cash deposit.', f: 'HIGH' },
        { id: 'TXN-4402', amt: 1200000, s: 'Unknown', r: 'Local Business', t: 'cash_deposit', d: 'Structured cash deposits over 3 days.', f: 'MEDIUM' },
        { id: 'TXN-1187', amt: 8500000, s: 'Offshore Ltd', r: 'Real Estate Agent', t: 'wire_transfer', d: 'High value property purchase with offshore funds.', f: 'CRITICAL' }
    ];
    const s = samples[Math.floor(Math.random() * samples.length)];
    
    document.getElementById('txId').value = s.id;
    document.getElementById('txAmount').value = s.amt;
    document.getElementById('txSender').value = s.s;
    document.getElementById('txReceiver').value = s.r;
    document.getElementById('txType').value = s.t;
    document.getElementById('txCase').value = s.d;
    setFlag(s.f);
}

document.addEventListener('DOMContentLoaded', async () => {
    startClock();
    
    document.querySelectorAll('.flag-opt').forEach(el => {
        el.onclick = () => setFlag(el.dataset.flag);
    });

    document.querySelectorAll('.tab').forEach(el => {
        el.onclick = () => switchTab(el.dataset.tab);
    });

    await refresh();
    inspectBlock(0);
    setInterval(loadStats, 5000);
});
