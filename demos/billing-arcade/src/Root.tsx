import { Composition } from "remotion";
import { BillingArcade } from "./BillingArcade";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="BillingArcade"
        component={BillingArcade}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{}}
      />
      <Composition
        id="BillingArcade-Story"
        component={BillingArcade}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{}}
      />
    </>
  );
};
