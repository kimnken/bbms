const crypto = require('crypto');

class Block {
    constructor(index, timestamp, data, previousHash = '', nonce = 0) {
        this.index = index;
        this.timestamp = timestamp;
        this.data = data;
        this.previousHash = previousHash;
        this.nonce = nonce;
        this.hash = this.calculateHash();
    }

    calculateHash() {
        return crypto
            .createHash('sha256')
            .update(
                this.index +
                this.timestamp +
                JSON.stringify(this.data) +
                this.previousHash +
                this.nonce
            )
            .digest('hex');
    }

    mine(difficulty) {
        const target = '0'.repeat(difficulty);
        while (this.hash.substring(0, difficulty) !== target) {
            this.nonce++;
            this.hash = this.calculateHash();
        }
    }

    toJSON() {
        return {
            index: this.index,
            timestamp: this.timestamp,
            data: this.data,
            previousHash: this.previousHash,
            nonce: this.nonce,
            hash: this.hash
        };
    }
}

class Blockchain {
    constructor(difficulty = 2) {
        this.chain = [];
        this.difficulty = difficulty;
        this.auditLog = [];
        this.tamperAttempts = 0;
        
        // Create genesis block
        this._createGenesisBlock();
        
        // Seed with initial records
        this._seedInitialRecords();
    }

    _createGenesisBlock() {
        const genesisData = {
            type: 'GENESIS',
            message: 'BBMS Blockchain Initialized',
            author: 'Nken Sharon Kim',
            version: '1.0.0'
        };
        const genesisBlock = new Block(0, new Date().toISOString(), genesisData, '0'.repeat(64));
        genesisBlock.mine(this.difficulty);
        this.chain.push(genesisBlock);
        this._audit('GENESIS', 'SYSTEM', 'Genesis block created and mined.');
    }

    _seedInitialRecords() {
        this.addEvidence({
            txId: 'TXN-2024-00101',
            type: 'cash_deposit',
            amount: 4500000,
            sender: 'Unknown',
            receiver: 'Local Account A',
            flagLevel: 'HIGH',
            description: 'Multiple rapid cash deposits below reporting threshold — structuring suspected.'
        }, 'SYSTEM_SEED');

        this.addEvidence({
            txId: 'TXN-2024-00288',
            type: 'wire_transfer',
            amount: 12750000,
            sender: 'Offshore Corp X',
            receiver: 'Local Shell Co Y',
            flagLevel: 'CRITICAL',
            description: 'Wire transfer to offshore account linked to shell company with no declared business activity.'
        }, 'SYSTEM_SEED');
    }

    addEvidence(evidenceData, investigatorId) {
        const sealedData = {
            ...evidenceData,
            sealedBy: investigatorId,
            sealedAt: new Date().toISOString()
        };
        
        const previousBlock = this.chain[this.chain.length - 1];
        const newBlock = new Block(
            this.chain.length,
            new Date().toISOString(),
            sealedData,
            previousBlock.hash
        );
        
        newBlock.mine(this.difficulty);
        this.chain.push(newBlock);
        this._audit('SEAL', investigatorId, `Evidence ${evidenceData.txId} sealed to block ${newBlock.index}`);
        return newBlock;
    }

    validateChain() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            // Check if hash is correct
            const recomputedHash = new Block(
                currentBlock.index,
                currentBlock.timestamp,
                currentBlock.data,
                currentBlock.previousHash,
                currentBlock.nonce
            ).calculateHash();

            if (currentBlock.hash !== recomputedHash) {
                this._audit('TAMPER_DETECTED', 'SYSTEM', `Hash mismatch at block ${i}`);
                return { valid: false, blockIndex: i, reason: 'Hash mismatch' };
            }

            // Check if link is correct
            if (currentBlock.previousHash !== previousBlock.hash) {
                this._audit('TAMPER_DETECTED', 'SYSTEM', `Chain link broken at block ${i}`);
                return { valid: false, blockIndex: i, reason: 'Previous hash mismatch' };
            }
        }
        return { valid: true, blocks: this.chain.length };
    }

    findByTxId(txId) {
        return this.chain.find(block => block.data && block.data.txId === txId);
    }

    verifyRecord(txId, investigatorId) {
        const block = this.findByTxId(txId);
        if (!block) {
            this._audit('VERIFY_FAIL', investigatorId, `Record ${txId} not found`);
            return { found: false, valid: false };
        }

        const recomputedHash = new Block(
            block.index,
            block.timestamp,
            block.data,
            block.previousHash,
            block.nonce
        ).calculateHash();

        const isValid = block.hash === recomputedHash;
        if (isValid) {
            this._audit('VERIFY_OK', investigatorId, `Record ${txId} verified successfully`);
        } else {
            this._audit('VERIFY_FAIL', investigatorId, `Record ${txId} verification failed (tampered)`);
        }

        return { found: true, valid: isValid, block: block.toJSON() };
    }

    tamperBlock(blockIndex, field, newValue, actorId) {
        if (blockIndex < 0 || blockIndex >= this.chain.length) return false;
        
        const block = this.chain[blockIndex];
        block.data[field] = newValue;
        this.tamperAttempts++;
        this._audit('TAMPER', actorId, `Block ${blockIndex} field '${field}' mutated to '${newValue}'`);
        return true;
    }

    getStats() {
        const validation = this.validateChain();
        return {
            totalBlocks: this.chain.length,
            evidenceRecords: this.chain.filter(b => b.data && b.data.txId).length,
            chainValid: validation.valid,
            tamperAttempts: this.tamperAttempts
        };
    }

    getAuditLog() {
        return [...this.auditLog].reverse();
    }

    getAllChain() {
        return this.chain.map(b => b.toJSON());
    }

    _audit(type, actor, message) {
        this.auditLog.push({
            id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
            timestamp: new Date().toISOString(),
            type,
            actor,
            message
        });
    }
}

module.exports = { Block, Blockchain };
