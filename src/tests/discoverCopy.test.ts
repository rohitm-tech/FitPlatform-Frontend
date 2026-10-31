import { describe, expect, it } from "vitest";
import { findingLine, priceUnitLabel, widerRadius } from "../pages/discover/catalog";

describe("near you copy", () => {
  it("builds the finding from the count, and keeps zero plural", () => {
    expect(findingLine(6, "coach", 8, "Bengaluru")).toBe(
      "6 coaches inside 8 km of Bengaluru.",
    );
    expect(findingLine(1, "cricket", 5, "you")).toBe(
      "1 cricket ground inside 5 km of you.",
    );
    expect(findingLine(0, "pool", 2, "Bengaluru")).toBe(
      "0 pools inside 2 km of Bengaluru.",
    );
    expect(findingLine(1, "box", 8, "HSR Layout")).toBe(
      "1 HYROX or CrossFit box inside 8 km of HSR Layout.",
    );
    expect(findingLine(3, "wall", 15, "you")).toBe(
      "3 climbing walls inside 15 km of you.",
    );
  });

  it("labels class and monthly venue prices", () => {
    expect(priceUnitLabel("class")).toBe("per class");
    expect(priceUnitLabel("month")).toBe("per month");
  });

  it("widens only to a radius that can include the nearest place", () => {
    expect(widerRadius(8, 5.1)).toBe(15);
    expect(widerRadius(2, 5.1)).toBe(8);
    expect(widerRadius(25, 40)).toBe(null);
  });
});
