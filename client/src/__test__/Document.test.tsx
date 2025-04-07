import "@testing-library/jest-dom";
import { render, screen, within, waitFor } from "@testing-library/react";
import Document from "../Document";
import { describe, it, expect } from "vitest";

describe("Document", () => {
  it("renders injected AI suggestions correctly", async () => {
    const fakeIssues = [
      {
        type: "Punctuation",
        severity: "medium",
        paragraph: 1,
        description: "Missing period.",
        suggestion: "Add a period.",
      },
    ];

    render(
      <Document
        content="<p>Hello</p>"
        onContentChange={() => {}}
        injectedIssues={fakeIssues}
      />
    );

    const suggestionList = await screen.findByRole("list");

    setTimeout(() => {
      expect(
        within(suggestionList).getByText((content) =>
          content.includes("Missing period.")
        )
      ).toBeInTheDocument();

      expect(
        within(suggestionList).getByText((content) =>
          content.includes("Add a period.")
        )
      ).toBeInTheDocument();
    }, 1000);
  });
});
