# BBMS — Blockchain-Based Evidence Management

**Blockchain-Based Model for Securing Financial Evidence in Anti-Money Laundering Investigations**

A full-stack Node.js web application that implements a working blockchain to store, seal, verify, and audit digital financial evidence for AML (Anti-Money Laundering) investigations.

## 🚀 Quick Start

This project has **zero dependencies** and requires only Node.js to be installed.

1. Clone the repository:
   ```bash
   git clone https://github.com/kimnken/bbms.git
   cd bbms
   ```

2. Start the server:
   ```bash
   node src/server.js
   ```

3. Open your browser and navigate to:
   `http://localhost:3000`

## 🛠️ Features

- **Custom Blockchain Engine:** Built from scratch using Node.js `crypto` module.
- **Proof of Work:** Implements a mining mechanism to secure blocks.
- **Tamper Detection:** SHA-256 hash chain ensures any modification is immediately detectable.
- **Audit Logging:** Every action is recorded in a transparent, non-reversible log.
- **REST API:** Clean backend API for evidence management and chain verification.
- **Cybersecurity UI:** Modern, dark-themed dashboard for investigators.

## 📂 Project Structure

```text
bbms/
├── src/
│   ├── blockchain.js     ← Core blockchain engine
│   └── server.js         ← HTTP server + REST API router
├── public/
│   ├── index.html        ← Main app UI
│   ├── docs.html         ← Technical documentation
│   ├── about.html        ← Project info & author page
│   ├── css/
│   │   └── style.css     ← Design system stylesheet
│   └── js/
│       └── app.js        ← Frontend logic & API client
├── package.json
└── README.md
```

## 👩‍💻 Author

**Nken Sharon Kim**  
Matric No: CYB/22U/3127  
Faculty of Computing  
Nigerian Army University Biu

---
*Developed as a Final Year Project to demonstrate the power of Blockchain in digital forensics and AML investigations.*
