import { hexToRgba } from "./helpers.js";

export const setFillColor = (colors, opacity) => {
  return (program, data) => {
    const bull = hexToRgba(colors.bull);
    bull[3] = opacity;
    const bear = hexToRgba(colors.bear);
    bear[3] = opacity;
    fc
      .webglFillColor()
      .value((d) => {
        if (d.close >= d.open) {
          return bull;
        } else {
          return bear;
        }
      })
      .data(data)(program);
  };
};

// Here is some hacky CSS to make the OHLC and Volume chart stick so closely to each other
export function specialgrid(sel) {
  return sel.each(function () {
    const self = d3.select(this);
    self.style("display", "grid");
    self.style("display", "-ms-grid");
    self.style(
      "grid-template-columns",
      "minmax(0em,max-content) 0fr 1fr 0fr minmax(0em,max-content)",
    );
    self.style(
      "-ms-grid-columns",
      "minmax(0em,max-content) 0fr 1fr 0fr minmax(0em,max-content)",
    );
    self.style(
      "grid-template-rows",
      "minmax(0em,max-content) 0fr 1fr 0fr minmax(0em,max-content)",
    );
    self.style(
      "-ms-grid-rows",
      "minmax(0em,max-content) 0fr 1fr 0fr minmax(0em,max-content)",
    );
  });
}

export function flatgrid(sel) {
  return sel.each(function () {
    const self = d3.select(this);
    self.style(
      "grid-template-rows",
      "minmax(0em, max-content) 0fr 0fr 0fr minmax(0em, max-content)",
    );
    self.style(
      "-ms-grid-rows",
      "minmax(0em, 0em) 0fr 0fr 0fr minmax(0em, 0em)",
    );
  });
}

export function attr(k, v) {
  return function (sel) {
    return sel.each(function () {
      const self = d3.select(this);
      self.style(k, v);
    });
  };
}

export const displayNone = attr("display", "none");
export const displayBlock = attr("display", "block");

export function disablePane(id) {
  d3.selectAll(`${id} .plot-area`).call(displayNone);
  d3.selectAll(`${id} .cartesian-chart`).call(flatgrid);
  d3.selectAll(`${id}`).call(attr("flex", "0"));
}

export function enablePane(id) {
  d3.selectAll(`${id} .plot-area`).call(displayBlock);
  d3.selectAll(`${id} .cartesian-chart`).call(specialgrid);
  d3.selectAll(`${id}`).call(attr("flex", "1"));
}
