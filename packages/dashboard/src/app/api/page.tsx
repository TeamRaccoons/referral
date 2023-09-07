"use client";

import * as React from "react";
import { useTheme } from "next-themes";

import "swagger-ui-react/swagger-ui.css";

import dynamic from "next/dynamic";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });
interface IApiPageProps {}

const ApiPage: React.FunctionComponent<IApiPageProps> = (props) => {
  const theme = useTheme();
  const currentTheme = React.useRef(theme.theme);

  // React.useEffect(() => {
  //   theme.setTheme("light");
  //   return () => {
  //     theme.setTheme(currentTheme.current || "system");
  //   };
  // }, []);
  return (
    <div className="w-full">
      <SwaggerUI url="./api.yaml" />
    </div>
  );
};

export default ApiPage;
