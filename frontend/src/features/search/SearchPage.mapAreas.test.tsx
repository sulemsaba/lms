/** @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import SearchPage from "@/features/search/SearchPage";

vi.mock("@/services/db", () => ({
  db: {
    courses: { toArray: vi.fn(async () => []) },
    timetableEvents: { toArray: vi.fn(async () => []) },
    tasks: { toArray: vi.fn(async () => []) },
    notes: { toArray: vi.fn(async () => []) },
    notifications: { toArray: vi.fn(async () => []) },
    venues: { toArray: vi.fn(async () => []) }
  }
}));

describe("SearchPage map areas", () => {
  it("returns map deep-links with q and focus params", async () => {
    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>
    );

    const input = screen.getByLabelText("Global search");
    fireEvent.change(input, { target: { value: "main gate" } });

    await waitFor(() => {
      const mapLinks = screen
        .getAllByRole("link")
        .map((link) => link.getAttribute("href") ?? "")
        .filter((href) => href.startsWith("/map?") && href.includes("focus="));
      expect(mapLinks.length).toBeGreaterThan(0);
      expect(mapLinks.some((href) => href.includes("q=main+gate") || href.includes("q=main%20gate"))).toBe(true);
    });
  });
});
