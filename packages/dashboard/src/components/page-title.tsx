import * as React from "react";
import { Copy } from "lucide-react";

interface IPageTitleProps {
  title: string;
  referralPubkey: string;
}

const PageTitle: React.FunctionComponent<IPageTitleProps> = ({
  title,
  referralPubkey,
}) => {
  return (
    <>
      <h1 className="text-3xl font-semibold dark:text-[#F2F4F7]">{title}</h1>
      <div className="dark:text-[#98A2B3]">
        Referral Key :{" "}
        <span className="inline-block rounded-full bg-[#1D2939] px-3 py-1 text-sm text-[#98A2B3]">
          <div className="flex items-center justify-center gap-1">
            <span>{referralPubkey}</span>
            <Copy
              className="cursor-pointer hover:opacity-90"
              onClick={() => {
                {
                  navigator.clipboard.writeText(referralPubkey);
                }
              }}
              size={14}
            />
          </div>
        </span>
      </div>
    </>
  );
};

export default PageTitle;
