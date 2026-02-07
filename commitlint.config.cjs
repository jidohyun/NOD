/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "style", "refactor", "perf", "test", "build", "ci", "chore"],
    ],
    "scope-enum": [
      2,
      "always",
      ["api", "web", "mobile", "worker", "infra", "deps", "docs", "root"],
    ],
    "scope-empty": [1, "never"],
    "subject-case": [2, "always", "lower-case"],
  },
};
