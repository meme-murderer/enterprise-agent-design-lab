import { expect, test } from "@playwright/test";

test("safety acknowledgement gates process entry", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Enterprise Agent Design Lab" }),
  ).toBeVisible();
  await page.getByRole("link", { name: /build my decision record/i }).click();
  await expect(
    page.getByRole("heading", { name: /protect the information/i }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /continue/i })).toBeDisabled();
  await page.getByLabel(/I will use generalized/i).check();
  await page.getByRole("button", { name: /continue/i }).click();
  await expect(
    page.getByRole("heading", { name: /choose the process and the result/i }),
  ).toBeVisible();
});

test("seeded facilitator examples include the controlled detectability pair", async ({
  page,
}) => {
  await page.goto("/facilitator/demo");
  await expect(
    page.getByRole("heading", { name: "Prepared examples" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: /Invoice exception triage \(review before payment\)/i,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: /Invoice exception triage \(supplier complaints\)/i,
    })
    .click();
  await expect(
    page.getByText(/AI prepares; a person decides/i).first(),
  ).toBeVisible();
});

test("participant completes intake and can use the plan before the optional failure check", async ({
  page,
}) => {
  let submittedBody: unknown;
  await page.route("**/api/interview/answer", async (route) => {
    submittedBody = route.request().postDataJSON();
    await route.fulfill({ json: { status: "complete", canvas: mockCanvas() } });
  });
  await page.route("**/api/interview/stress-test", async (route) => {
    await route.fulfill({ json: { stressTests: failureModes } });
  });
  await page.route("**/api/interview/revision", async (route) => {
    await route.fulfill({
      json: {
        coachResponse:
          "The threshold is measurable. Name the person who pauses the experiment and test the rollback before the first case.",
      },
    });
  });
  await page.route("**/api/share", async (route) => {
    await route.fulfill({ json: { shareId: "ABC123" } });
  });

  await page.goto("/lab");
  await page.getByLabel(/I will use generalized/i).check();
  await page.getByRole("button", { name: /continue/i }).click();
  await page
    .getByPlaceholder("Reviewing time-off requests")
    .fill("Vendor onboarding");
  await page
    .getByPlaceholder(/Cut review time/i)
    .fill("Reduce delays while preserving approvals.");
  await page.getByRole("button", { name: /continue/i }).click();

  await page.getByRole("button", { name: "Daily", exact: true }).click();
  await page
    .getByRole("button", { name: "100 to 1,000 per month", exact: true })
    .click();
  await page
    .getByRole("button", { name: "25 to 100 hours", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Most cases are similar, with common exceptions",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Many cases", exact: true }).click();
  await page.getByRole("button", { name: /continue/i }).click();

  await page
    .getByRole("button", {
      name: "Put a case in a category or queue",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Two or three systems", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Usually. A few conditions change the next step.",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: /continue/i }).click();

  await page
    .getByRole("button", { name: "Internal company information", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Documents or messages sent by customers or vendors",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", {
      name: "Internal rework only",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: /continue/i }).click();

  await page
    .getByRole("button", {
      name: "Yes, but someone must fix records or contact people.",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", {
      name: "A person finds it during review",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", {
      name: "No. Written rules can determine the result.",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: /continue/i }).click();

  await expect(page.getByText("Short answer 1 of 2")).toBeVisible();
  await page
    .getByLabel("Your answer")
    .fill("A reviewer resolves conflicting policy evidence and exceptions.");
  await page.getByRole("button", { name: /next question/i }).click();
  await page
    .getByPlaceholder("Operations manager")
    .fill("Procurement operations lead");
  await page.getByPlaceholder("Department manager").fill("Procurement manager");
  await page
    .getByPlaceholder(/The process owner will stop the test/i)
    .fill(
      "The process owner will stop the test if 2 of 20 results are wrong. Work returns to the current process.",
    );
  await page.getByRole("button", { name: /evaluate my process/i }).click();

  await expect(page.getByText("Limited agent simulation")).toBeVisible();
  const showAll = page.getByRole("button", { name: /show all now/i });
  if (await showAll.isVisible()) await showAll.click();
  await page.getByRole("button", { name: /open my plan/i }).click();
  await expect(page).toHaveURL(/\/canvas$/);
  await expect(
    page.getByRole("button", { name: /copy summary/i }),
  ).toBeEnabled();
  await expect(page.getByRole("button", { name: /print plan/i })).toBeEnabled();
  await expect(
    page.getByRole("button", { name: /open email draft/i }),
  ).toBeEnabled();
  await page.getByLabel(/may be visible on the facilitator/i).check();
  await expect(
    page.getByRole("button", { name: /share anonymously/i }),
  ).toBeEnabled();
  await page.getByRole("button", { name: /share anonymously/i }).click();
  await expect(page.getByText(/discussion code: ABC123/i)).toBeVisible();

  await page.getByRole("button", { name: /show possible failures/i }).click();
  await page
    .getByPlaceholder(/The process owner will stop the test/i)
    .fill(
      "Stop after two false approvals in any 20-case review set and return all cases to the manual queue.",
    );
  await page.getByRole("button", { name: /replace my stop rule/i }).click();
  await expect(
    page.getByText(/may be visible on the facilitator/i),
  ).toBeVisible();
  expect(submittedBody).toMatchObject({
    version: 2,
    turns: [{ answer: expect.any(String) }, { answer: expect.any(String) }],
    governance: {
      ownerRole: "Procurement operations lead",
      approverRole: "Procurement manager",
    },
  });
});

test("poisoned-document demo is deterministic and keyboard controlled", async ({
  page,
}) => {
  await page.goto("/facilitator/injection");
  await expect(page.getByText(/SIMULATED DEMO/i)).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByText(/read_vendor_document/)).toBeVisible();
  for (let index = 0; index < 4; index += 1)
    await page.keyboard.press("ArrowRight");
  await expect(page.getByText(/Ignore previous instructions/)).toBeVisible();
});

test("takeaway is static and printable", async ({ page }) => {
  await page.goto("/takeaway");
  await expect(
    page.getByRole("heading", {
      name: /Who or what should do the work/i,
    }),
  ).toBeVisible();
  await expect(page.getByText(/Give the test its own account/i)).toBeVisible();
  await expect(page.getByText(/We will stop the test if/i)).toBeVisible();
});

test("facilitator can permanently purge shared canvases", async ({ page }) => {
  await page.route("**/api/facilitator/submissions", async (route) => {
    if (route.request().method() === "DELETE") {
      await route.fulfill({ json: { removed: 1 } });
      return;
    }
    await route.fulfill({
      json: { submissions: [sharedCanvas()], storageMode: "firestore" },
    });
  });
  page.on("dialog", (dialog) => dialog.accept());

  await page.goto("/facilitator");
  await page.getByPlaceholder("Facilitator PIN").fill("example-test-pin");
  await page.getByRole("button", { name: /refresh/i }).click();
  await expect(
    page.getByText(/saved in workshop storage until/i),
  ).toBeVisible();
  await page.getByRole("button", { name: /delete all shared plans/i }).click();
  await expect(
    page.getByText("1 shared canvas was permanently deleted."),
  ).toBeVisible();
});

test("facilitator can monitor live model usage without participant content", async ({
  page,
}) => {
  await page.route("**/api/facilitator/usage", async (route) => {
    await route.fulfill({
      json: {
        storageMode: "firestore",
        summary: {
          totalCalls: 126,
          completedCalls: 125,
          failedCalls: 1,
          inputTokens: 180000,
          cachedInputTokens: 0,
          cacheWriteTokens: 0,
          outputTokens: 104610,
          reasoningTokens: 0,
          totalTokens: 284610,
          callsLastMinute: 38,
          tokensLastMinute: 81200,
          averageLatencyMs: 10300,
          p95LatencyMs: 11800,
          firstRecordedAt: "2026-08-27T14:00:00.000Z",
          updatedAt: "2026-08-27T14:10:00.000Z",
          currentLimits: {
            requestLimit: 5000,
            remainingRequests: 4874,
            tokenLimit: 4000000,
            remainingTokens: 3715390,
            observedAt: "2026-08-27T14:09:58.000Z",
          },
          byOperation: [
            {
              operation: "canvas",
              calls: 126,
              failedCalls: 1,
              totalTokens: 284610,
              averageLatencyMs: 10300,
            },
          ],
          recent: [],
        },
      },
    });
  });

  await page.goto("/facilitator/monitor");
  await page.getByPlaceholder("Facilitator PIN").fill("example-test-pin");
  await page.getByRole("button", { name: /start monitor/i }).click();
  await expect(page.getByText("284,610").first()).toBeVisible();
  await expect(page.getByText(/5,000 \/ minute/i)).toBeVisible();
  await expect(
    page.getByText(/does not store participant answers/i),
  ).toBeVisible();
});

const failureModes = [
  {
    scenario: "A submitted document contains a hostile instruction.",
    expectedResponse: "Block the action and escalate.",
    signal: "Attempted action outside the allowlist.",
  },
  {
    scenario: "A recurring classification error begins to accumulate.",
    expectedResponse: "Pause and return to manual review.",
    signal: "Error threshold is crossed.",
  },
];

function mockCanvas() {
  const signals = {
    frequency: "Daily",
    volume: "100-1,000",
    variation: "Minor variations",
    furthestStep: "Classify and route",
    systemsTouched: "Two or three",
    pathVariability: "Sometimes",
    dataClasses: ["Internal only"],
    inputSources: ["Customer or vendor content"],
    blastRadius: "Nobody outside the team",
    reversibility: "Undone with effort",
    detectability: "A person catches it on review",
    humanRequired: "No",
  };
  return {
    version: 2,
    id: "5a2f1449-6ce7-49ab-a7d9-58824ed2b17b",
    createdAt: "2026-08-24T14:05:00.000Z",
    process: {
      name: "Vendor onboarding",
      outcome: "Reduce delays while preserving approvals.",
      businessFunction: "Operations",
    },
    signals,
    rubric: {
      rubricVersion: "2026-08-24",
      recommendation: "Bounded Agentic Pilot",
      matchedRuleId: "bounded-multistep-fit",
      autonomyCeiling: "Bounded",
      triggers: [
        "Multiple systems and a variable path.",
        "Detectable and reversible.",
      ],
      trace: [
        {
          id: "standardized",
          label: "Stable, fixed rules",
          passed: false,
          detail: "Minor variations",
        },
        {
          id: "multiple-systems",
          label: "Multiple systems",
          passed: true,
          detail: "Two or three",
        },
        {
          id: "judgment",
          label: "Variable path or judgment",
          passed: true,
          detail: "Sometimes",
        },
        {
          id: "detectable",
          label: "Errors detectable",
          passed: true,
          detail: "A person catches it on review",
        },
        {
          id: "reversible",
          label: "Effects reversible",
          passed: true,
          detail: "Undone with effort",
        },
      ],
    },
    recommendation: "Bounded Agentic Pilot",
    recommendationSummary:
      "Test a narrow routing loop while a human retains every approval.",
    whyThisFit: [
      "Errors are detected during review.",
      "Every effect can be reversed.",
    ],
    experiment: {
      title: "Vendor routing tabletop",
      duration: "3 weeks",
      scopeIn: ["Synthetic packets", "Draft routes"],
      scopeOut: ["Approvals", "Production access"],
      autonomyBoundary:
        "The pilot proposes a route; a reviewer approves every next step.",
      inputs: ["Synthetic packet"],
      outputs: ["Draft route"],
    },
    humanOversight: {
      ownerRole: "Operations lead",
      approvals: ["Approve every route"],
      reviewCadence: "Every run",
    },
    controls: {
      monitoring: ["Route disagreement", "Policy exceptions"],
      stopConditions: ["Two false approvals", "Sensitive output"],
      rollbackPlan: "Return every item to the existing manual queue.",
      dataBoundaries: ["Synthetic data only", "No connectors"],
      requiredControls: [
        {
          id: "human-review",
          label: "Human review before consequential use",
          reason: "Every route remains a draft.",
        },
      ],
    },
    successMeasures: [
      { metric: "Review time", target: "20% lower" },
      { metric: "Routing precision", target: "90%" },
    ],
    risks: [
      { risk: "Over-trust", mitigation: "Review every output" },
      { risk: "Prompt injection", mitigation: "Treat documents as data" },
    ],
    nextStep:
      "Prepare synthetic cases and measure the current manual baseline.",
    confidence: "High",
  };
}

function sharedCanvas() {
  return {
    shareId: "ABC123",
    sharedAt: "2026-08-24T14:05:00.000Z",
    canvas: mockCanvas(),
  };
}
