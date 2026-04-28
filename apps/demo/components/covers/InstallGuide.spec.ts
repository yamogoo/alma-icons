import { mount, VueWrapper } from "@vue/test-utils";
import { setMatchMedia } from "~/vitest.setup";

import InstallGuide, { type LinkData, type Props } from "./InstallGuide.vue";
import { createPinia, setActivePinia } from "pinia";

const getBoxedLink = <T>(wrapper: VueWrapper<T>) => {
  return wrapper.findAll(`[data-testid="boxed-link"]`);
};

const getTitle = <T>(wrapper: VueWrapper<T>) => {
  return wrapper.find(".ui-main-guide__title");
};

const REQUIRED_PROPS: Props = {
  links: [],
};

const LINKS: Array<LinkData> = [
  {
    name: "Link 1",
    url: "https://example.com/link1",
  },
  {
    name: "Link 2",
    url: "https://example.com/link2",
  },
];

describe("InstallGuide", () => {
  const pinia = createPinia();
  setActivePinia(pinia);

  beforeEach(() => {
    setMatchMedia();
  });

  describe("elements", () => {
    test("should render BoxedLink component(s)", () => {
      const wrapper = mount(InstallGuide, {
        props: { ...REQUIRED_PROPS, links: LINKS },
      });

      const boxedLinks = getBoxedLink(wrapper);
      expect(boxedLinks[0].exists()).toBeTruthy();
      expect(boxedLinks.length).toBe(LINKS.length);
    });

    test("should render title", () => {
      const expectedTitle = "Install";

      const wrapper = mount(InstallGuide, {
        props: { ...REQUIRED_PROPS, title: expectedTitle },
      });

      const title = getTitle(wrapper);

      expect(title.exists()).toBeTruthy();
      expect(title.text()).toBe(expectedTitle);
      expect(title.text()).toMatchInlineSnapshot(`"Install"`);
    });
  });

  describe("slots", () => {
    test("should render controls slot (name)", async () => {
      const expectedSlotValue = "Slot Content";
      const expectedSlot = `<div class="slot">${expectedSlotValue}</div>`;

      const wrapper = mount(InstallGuide, {
        slots: {
          controls: expectedSlot,
        },
      });

      await vi.dynamicImportSettled();

      const slot = wrapper.find(".slot");
      const isSlotExists = slot.exists();

      const slotValue = slot.text();

      expect(isSlotExists).toBeTruthy();
      expect(slotValue).toBe(expectedSlotValue);
      expect(slotValue).toMatchInlineSnapshot(`"Slot Content"`);
    });
  });
});
