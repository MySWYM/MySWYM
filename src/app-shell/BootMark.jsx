import { LOGO_BOOT_MARK } from "../lib/brand.js";

/** Logo fixe pendant la préparation de plan (plus de GIF). */
export default function BootMark() {
  return (
    <div className="myswym-boot-stage" aria-hidden="true">
      <img
        className="myswym-boot-still"
        src={LOGO_BOOT_MARK}
        alt=""
        width={200}
        height={200}
      />
    </div>
  );
}
