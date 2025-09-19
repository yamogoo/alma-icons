import { iconNames, iconStyles, iconWeights } from "alma-icons";

export type IconName = (typeof iconNames)[number];

export type IconStyle = (typeof iconStyles)[number];

export type IconWeight = (typeof iconWeights)[number];

export interface IconProps {
  name: IconName;
  style: IconStyle;
  weight: IconWeight;
}

export * from "alma-icons";
