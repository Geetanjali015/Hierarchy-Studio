# Hierarchy-Studio

> A REST API + frontend for parsing hierarchical node relationships, detecting cycles, and visualizing tree structures — built for the SRM Full Stack Engineering Challenge.

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)
![Status](https://img.shields.io/badge/Status-Live-brightgreen?style=flat-square)

---

## 🔗 Live Links

| Resource | URL |
|----------|-----|
| 🌐 Frontend | `https://your-frontend-url.vercel.app` |
| ⚡ API Base URL | `https://your-api-url.render.com` |
| 📁 GitHub Repo | `https://github.com/yourusername/HierarchyStudio-api` |

---

## 📌 What It Does

HierarchyStudio takes an array of `"Parent->Child"` edge strings and:

- ✅ Validates each entry against strict formatting rules
- 🌳 Builds independent tree hierarchies from valid edges
- 🔁 Detects cycles and flags them separately
- 📊 Returns structured metadata — depth, roots, summaries
- ❌ Catches invalid entries and duplicate edges

---

## 📂 Project Structure

```
HierarchyStudio-api/
├── server/
│   ├── index.js          # Express server entry point
│   ├── routes/
│   │   └── bfhl.js       # POST /bfhl route handler
│   └── utils/
│       ├── validator.js  # Input validation logic
│       ├── treeBuilder.js # Tree construction & cycle detection
│       └── summarize.js  # Summary computation
├── client/
│   ├── index.html        # Frontend SPA
│   ├── style.css         # Styles
│   └── app.js            # API call + response rendering
├── .env.example
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/HierarchyStudio-api.git
cd HierarchyStudio-api

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
```

### Running Locally

```bash
# Start the API server (default: http://localhost:3000)
npm start

# Development mode with hot reload
npm run dev
```

Open `client/index.html` in your browser or serve it with any static server.

---

## 📡 API Reference

### `POST /bfhl`

**Content-Type:** `application/json`

#### Request Body

```json
{
  "data": ["A->B", "A->C", "B->D", "X->Y", "Y->Z", "Z->X", "hello", "1->2"]
}
```

#### Response

```json
{
  "user_id": "johndoe_17091999",
  "email_id": "john.doe@college.edu",
  "college_roll_number": "21CS1001",
  "hierarchies": [
    {
      "root": "A",
      "tree": { "A": { "B": { "D": {} }, "C": {} } },
      "depth": 3
    },
    {
      "root": "X",
      "tree": {},
      "has_cycle": true
    }
  ],
  "invalid_entries": ["hello", "1->2"],
  "duplicate_edges": [],
  "summary": {
    "total_trees": 1,
    "total_cycles": 1,
    "largest_tree_root": "A"
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | `string` | `fullname_ddmmyyyy` format |
| `email_id` | `string` | College email |
| `college_roll_number` | `string` | College roll number |
| `hierarchies` | `array` | Array of tree/cycle objects |
| `invalid_entries` | `string[]` | Malformed or invalid inputs |
| `duplicate_edges` | `string[]` | Repeated edges (first kept, rest listed here) |
| `summary` | `object` | `total_trees`, `total_cycles`, `largest_tree_root` |

---

## 🧠 Processing Logic

### Valid Entry Rules

An entry is **valid** only if it matches `X->Y` where both `X` and `Y` are **single uppercase letters (A–Z)**.

| Input | Status | Reason |
|-------|--------|--------|
| `"A->B"` | ✅ Valid | Correct format |
| `"hello"` | ❌ Invalid | Not a node format |
| `"1->2"` | ❌ Invalid | Not uppercase letters |
| `"AB->C"` | ❌ Invalid | Multi-character parent |
| `"A->"` | ❌ Invalid | Missing child |
| `"A->A"` | ❌ Invalid | Self-loop |
| `" A->B "` | ✅ Valid | Trimmed before validation |

### Tree Construction

- A **root** is any node that never appears as a child in any valid edge.
- In the **diamond/multi-parent** case, the first-encountered parent edge wins.
- **Pure cycles** (no natural root) use the lexicographically smallest node as root.

### Cycle Detection

- If a group contains a cycle → `has_cycle: true`, `tree: {}`, no `depth` field.
- Non-cyclic trees omit `has_cycle` entirely (not returned as `false`).

### Depth Calculation

Depth = number of nodes on the **longest root-to-leaf path**.

```
A -> B -> C   →   depth: 3
```

### Summary Tiebreaker

When two trees share the same maximum depth, `largest_tree_root` is the **lexicographically smaller** root.

---

## 🖥️ Frontend

The frontend is a single-page app that:

- Accepts comma-separated or newline-separated node strings
- Calls `POST /bfhl` on submit
- Renders the response as an interactive tree view with color-coded valid/invalid/cycle indicators
- Shows a user-friendly error banner on API failure

---

## ⚙️ Environment Variables

```env
PORT=3000
USER_ID=johndoe_17091999
EMAIL_ID=john.doe@college.edu
COLLEGE_ROLL_NUMBER=21CS1001
```

---

## 🧪 Testing

```bash
# Run test suite
npm test

# Quick manual test with curl
curl -X POST http://localhost:3000/bfhl \
  -H "Content-Type: application/json" \
  -d '{"data": ["A->B", "A->C", "B->D", "X->Y", "Y->Z", "Z->X", "hello"]}'
```

---

## 📋 Checklist

- [x] `POST /bfhl` endpoint implemented
- [x] Input validation with all edge cases
- [x] Duplicate edge detection
- [x] Multi-tree support
- [x] Cycle detection
- [x] Depth calculation
- [x] Summary object with tiebreaker logic
- [x] CORS enabled
- [x] Responds in < 3 seconds for 50-node inputs
- [x] Frontend with structured response display
- [x] Hosted and publicly accessible

---



