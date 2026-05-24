const assert = require("assert");
const { test } = require("node:test");
const { extractCompanyFromText } = require("../src/utils/jobUtils");

test("extractCompanyFromText - Company: pattern", () => {
  const txt = "Company: Acme Corporation\nWe need...";
  const c = extractCompanyFromText(txt);
  assert.strictEqual(c, "Acme Corporation");
});

test("extractCompanyFromText - at pattern", () => {
  const txt = "We are hiring at Globex Inc. for a senior role.";
  const c = extractCompanyFromText(txt);
  assert.strictEqual(c, "Globex Inc");
});

test("extractCompanyFromText - none found", () => {
  const txt = "This is a generic job description with no company mentioned.";
  const c = extractCompanyFromText(txt);
  assert.strictEqual(c, "");
});
