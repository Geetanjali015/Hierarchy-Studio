const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const USER_ID = "geetanjali_015";
const EMAIL_ID = "gp0738@srmist.edu.in";
const COLLEGE_ROLL = "RA2311003010017";
const EDGE_PATTERN = /^[A-Z]->[A-Z]$/;

function normalizeEntry(rawEntry) {
  if (typeof rawEntry === "string") {
    return rawEntry.trim();
  }

  if (rawEntry === null || rawEntry === undefined) {
    return "";
  }

  return String(rawEntry).trim();
}

function isValidEdge(entry) {
  if (!EDGE_PATTERN.test(entry)) {
    return false;
  }

  const [parent, child] = entry.split("->");
  return parent !== child;
}

function parseInput(entries) {
  const validEdges = [];
  const invalidEntries = [];
  const duplicateEdges = [];
  const seenEdges = new Set();

  for (const rawEntry of entries) {
    const entry = normalizeEntry(rawEntry);

    if (!isValidEdge(entry)) {
      invalidEntries.push(entry);
      continue;
    }

    if (seenEdges.has(entry)) {
      duplicateEdges.push(entry);
      continue;
    }

    seenEdges.add(entry);
    validEdges.push(entry.split("->"));
  }

  return { validEdges, invalidEntries, duplicateEdges };
}

function buildGraph(edges) {
  const nodes = new Set();
  const undirected = new Map();
  const directedChildren = new Map();
  const indegree = new Map();

  const ensureNode = (node) => {
    nodes.add(node);

    if (!undirected.has(node)) {
      undirected.set(node, new Set());
    }

    if (!directedChildren.has(node)) {
      directedChildren.set(node, []);
    }

    if (!indegree.has(node)) {
      indegree.set(node, 0);
    }
  };

  for (const [parent, child] of edges) {
    ensureNode(parent);
    ensureNode(child);

    undirected.get(parent).add(child);
    undirected.get(child).add(parent);
    directedChildren.get(parent).push(child);
    indegree.set(child, indegree.get(child) + 1);
  }

  for (const [node, children] of directedChildren.entries()) {
    children.sort();
    directedChildren.set(node, children);
  }

  return { nodes, undirected, directedChildren, indegree };
}

function getComponents(graph) {
  const components = [];
  const visited = new Set();

  for (const node of graph.nodes) {
    if (visited.has(node)) {
      continue;
    }

    const stack = [node];
    const componentNodes = [];
    visited.add(node);

    while (stack.length > 0) {
      const current = stack.pop();
      componentNodes.push(current);

      for (const neighbor of graph.undirected.get(current) || []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          stack.push(neighbor);
        }
      }
    }

    componentNodes.sort();
    components.push(componentNodes);
  }

  return components;
}

function detectCycle(componentNodes, directedChildren) {
  const componentSet = new Set(componentNodes);
  const visiting = new Set();
  const visited = new Set();

  function dfs(node) {
    if (visiting.has(node)) {
      return true;
    }

    if (visited.has(node)) {
      return false;
    }

    visiting.add(node);

    for (const child of directedChildren.get(node) || []) {
      if (!componentSet.has(child)) {
        continue;
      }

      if (dfs(child)) {
        return true;
      }
    }

    visiting.delete(node);
    visited.add(node);
    return false;
  }

  for (const node of componentNodes) {
    if (dfs(node)) {
      return true;
    }
  }

  return false;
}

function buildHierarchyTree(node, directedChildren, componentSet, trail = new Set()) {
  const subtree = {};
  const nextTrail = new Set(trail);
  nextTrail.add(node);

  for (const child of directedChildren.get(node) || []) {
    if (!componentSet.has(child) || nextTrail.has(child)) {
      continue;
    }

    subtree[child] = buildHierarchyTree(child, directedChildren, componentSet, nextTrail);
  }

  return subtree;
}

function calculateDepth(node, directedChildren, componentSet, memo = new Map(), trail = new Set()) {
  const memoKey = `${node}:${[...trail].sort().join("")}`;
  if (memo.has(memoKey)) {
    return memo.get(memoKey);
  }

  const nextTrail = new Set(trail);
  nextTrail.add(node);

  const childDepths = (directedChildren.get(node) || [])
    .filter((child) => componentSet.has(child) && !nextTrail.has(child))
    .map((child) => calculateDepth(child, directedChildren, componentSet, memo, nextTrail));

  const depth = childDepths.length === 0 ? 1 : 1 + Math.max(...childDepths);
  memo.set(memoKey, depth);
  return depth;
}

function processData(entries) {
  const { validEdges, invalidEntries, duplicateEdges } = parseInput(entries);
  const graph = buildGraph(validEdges);
  const components = getComponents(graph);

  const hierarchies = [];
  let totalTrees = 0;
  let totalCycles = 0;
  let largestDepth = 0;
  let largestRoot = "";

  for (const componentNodes of components) {
    const componentSet = new Set(componentNodes);
    const roots = componentNodes.filter((node) => (graph.indegree.get(node) || 0) === 0);
    const root = roots[0] || componentNodes[0];
    const hasCycle = detectCycle(componentNodes, graph.directedChildren);

    if (hasCycle) {
      totalCycles += 1;
      hierarchies.push({
        root,
        roots,
        tree: {},
        has_cycle: true,
        node_count: componentNodes.length,
      });
      continue;
    }

    totalTrees += 1;

    const tree = roots.length > 0
      ? Object.fromEntries(
          roots.map((treeRoot) => [
            treeRoot,
            buildHierarchyTree(treeRoot, graph.directedChildren, componentSet),
          ]),
        )
      : {
          [root]: buildHierarchyTree(root, graph.directedChildren, componentSet),
        };

    const depthCandidates = (roots.length > 0 ? roots : [root]).map((treeRoot) =>
      calculateDepth(treeRoot, graph.directedChildren, componentSet),
    );
    const depth = Math.max(...depthCandidates);

    if (depth > largestDepth || (depth === largestDepth && root < largestRoot)) {
      largestDepth = depth;
      largestRoot = root;
    }

    hierarchies.push({
      root,
      roots,
      tree,
      depth,
      has_cycle: false,
      node_count: componentNodes.length,
    });
  }

  hierarchies.sort((left, right) => {
    if (left.has_cycle !== right.has_cycle) {
      return left.has_cycle ? 1 : -1;
    }

    return left.root.localeCompare(right.root);
  });

  return {
    user_id: USER_ID,
    email_id: EMAIL_ID,
    college_roll_number: COLLEGE_ROLL,
    hierarchies,
    invalid_entries: invalidEntries,
    duplicate_edges: duplicateEdges,
    summary: {
      total_trees: totalTrees,
      total_cycles: totalCycles,
      largest_tree_root: largestRoot,
    },
  };
}

app.get("/", (_req, res) => {
  res.json({
    message: "BFHL API is running",
    endpoint: "/bfhl",
    method: "POST",
  });
});

app.post("/bfhl", (req, res) => {
  const { data } = req.body || {};

  if (!Array.isArray(data)) {
    return res.status(400).json({
      error: "Request body must include a 'data' array.",
      example: {
        data: ["A->B", "A->C", "B->D"],
      },
    });
  }

  return res.status(200).json(processData(data));
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = {
  app,
  processData,
  parseInput,
};
