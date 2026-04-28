import { nextTick } from "vue";
import { mount, VueWrapper } from "@vue/test-utils";

import AlmaIcon from "@/components/icons/AlmaIcon.vue";

import IntroCover from "./IntroCover.vue";

const getIntroIcons = <T>(wrapper: VueWrapper<T>) => {
  return wrapper.findAllComponents(AlmaIcon);
};

describe("IntroCover", () => {
  describe("elements", () => {
    test("should render description", async () => {
      const expectedDescriptionValue = "Some Description";

      const wrapper = mount(IntroCover, {
        props: {
          description: expectedDescriptionValue,
        },
      });

      await nextTick();

      const description = wrapper.find(".ui-main-intro__description");
      const descriptionValue = description.text();

      expect(descriptionValue).toBe(expectedDescriptionValue);
      expect(descriptionValue).toMatchInlineSnapshot(`"Some Description"`);
    });

    test("should render icon grid", async () => {
      const wrapper = mount(IntroCover);

      await nextTick();

      const icons = getIntroIcons(wrapper);

      expect(icons.length).toBe(21);
      expect(icons.length).toMatchInlineSnapshot(`21`);
    });

    test("should render secondary icon tone", async () => {
      const wrapper = mount(IntroCover);

      await nextTick();

      const icons = getIntroIcons(wrapper);

      expect(icons[0].props("tone")).toBe("secondary");
      expect(icons[0].props("tone")).toMatchInlineSnapshot(`"secondary"`);
    });
  });
});
