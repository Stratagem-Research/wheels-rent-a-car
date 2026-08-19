import { describe, expect, it } from "vitest";
import {
  addGalleryItem,
  parseVehicleMedia,
  setGalleryItem,
  setMediaSlot,
  toPublicVehicleImages,
} from "./vehicle-media";

describe("parseVehicleMedia", () => {
  it("treats the first untagged image as front and the rest as gallery", () => {
    const parsed = parseVehicleMedia([
      { url: "/front.jpg", alt: "A", width: 1, height: 1 },
      { url: "/g.jpg", alt: "B", width: 1, height: 1 },
    ]);
    expect(parsed.map((item) => item.view)).toEqual(["front", "gallery"]);
  });

  it("keeps explicit views", () => {
    const parsed = parseVehicleMedia([
      { url: "/b.jpg", view: "back" },
      { url: "/f.jpg", view: "front" },
      { url: "/i.jpg", view: "interior" },
    ]);
    expect(parsed.map((item) => item.view)).toEqual(["back", "front", "interior"]);
  });

  it("demotes a second front image to gallery", () => {
    const parsed = parseVehicleMedia([
      { url: "/a.jpg", view: "front" },
      { url: "/b.jpg", view: "front" },
    ]);
    expect(parsed.map((item) => item.view)).toEqual(["front", "gallery"]);
  });
});

describe("media slot helpers", () => {
  it("replaces and clears singleton views", () => {
    let media = parseVehicleMedia([{ url: "/old.jpg", view: "front" }]);
    media = setMediaSlot(media, "front", {
      url: "/new.jpg",
      alt: "Front",
      width: 10,
      height: 10,
    });
    expect(media.find((item) => item.view === "front")?.url).toBe("/new.jpg");
    media = setMediaSlot(media, "front", null);
    expect(media.find((item) => item.view === "front")).toBeUndefined();
  });

  it("adds and removes gallery items", () => {
    let media = addGalleryItem([], { url: "/g1.jpg", alt: "G", width: 1, height: 1 });
    media = addGalleryItem(media, { url: "/g2.jpg", alt: "G", width: 1, height: 1 });
    media = setGalleryItem(media, 0, null);
    expect(media.map((item) => item.url)).toEqual(["/g2.jpg"]);
  });

  it("orders public images front → back → interior → gallery", () => {
    const images = toPublicVehicleImages(
      parseVehicleMedia([
        { url: "/g.jpg", view: "gallery" },
        { url: "/i.jpg", view: "interior" },
        { url: "/f.jpg", view: "front" },
        { url: "/b.jpg", view: "back" },
      ]),
    );
    expect(images.map((item) => item.url)).toEqual(["/f.jpg", "/b.jpg", "/i.jpg", "/g.jpg"]);
  });
});
