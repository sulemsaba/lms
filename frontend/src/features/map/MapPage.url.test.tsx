/** @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import MapPage from "@/features/map/MapPage";

vi.mock("@/services/api/venuesApi", () => ({
  fetchVenues: vi.fn(async () => ({ venues: [], source: "fallback" as const }))
}));

vi.mock("@/components/map/LeafletMap", () => ({
  default: ({ onSelectEntity }: { onSelectEntity: (entity: { type: "location"; id: string }) => void }) => (
    <button type="button" onClick={() => onSelectEntity({ type: "location", id: "main-gate-sam-nujoma" })}>
      Select Main Gate
    </button>
  )
}));

vi.mock("@/components/map/RouteDisplay", () => ({
  default: () => <div>Route Display</div>
}));

describe("MapPage URL state", () => {
  it("keeps q and focus in URL and restores state through back navigation", async () => {
    const router = createMemoryRouter(
      [{ path: "/map", element: <MapPage /> }],
      { initialEntries: ["/map?q=first"] }
    );

    render(<RouterProvider router={router} />);

    const queryInput = await screen.findByLabelText("Search campus map entities");
    expect(queryInput).toHaveValue("first");

    fireEvent.change(queryInput, { target: { value: "second" } });
    await waitFor(() => {
      expect(router.state.location.search).toContain("q=second");
    });

    fireEvent.click(screen.getByRole("button", { name: "Select Main Gate" }));
    await waitFor(() => {
      expect(router.state.location.search).toContain("focus=location%3Amain-gate-sam-nujoma");
    });

    await act(async () => {
      await router.navigate(-1);
    });
    expect(router.state.location.search).toContain("q=second");
    expect(router.state.location.search).not.toContain("focus=");

    await act(async () => {
      await router.navigate(-1);
    });
    expect(router.state.location.search).toContain("q=second");
  });
});
