"use client";

import { useState } from "react";
import FeaturedProductsResultPage from "./FeaturedProductsResultPage";

const PAGE_SIZE = 12;

export function FeaturedProductsScroll() {
  const [pageVariables, setPageVariables] = useState([
    { first: PAGE_SIZE, after: undefined as string | undefined },
  ]);

  const loadMoreHandler = (after: string) => {
    setPageVariables((prev) => [...prev, { first: PAGE_SIZE, after }]);
  };

  return (
    <section>
      {pageVariables.map((variable, i) => (
        <FeaturedProductsResultPage
          key={String(variable.after ?? "initial")}
          variables={variable}
          isLastPage={i === pageVariables.length - 1}
          onLoadMore={loadMoreHandler}
        />
      ))}
    </section>
  );
}

export default FeaturedProductsScroll;
