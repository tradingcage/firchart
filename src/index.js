import { indicators } from "./indicators.js";
import {
  deepCopy,
  generateRandomString,
  hexToRgba,
  round4,
  removeObjectFromArray,
  sameSign,
  getMostCommonDifference,
} from "./helpers.js";
import { LocalStorageObject, DummyObject } from "./localstorage.js";
import {
  svgNS,
  iconoirEyeSvg,
  iconoirXmarkSvg,
  iconoirSettingsSvg,
  iconoirNavArrowDownSvg,
  iconoirNavArrowUpSvg,
  iconoirEditPencilSvg,
  svgToDataURL,
} from "./iconsvg.js";
import {
  setFillColor,
  specialgrid,
  attr,
  displayNone,
  disablePane,
  enablePane,
} from "./display.js";
import { createFormFromObject, createPopup } from "./html.js";

function createWrappedDatum(datum, index, arr) {
  return new Proxy(datum, {
    get(target, prop) {
      let barVal = {};
      if (typeof prop === "string" && !isNaN(prop)) {
        const value = arr[index - Number(prop)];
        if (value != null && !isDummy(value)) {
          barVal = value;
        }
        return createWrappedDatum(barVal, index, arr);
      }
      return target[prop];
    },
  });
}

// Determine whether d2 contains overlap with d1, and is later than d1
// d2 and d1 are two data series, both in ascending order
const isOverlappingAndLater = (d1, d2) => {
  if (d1.length < 2 || d2.length < 0) {
    return false;
  }
  const d1Last = d1[d1.length - 1].date.getTime();
  const isLater = d2[d2.length - 1].date.getTime() - d1Last >= 0;
  if (!isLater) {
    return false;
  }
  for (var i = d2.length - 1; i > 0; i--) {
    if (d2[i].date.getTime() >= d1Last && d2[i - 1].date.getTime() <= d1Last) {
      return true;
    }
  }
  return false;
};

function isDummy(bar) {
  return bar.volume === -1;
}

function genDummyBookends(data) {
  if (!data || data.length == 0) {
    return data;
  }
  const step = getMostCommonDifference(data.map((x) => x.date.getTime()));
  const genDummyBars = (num, firstDate, step) =>
    new Array(num)
      .fill(0)
      .map((_, i) => ({
        date: new Date(firstDate + (i + 1) * step),
        open: 0,
        high: 0,
        low: 0,
        close: 0,
        volume: -1,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  const leftBookend = genDummyBars(50, data[0].date.getTime(), -step, 0);
  const rightBookend = genDummyBars(
    50,
    data[data.length - 1].date.getTime(),
    step,
  );
  return leftBookend.concat(data).concat(rightBookend);
}

// This is the main function that is exposed to the user
function FirChart(chartContainer, userProvidedData, options) {
  let persistedSettings;
  if (options.persistIndicatorState) {
    persistedSettings = new LocalStorageObject("indicator-settings");
  } else {
    persistedSettings = new DummyObject();
  }

  let data = genDummyBookends(userProvidedData).map((datum, index, arr) =>
    createWrappedDatum(datum, index, arr),
  );

  const refreshData = (newData, forceRefresh) => {
    // special case for when the chart should just move to the right instead of resetting the X axis zoom
    let shouldMoveRight = false;
    let step = 0;
    newData = genDummyBookends(newData);
    if (isOverlappingAndLater(data, newData)) {
      shouldMoveRight = true;
      step =
        newData[newData.length - 1].date.getTime() -
        data[data.length - 1].date.getTime();
    }

    data = newData.map((datum, index, arr) =>
      createWrappedDatum(datum, index, arr),
    );
    if (!forceRefresh && shouldMoveRight) {
      moveChartRight(step);
    } else {
      refreshXDomain();
    }
    refreshYDomain();
    refreshVolumeDomain();
    state.indicators.forEach(({ refreshDomain }) => {
      if (refreshDomain) refreshDomain();
    });
    render();
  };

  // Define stateful objects and their member functions

  const modeCursor = "cursor";
  const modePlaceLineInitial = "placeLineInitial";
  const modePlaceLineSecondary = "placeLineSecondary";
  const modeDragLine = "dragLine";

  const state = {
    mode: modeCursor,
    currentBar: null,
    volumeVisible: true,
    indicators: [],
    additionalPanes: [],
    currentPaneId: "#ohlc-chart",
    drawings: [],
  };

  const priceChangeCallbacks = [];

  priceChangeCallbacks.push((bar) => (state.currentBar = bar));

  const mousePos = { x: -1, y: -1 };

  function switchMode(newMode) {
    state.mode = newMode;
    if (
      newMode === modePlaceLineInitial ||
      newMode === modePlaceLineSecondary
    ) {
      if (state.activeDrag) {
        state.activeDrag.drawing.stopMoving();
      }
      d3.select("#ohlc-chart").node().style.cursor = `url("${svgToDataURL(
        iconoirEditPencilSvg,
      )}") 0 24, pointer`;
      d3.select("#volume-chart").node().style.cursor = "not-allowed";
      state.additionalPanes.forEach(({ id }) => {
        d3.select(id).node().style.cursor = "not-allowed";
      });
      return;
    }
    removeActiveLine();

    if (newMode === modeDragLine) {
      d3.select("#ohlc-chart").node().style.cursor = "grabbing";
      return;
    }

    removeActiveLine();
    d3.select("#ohlc-chart").node().style.cursor = "default";
    d3.select("#volume-chart").node().style.cursor = "default";
    state.additionalPanes.forEach(({ id }) => {
      d3.select(id).node().style.cursor = "default";
    });
  }

  // Then we manually create the HTML elements we will need

  var style = document.createElement("style");
  style.type = "text/css";
  style.innerHTML =
    ".info-box-hover-effect:hover { background-color: rgba(0, 0, 0, 0.1); }";
  document.getElementsByTagName("head")[0].appendChild(style);

  const container = document.getElementById(chartContainer);
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.fontSize = "1.2em";

  const ohlcChartElem = document.createElement("div");
  ohlcChartElem.id = "ohlc-chart";
  ohlcChartElem.style.flex = 4;
  container.appendChild(ohlcChartElem);

  const volumeChartElem = document.createElement("div");
  volumeChartElem.id = "volume-chart";
  volumeChartElem.style.flex = 1;
  container.appendChild(volumeChartElem);

  // Create the infobox

  const infoBoxElem = document.createElement("div");
  infoBoxElem.id = "info-box";
  infoBoxElem.style.position = "absolute";
  infoBoxElem.style.padding = "0.4em 0.6em 0.4em 0.4em";
  infoBoxElem.style.backgroundColor = "#eee";
  infoBoxElem.style.userSelect = "none";
  infoBoxElem.style.width = "24rem";
  infoBoxElem.style.fontSize = "0.9rem";
  infoBoxElem.style.zIndex = "1";
  container.appendChild(infoBoxElem);

  const ohlcRowElem = document.createElement("div");
  ohlcRowElem.style.display = "flex";
  ohlcRowElem.style.alignItems = "center";

  const ohlcBoxElem = document.createElement("div");
  ohlcBoxElem.style.padding = "0.3em";

  const ohlcElements = {
    open: document.createElement("span"),
    high: document.createElement("span"),
    low: document.createElement("span"),
    close: document.createElement("span"),
  };

  priceChangeCallbacks.push((bar) => {
    ohlcElements.open.innerHTML = bar.open;
    ohlcElements.high.innerHTML = bar.high;
    ohlcElements.low.innerHTML = bar.low;
    ohlcElements.close.innerHTML = bar.close;
  });

  const openLabel = document.createElement("span");
  openLabel.innerHTML = "O: ";
  const highLabel = document.createElement("span");
  highLabel.innerHTML = " H: ";
  const lowLabel = document.createElement("span");
  lowLabel.innerHTML = " L: ";
  const closeLabel = document.createElement("span");
  closeLabel.innerHTML = " C: ";

  ohlcElements.open.style.fontWeight = "bold";
  ohlcElements.high.style.fontWeight = "bold";
  ohlcElements.low.style.fontWeight = "bold";
  ohlcElements.close.style.fontWeight = "bold";

  ohlcBoxElem.appendChild(openLabel);
  ohlcBoxElem.appendChild(ohlcElements.open);
  ohlcBoxElem.appendChild(highLabel);
  ohlcBoxElem.appendChild(ohlcElements.high);
  ohlcBoxElem.appendChild(lowLabel);
  ohlcBoxElem.appendChild(ohlcElements.low);
  ohlcBoxElem.appendChild(closeLabel);
  ohlcBoxElem.appendChild(ohlcElements.close);

  const infoBoxSubcontainerElem = document.createElement("div");

  const ohlcExpanderElem = document.createElement("div");
  ohlcExpanderElem.style.flex = "1";
  ohlcExpanderElem.style.cursor = "pointer";
  ohlcExpanderElem.style.textAlign = "right";
  ohlcExpanderElem.style.display = "flex";
  ohlcExpanderElem.style.justifyContent = "flex-end";
  ohlcExpanderElem.innerHTML = iconoirNavArrowDownSvg;
  let expanded = true;
  const ohlcExpanderFn = function () {
    expanded = !expanded;
    persistedSettings.setProperty("ohlcBox", "toggled", expanded);
    if (expanded) {
      ohlcExpanderElem.innerHTML = iconoirNavArrowDownSvg;
      infoBoxSubcontainerElem.style.display = "block";
    } else {
      ohlcExpanderElem.innerHTML = iconoirNavArrowUpSvg;
      infoBoxSubcontainerElem.style.display = "none";
    }
  };
  ohlcExpanderElem.onclick = ohlcExpanderFn;

  if (persistedSettings.getProperty("ohlcBox", "toggled") === false) {
    ohlcExpanderFn();
  }

  ohlcRowElem.appendChild(ohlcBoxElem);
  ohlcRowElem.appendChild(ohlcExpanderElem);
  infoBoxElem.appendChild(ohlcRowElem);

  infoBoxElem.appendChild(infoBoxSubcontainerElem);

  const infoBoxItems = [];

  function addToInfoBox(newItem, visibilityToggleFn, valueFn, removeCb) {
    const newItemElem = document.createElement("div");
    let id;
    if (newItem.id) {
      id = newItem.id;
    } else {
      id = generateRandomString(8);
    }
    newItemElem.id = id + "-info";
    if (newItem.state) {
      newItem.state.elementId = id;
    }
    newItemElem.style.paddingLeft = "0.3em";
    newItemElem.style.display = "flex";
    newItemElem.style.alignItems = "center";

    const newItemLabel = document.createElement("span");
    newItemLabel.className = "label";

    let newName;
    if (typeof newItem.name === "function") {
      newName = newItem.name(newItem);
    } else if (typeof newItem.name === "string") {
      newName = newItem.name;
    }
    newItemLabel.innerHTML = newName;

    newItemElem.appendChild(newItemLabel);

    const valueElem = document.createElement("span");
    valueElem.style.fontWeight = "bold";
    valueElem.style.marginLeft = "0.3em";
    newItemElem.appendChild(valueElem);

    const rightSideElems = document.createElement("span");
    rightSideElems.style.flex = "1";
    rightSideElems.style.textAlign = "right";
    rightSideElems.style.marginLeft = "1em";
    rightSideElems.style.display = "flex";
    rightSideElems.style.justifyContent = "flex-end";
    newItemElem.appendChild(rightSideElems);

    const toggleElem = document.createElement("span");
    toggleElem.innerHTML = iconoirEyeSvg;
    toggleElem.style.paddingLeft = ".1em";
    toggleElem.style.cursor = "pointer";
    rightSideElems.appendChild(toggleElem);

    infoBoxSubcontainerElem.insertBefore(
      newItemElem,
      infoBoxSubcontainerElem.children[
        infoBoxSubcontainerElem.children.length - 1
      ],
    );

    let toggled = true;
    const shouldPersist = newItem.iName != null || newItem.id === "volume";

    const doToggle = () => {
      visibilityToggleFn();
      toggled = !toggled;
      if (shouldPersist) {
        persistedSettings.setProperty(id, "toggled", toggled);
      }
      if (!toggled) {
        newItemElem.style.opacity = 0.5;
      } else {
        newItemElem.style.opacity = 1;
      }
    };

    toggleElem.addEventListener("click", () => {
      doToggle();
      render();
    });

    if (
      shouldPersist &&
      persistedSettings.getProperty(id, "toggled") === false
    ) {
      doToggle();
    }

    let infoBoxItem;
    if (valueFn) {
      infoBoxItem = {
        onValueChange: (bar) => {
          const value = valueFn(bar);
          if (Array.isArray(value) && !value.some(isNaN)) {
            valueElem.innerHTML = value.map(round4).join(",");
          } else if (isNaN(value)) {
            valueElem.innerHTML = "...";
          } else {
            valueElem.innerHTML = "" + round4(value);
          }
        },
      };
      infoBoxItems.push(infoBoxItem);
    }

    let removeFn = () => {};

    if (removeCb) {
      const removeElem = document.createElement("span");
      removeElem.innerHTML = iconoirXmarkSvg;
      removeElem.style.paddingLeft = ".1em";
      removeElem.style.cursor = "pointer";
      rightSideElems.appendChild(removeElem);

      const settingsElem = document.createElement("span");
      settingsElem.innerHTML = iconoirSettingsSvg;
      settingsElem.style.cursor = "pointer";
      rightSideElems.insertBefore(settingsElem, toggleElem);

      const [settingsPopup, settingsContents, showSettingsPopup, updateTitle] =
        createPopup(newName, container);
      createFormFromObject(settingsContents, newItem.options, (opts) => {
        newItem.options = opts;
        newItem.refreshOptions();
        refreshInfoBox(newItem);
        render();
      });
      settingsElem.addEventListener("click", () => {
        if (typeof newItem.name === "function") {
          updateTitle(newItem.name(newItem));
        }
        showSettingsPopup();
      });

      removeFn = () => {
        newItemElem.remove();
        settingsPopup.remove();
        if (infoBoxItem) {
          removeObjectFromArray(infoBoxItems, infoBoxItem);
        }
        if (removeCb) {
          removeCb();
        }
      };
      removeElem.addEventListener("click", removeFn);
    }

    return {
      remove: removeFn,
    };
  }

  function refreshInfoBox(indicator) {
    const elem = document.getElementById(indicator.state.elementId);
    if (elem) {
      for (var i = 0; i < elem.children.length; i++) {
        if (elem.children[i].className === "label") {
          elem.children[i].innerHTML = indicator.name(indicator);
        }
      }
    }
  }

  priceChangeCallbacks.push((bar) =>
    infoBoxItems.forEach((i) => i.onValueChange(bar)),
  );

  const infoBoxActionContainerElem = document.createElement("div");
  infoBoxActionContainerElem.style.display = "flex";
  infoBoxActionContainerElem.style.padding = "0.4em";
  infoBoxSubcontainerElem.appendChild(infoBoxActionContainerElem);

  const addIndicatorElem = document.createElement("div");
  addIndicatorElem.innerHTML = "Add Indicator";
  addIndicatorElem.style.textDecoration = "underline";
  addIndicatorElem.style.cursor = "pointer";
  infoBoxActionContainerElem.appendChild(addIndicatorElem);

  const addLineElem = document.createElement("div");
  addLineElem.innerHTML = "Add Line";
  addLineElem.style.textDecoration = "underline";
  addLineElem.style.cursor = "pointer";
  addLineElem.style.marginLeft = "1em";
  infoBoxActionContainerElem.appendChild(addLineElem);

  addLineElem.addEventListener("click", () => {
    switchMode(modePlaceLineInitial);
  });

  addToInfoBox(
    { name: () => "Volume", id: "volume" },
    () => (state.volumeVisible = !state.volumeVisible),
    (bar) => bar.volume,
  );

  // Set up the zooming and scaling

  function paddedYDomain(data) {
    const visibleData = data.filter(
      (d) =>
        !isDummy(d) &&
        xScale(d.date.getTime()) >= 0 &&
        xScale(d.date.getTime()) <= d3.select("#ohlc-chart").node().clientWidth,
    );
    let min = Math.min(...visibleData.map((d) => d.low));
    let max = Math.max(...visibleData.map((d) => d.high));
    state.indicators.forEach((i) => {
      if (!i.separatePane && i.state.enabled) {
        let vals = visibleData.map(i.fn).filter((x) => !isNaN(x));
        if (Math.min(...vals) < min) {
          min = Math.min(...vals);
        }
        if (Math.max(...vals) > max) {
          max = Math.max(...vals);
        }
      }
    });
    max += (max - min) / 10;
    min -= (max - min) / 10;
    return [min, max];
  }

  const xScale = fc
    .scaleDiscontinuous(d3.scaleTime())
    .domain(fc.extentDate().accessors([(d) => d.date.getTime()])(data));
  const yScale = d3.scaleLinear().domain(paddedYDomain(data));

  const getStep = () =>
    getMostCommonDifference(data.map((x) => x.date.getTime()));

  let discontinuityRanges = [];
  const refreshXScaleDiscontinuity = () => {
    if (data.length > 1) {
      let step = getStep();

      const ranges = [];
      for (var i = 1; i < data.length; i++) {
        if (data[i].date.getTime() - data[i - 1].date.getTime() > step) {
          ranges.push([
            data[i - 1].date.getTime(),
            new Date(data[i].date.getTime() - step).getTime(),
          ]);
        }
      }
      discontinuityRanges = ranges;
      xScale.discontinuityProvider(fc.discontinuityRange(...ranges));
      return ranges;
    }
    return [];
  };

  const moveChartRight = (step) => {
    const oldDomain = xScale.domain();
    const newDomain = [
      new Date(oldDomain[0].getTime() + step).getTime(),
      new Date(oldDomain[1].getTime() + step).getTime(),
    ];
    const discontinuities = refreshXScaleDiscontinuity();
    for (let i = 0; i < discontinuities.length; i++) {
      const [dStart, dEnd] = discontinuities[i];
      if (newDomain[0] >= dStart && newDomain[0] < dEnd) {
        newDomain[0] += dEnd - dStart;
        break;
      }
    }
    xScale.domain(newDomain);
  };

  const refreshXDomain = () => {
    const nonDummy = data.filter((d) => !isDummy(d));
    if (nonDummy.length === 0) {
      return;
    }
    let last = new Date(
      nonDummy[nonDummy.length - 1].date.getTime() + getStep(),
    );
    let first = nonDummy[0].date;
    if (nonDummy.length > 100) {
      first = nonDummy[nonDummy.length - 100].date;
    }
    refreshXScaleDiscontinuity();
    xScale.domain([first.getTime(), last.getTime()]);
  };

  refreshXDomain();

  const refreshYDomain = () => {
    if (data.length === 0) {
      return;
    }
    yScale.domain(paddedYDomain(data));
  };

  const zoom = fc
    .zoom()
    .duration(0)
    .scaleExtent([0.3, 5])
    .on("zoom", (e) => {
      mousePos.x = e.sourceEvent.layerX;
      refreshYDomain();

      state.textDrawings.forEach(({ x, y, elem }) => {
        elem.setAttributeNS(null, "x", xScale(x.getTime()));
        elem.setAttributeNS(null, "y", yScale(y));
      });

      render();
    });

  const setScaleExtent = (extent) => {
    zoom.scaleExtent(extent);
  };

  // Initial crosshair setup since this is used by the indicators

  function annotationLine(sel) {
    sel
      .enter()
      .selectAll("g.annotation-line > line")
      .each(function () {
        const self = d3.select(this);
        self.style("stroke-opacity", ".8");
        self.style("stroke-dasharray", "4");
      });
  }

  const crosshair = fc
    .annotationSvgCrosshair()
    .xScale(xScale)
    .yScale(yScale)
    .xLabel((_) => "")
    .yLabel((_) => "")
    .decorate(annotationLine);

  // Gridline setup and render

  const gridline = fc.annotationSvgGridline().xScale(xScale).yScale(yScale);

  function renderGridline() {
    if (xScale.range()[1] === 1) {
      xScale.range([0, d3.select("#ohlc-chart").node().clientWidth]);
      yScale.range([d3.select("#ohlc-chart").node().clientHeight, 0]);
    }
    d3.select("#ohlc-chart svg").call(gridline);
    d3.select("#volume-chart svg").call(gridline);
    state.additionalPanes.forEach(({ id }) => {
      d3.select(`${id} svg`).call(gridline);
    });
    d3.selectAll(".gridline-x").call(displayNone);
  }

  // Add the indicators

  function refreshBottomAxesVisibility() {
    let lowestPaneId = "#volume-chart";
    state.additionalPanes.forEach(({ id }) => {
      document.querySelector(
        `${lowestPaneId} d3fc-svg.x-axis.bottom-axis`,
      ).style.display = "none";
      lowestPaneId = id;
    });
    document.querySelector(
      `${lowestPaneId} d3fc-svg.x-axis.bottom-axis`,
    ).style.display = "block";
  }

  function addIndicator(indicator) {
    const { type, options, fn } = indicator;
    indicator.fn = (bar) => {
      if (bar && !isDummy(bar)) {
        return fn(bar, indicator.options);
      }
    };
    indicator.state = {
      enabled: true,
      chartObjects: {},
    };

    let id = indicator.id;
    if (!id) {
      id = generateRandomString(8);
    }

    persistedSettings.setProperty(id, "id", id);
    persistedSettings.setProperty(id, "iName", indicator.iName);

    let multi = webglMulti;

    let additionalPane, newPaneYScale;
    if (indicator.separatePane) {
      d3.select("#x-label").remove();

      indicator.state.newPaneElem = document.createElement("div");
      indicator.state.newPaneElem.id = id;
      indicator.state.newPaneElem.style.flex = 1;
      container.appendChild(indicator.state.newPaneElem);

      const newPaneId = "#" + indicator.state.newPaneElem.id;

      multi = fc.seriesWebglMulti();

      newPaneYScale = d3.scaleLinear();

      indicator.refreshDomain = () => {
        let newPaneYDomain;
        if (type === "line") {
          const values = data
            .map((bar) => indicator.fn(bar))
            .filter((v) => !isNaN(v));
          newPaneYDomain = [
            Math.min(...values) * 0.95,
            Math.max(...values) * 1.05,
          ];
        } else if (type === "band") {
          const values = data
            .map((bar) => indicator.fn(bar))
            .flat()
            .filter((v) => !isNaN(v));
          newPaneYDomain = [
            Math.min(...values) * 0.95,
            Math.max(...values) * 1.05,
          ];
        }
        newPaneYScale.domain(newPaneYDomain);
      };
      indicator.refreshDomain();

      const newPaneIndex = state.additionalPanes.length;

      const newPaneChart = fc
        .chartCartesian({
          xScale,
          yScale: newPaneYScale,
          yAxis: {
            right: (scale) => fc.axisRight(scale).ticks(3),
          },
        })
        .webglPlotArea(multi)
        .svgPlotArea(noopsvg)
        .decorate((sel) => {
          sel.enter().call(specialgrid);
          sel.enter().selectAll(".plot-area").call(zoom, xScale);
          sel.enter().selectAll(".x-axis").call(zoom, xScale);
          sel.enter().selectAll(".top-label").call(displayNone);
          sel.enter().selectAll("svg").call(attr("font-size", "14px"));
          sel.on("mousemove", (e) => {
            updateCurrentPaneId(newPaneId);
            updateMouseX(e);
            let otherPanesHeight = yScale.range()[0] + volumeScale.range()[0];
            state.additionalPanes.forEach((p, i) => {
              if (p.id !== newPaneId && i < newPaneIndex) {
                otherPanesHeight += p.yScale.range()[0];
              }
            });

            mousePos.y = e.layerY;

            const limitY = newPaneYScale.range()[0];
            if (e.layerY > limitY) {
              mousePos.y = limitY;
            }

            mousePos.y += otherPanesHeight;

            updateCrosshair();
          });
        });

      additionalPane = {
        id: newPaneId,
        chart: newPaneChart,
        yScale: newPaneYScale,
      };
      state.additionalPanes.push(additionalPane);
    }

    indicator.enableSeparatePane = () => {
      if (indicator.separatePane) {
        enablePane(additionalPane.id);
      }
    };

    indicator.disableSeparatePane = () => {
      if (indicator.separatePane) {
        disablePane(additionalPane.id);
      }
    };

    indicator.removeSeparatePane = () => {
      if (indicator.separatePane) {
        removeObjectFromArray(state.additionalPanes, additionalPane);
        refreshBottomAxesVisibility();
        indicator.state.newPaneElem.remove();
      }
    };

    let refreshOptions;

    if (type === "line") {
      const line = fc
        .seriesWebglLine()
        .xScale(xScale)
        .yScale(yScale)
        .crossValue((d) => d.date)
        .mainValue(indicator.fn)
        .decorate(fc.webglStrokeColor(hexToRgba(options.color)));
      indicator.state.chartObjects.line = line;

      refreshOptions = () => {
        if (indicator.separatePane) {
          const values = data
            .map((bar) => indicator.fn(bar))
            .filter((v) => !isNaN(v));
          newPaneYScale.domain([
            Math.min(...values) * 0.95,
            Math.max(...values) * 1.05,
          ]);
        }
        indicator.state.chartObjects.line.decorate(
          fc.webglStrokeColor(hexToRgba(indicator.options.color)),
        );
      };

      indicator.disable = () => {
        indicator.state.chartObjects.line.mainValue((_) => undefined);
      };

      indicator.enable = () => {
        indicator.state.chartObjects.line.mainValue(indicator.fn);
      };

      indicator.remove = () => {
        removeFromMulti(multi, indicator.state.chartObjects.line);
      };

      addToMulti(multi, indicator.state.chartObjects.line);
    } else if (type === "band") {
      const lines = [];
      const numLines = indicator.numLines;
      for (let i = 0; i < numLines; i++) {
        const line = fc
          .seriesWebglLine()
          .crossValue((d) => d.date)
          .mainValue((bar) => {
            const val = indicator.fn(bar);
            if (val) {
              return val[i];
            }
          })
          .decorate(fc.webglStrokeColor(hexToRgba(options.color)));
        lines.push(line);
        addToMulti(multi, line);
      }
      indicator.state.chartObjects.lines = lines;

      refreshOptions = () => {
        if (indicator.separatePane) {
          const values = data
            .map((bar) => indicator.fn(bar))
            .flat()
            .filter((v) => !isNaN(v));
          newPaneYScale.domain([
            Math.min(...values) * 0.95,
            Math.max(...values) * 1.05,
          ]);
        }
        indicator.state.chartObjects.lines.forEach((line) =>
          line.decorate(
            fc.webglStrokeColor(hexToRgba(indicator.options.color)),
          ),
        );
      };

      indicator.disable = () => {
        indicator.state.chartObjects.lines.forEach((line) =>
          line.mainValue((_) => undefined),
        );
      };

      indicator.enable = () => {
        indicator.state.chartObjects.lines.forEach((line, i) =>
          line.mainValue((bar) => {
            const val = indicator.fn(bar);
            if (val) {
              return val[i];
            }
          }),
        );
      };

      indicator.remove = () => {
        indicator.state.chartObjects.lines.forEach((line) =>
          removeFromMulti(multi, line),
        );
      };
    }

    indicator.refreshOptions = () => {
      persistedSettings.setObject(indicator.id + ".options", indicator.options);
      refreshOptions();
    };

    state.indicators.push(indicator);

    addToInfoBox(
      indicator,
      () => {
        indicator.state.enabled = !indicator.state.enabled;
        persistedSettings.setProperty(
          indicator.id,
          "toggled",
          indicator.state.enabled,
        );
        if (!indicator.state.enabled) {
          indicator.disable();
          indicator.disableSeparatePane();
        } else {
          indicator.enable();
          indicator.enableSeparatePane();
        }
        refreshYDomain();
      },
      (bar) => indicator.fn(bar),
      () => {
        persistedSettings.remove(indicator.id);
        removeObjectFromArray(state.indicators, indicator);
        indicator.removeSeparatePane();
        indicator.remove();
      },
    );

    refreshBottomAxesVisibility();
  }

  const [_, indicatorPopupContents, showIndicatorPopup] = createPopup(
    "Add Indicator",
    container,
  );

  indicatorPopupContents.style.marginTop = "1em";

  options.indicators.forEach((iName) => {
    const i = indicators[iName];
    const elem = document.createElement("div");
    elem.className = "info-box-hover-effect";
    elem.innerHTML = i.name(i);
    elem.style.marginTop = "0.2em";
    elem.style.cursor = "pointer";
    elem.style.padding = "5px";
    elem.style.fontSize = "1rem";
    elem.addEventListener("click", () => {
      const newIndicator = deepCopy(i);
      newIndicator.iName = iName;
      const nameFn = newIndicator.name;
      newIndicator.name = (ind) => {
        return nameFn(ind) + ": ";
      };
      addIndicator(newIndicator);
    });
    indicatorPopupContents.appendChild(elem);
  });

  addIndicatorElem.addEventListener("click", showIndicatorPopup);

  // Add drawings

  const defaultLineColor = "#7733dd";
  const svgMulti = fc.seriesSvgMulti();

  function createActiveLine(x1, y1) {
    const chartObject = fc
      .seriesSvgLine()
      .xScale(xScale)
      .yScale(yScale)
      .decorate((sel) => {
        sel.attr("stroke", defaultLineColor);
      });
    addToMulti(svgMulti, chartObject);
    state.activeLine = {
      x1: xScale.invert(x1),
      y1: yScale.invert(y1),
      chartObject,
    };
  }

  const oneDayMillis = 1000 * 60 * 60 * 24;
  function getLineCrossValueFn(x1, x2) {
    return (bar) => {
      const diff2 = (x2 - bar.date.getTime()) / oneDayMillis;
      if (diff2 > -1 && diff2 < 0) {
        return x2;
      }
      const diff1 = (x1 - bar.date.getTime()) / oneDayMillis;
      if ((diff1 > 0 && diff1 < 1) || (diff1 > -1 && diff1 < 0)) {
        return x1;
      }
      if (
        (x1 <= x2 && bar.date.getTime() >= x1 && bar.date.getTime() <= x2) ||
        (x2 < x1 && bar.date.getTime() >= x2 && bar.date.getTime() <= x1)
      ) {
        return bar.date;
      }
    };
  }

  function getDiscontinuitiesBetween(x1, x2) {
    // Assume discontuinityRanges is sorted, and start and end within a range
    // are sorted. Assume x1 and x2 are unsorted.
    const left = Math.min(x1, x2);
    const right = Math.max(x1, x2);
    let leftDiscI = -1;
    let rightDiscI = -1;
    for (let i = 0; i < discontinuityRanges.length; i++) {
      const [start, end] = discontinuityRanges[i];
      if (left > start) {
        leftDiscI = i;
      }
      if (right > start) {
        rightDiscI = i;
      }
    }
    return discontinuityRanges.slice(leftDiscI + 1, rightDiscI + 1);
  }

  function getLineMainValueFn(x1, y1, x2, y2) {
    // If there is a discontinuity between bar and x1, use the discontinuity's
    // boundary as the x value and calculate the y value such that the disjoint
    // segments still render one continuous line.
    const getDiscChange = (x1, x2) => {
      const discontinuitiesBetween = getDiscontinuitiesBetween(x1, x2);
      const discSum = discontinuitiesBetween.reduce(
        (sum, [start, end]) => sum + (end - start),
        0,
      );
      const discChange = x2 > x1 ? -discSum : discSum;
      return discChange;
    };

    const slope = (y2 - y1) / (x2 - x1 + getDiscChange(x1, x2));
    if (isNaN(slope)) {
      return;
    }

    return (bar) => {
      const diff2 = (x2 - bar.date) / oneDayMillis;
      if (diff2 > -1 && diff2 < 0) {
        return y2;
      }
      const diff1 = (x1 - bar.date) / oneDayMillis;
      if ((diff1 > 0 && diff1 < 1) || (diff1 > -1 && diff1 < 0)) {
        return y1;
      }
      const discChange = getDiscChange(x1, bar.date.getTime());
      let xDelt = bar.date.getTime() - x1;
      if (sameSign(xDelt + discChange, xDelt)) {
        xDelt += discChange;
      }
      return y1 + xDelt * slope;
    };
  }

  function updateActiveLine(x2pos, y2pos) {
    if (state.activeLine == null || state.activeLine.chartObject == null) {
      return;
    }
    const x1 = state.activeLine.x1;
    const y1 = state.activeLine.y1;
    const x2 = xScale.invert(x2pos);
    const y2 = yScale.invert(y2pos);
    state.activeLine.chartObject
      .crossValue(getLineCrossValueFn(x1, x2))
      .mainValue(getLineMainValueFn(x1, y1, x2, y2));
    render();
  }

  function removeActiveLine() {
    if (state.activeLine == null) {
      return;
    }
    if (state.activeLine.chartObject != null) {
      removeFromMulti(svgMulti, state.activeLine.chartObject);
    }
    state.activeLine = null;
  }

  function startDrag(e, drawing) {
    switchMode(modeDragLine);
    state.activeDrag = {
      initialX: e.layerX,
      initialY: e.layerY,
      drawing,
    };
  }

  function continueDrag(x, y) {
    if (state.activeDrag) {
      let newX = 0;
      let newY = 0;
      if (!state.activeDrag.drawing.moreOpts.dragConstrainX) {
        newX = x - state.activeDrag.initialX;
      }
      if (!state.activeDrag.drawing.moreOpts.dragConstrainY) {
        newY = y - state.activeDrag.initialY;
      }
      state.activeDrag.drawing.move(newX, newY);
    }
  }

  function stopDrag() {
    if (state.activeDrag) {
      state.activeDrag.drawing.stopMoving();
    }
    switchMode(modeCursor);
  }

  function addLineDrawing(name, x1, y1, x2, y2, moreOpts = {}) {
    const options = { name, color: moreOpts.color ?? defaultLineColor };
    if (name === "") {
      options.name = "New Line";
    }

    const nameFn = (d) => {
      return d.options.name;
    };

    const drawingState = { enabled: true, initialCoords: { x1, y1, x2, y2 } };
    const drawing = { name: nameFn, options, state: drawingState, moreOpts };

    const startDragFn = (e) => {
      if (state.mode === modeDragLine) {
        stopDrag();
      } else {
        startDrag(e, drawing);
      }
      render();
    };

    const drawingId = generateRandomString(8);
    const decorateFn = (sel) => {
      sel.attr("id", drawingId);
      sel.attr("stroke", drawing.options.color);
      if (moreOpts.draggable) {
        if (state.mode === modeDragLine) {
          sel.style("cursor", "grabbing");
        } else {
          sel.style("cursor", "grab");
        }
        sel.on("click", startDragFn);
      }
    };

    const newDrawing = fc
      .seriesSvgLine()
      .xScale(xScale)
      .yScale(yScale)
      .crossValue(getLineCrossValueFn(x1, x2))
      .mainValue(getLineMainValueFn(x1, y1, x2, y2))
      .decorate(decorateFn);

    if (moreOpts.draggable) {
      // Create a "shadow" object to make it more easy to click and drag
      drawing.shadowChartObject = fc
        .seriesSvgLine()
        .xScale(xScale)
        .yScale(yScale)
        .crossValue(getLineCrossValueFn(x1, x2))
        .mainValue(getLineMainValueFn(x1, y1, x2, y2))
        .decorate((sel) => {
          sel.attr("id", drawingId + "-shadow");
          sel.attr("stroke-width", 15);
          sel.attr("stroke-opacity", 0);
          if (state.mode === modeDragLine) {
            sel.style("cursor", "grabbing");
          } else {
            sel.style("cursor", "grab");
          }
          sel.on("click", startDragFn);
        });
      addToMulti(svgMulti, drawing.shadowChartObject);
    }

    drawing.move = (x, y) => {
      drawing.state.inProgressCoords = {
        x1: xScale.invert(x + xScale(drawing.state.initialCoords.x1)),
        x2: xScale.invert(x + xScale(drawing.state.initialCoords.x2)),
        y1: yScale.invert(y + yScale(drawing.state.initialCoords.y1)),
        y2: yScale.invert(y + yScale(drawing.state.initialCoords.y2)),
      };
      const { x1, y1, x2, y2 } = drawing.state.inProgressCoords;
      [drawing.chartObject, drawing.shadowChartObject].forEach((d) =>
        d
          .crossValue(getLineCrossValueFn(x1, x2))
          .mainValue(getLineMainValueFn(x1, y1, x2, y2)),
      );
      render();
    };

    drawing.stopMoving = () => {
      drawing.state.initialCoords = {
        ...drawing.state.inProgressCoords,
      };
      const { x1, y1, x2, y2 } = drawing.state.initialCoords;
      [drawing.chartObject, drawing.shadowChartObject].forEach((d) =>
        d
          .crossValue(getLineCrossValueFn(x1, x2))
          .mainValue(getLineMainValueFn(x1, y1, x2, y2)),
      );
      render();
    };

    drawing.id = drawingId;
    drawing.chartObject = newDrawing;
    state.drawings.push(drawing);

    drawing.disable = () => {
      newDrawing.mainValue((_) => undefined);
      if (drawing.shadowChartObject) {
        drawing.shadowChartObject.mainValue((_) => undefined);
      }
    };

    drawing.enable = () => {
      const { x1, y1, x2, y2 } = drawing.state.initialCoords;
      newDrawing.mainValue(getLineMainValueFn(x1, y1, x2, y2));
      if (drawing.shadowChartObject) {
        drawing.shadowChartObject.mainValue(getLineMainValueFn(x1, y1, x2, y2));
      }
    };

    drawing.refreshOptions = () => {
      newDrawing.decorate(decorateFn);
    };

    addToMulti(svgMulti, newDrawing);

    const removeDrawing = () => {
      removeFromMulti(svgMulti, drawing.chartObject);
      if (drawing.shadowChartObject) {
        removeFromMulti(svgMulti, drawing.shadowChartObject);
      }
      removeObjectFromArray(state.drawings, drawing);
    };

    let removeFn = removeDrawing;
    if (!moreOpts.hideFromInfoBox) {
      const ret = addToInfoBox(
        drawing,
        () => {
          drawing.state.enabled = !drawing.state.enabled;
          if (!drawing.state.enabled) {
            drawing.disable();
          } else {
            drawing.enable();
          }
        },
        null,
        removeDrawing,
      );
      removeFn = ret.remove;
    }

    return {
      remove: removeFn,
    };
  }

  state.textDrawings = [];

  function addTextDrawing(x, y, text, anchor) {
    const ohlcSvg = document.querySelector("#ohlc-chart .plot-area svg");
    if (ohlcSvg) {
      const newText = document.createElementNS(svgNS, "text");
      newText.setAttributeNS(null, "x", xScale(x));
      newText.setAttributeNS(null, "y", yScale(y));
      newText.style.textAnchor = anchor ?? "middle";
      newText.innerHTML = text;
      ohlcSvg.appendChild(newText);
      const newTextWrapper = { x, y, elem: newText };
      newTextWrapper.remove = () => {
        removeObjectFromArray(state.textDrawings, newTextWrapper);
        elem.remove();
      };
      state.textDrawings.push(newTextWrapper);
      return newText;
    }
  }

  // Define the base charts

  const candlestick = fc
    .autoBandwidth(fc.seriesWebglCandlestick())
    .decorate(setFillColor(options.colors, 1));
  const noopsvg = fc.seriesSvgLine();

  const volumeScale = d3.scaleLinear();
  const refreshVolumeDomain = () => {
    const volumeValues = data.map((d) => d.volume).filter((v) => v >= 0);
    const maxVolume = Math.max(...volumeValues);
    const minVolume = Math.min(...volumeValues);
    volumeScale.domain([minVolume / 1.3, maxVolume]);
  };

  refreshVolumeDomain();

  const volume = fc
    .autoBandwidth(fc.seriesWebglBar())
    .crossValue((d) => d.date)
    .mainValue((d) => d.volume)
    .decorate(setFillColor(options.colors, 0.8));

  const webglMulti = fc.seriesWebglMulti();
  webglMulti.xScale(xScale).yScale(yScale).series([candlestick]);

  function addToMulti(multi, newSeries) {
    const existingSeries = multi.series();
    multi.series([...existingSeries, newSeries]);
    render();
  }

  function removeFromMulti(multi, seriesToRemove) {
    const newSeries = multi.series();
    removeObjectFromArray(newSeries, seriesToRemove);
    multi.series(newSeries);
    render();
  }

  const ohlcChart = fc
    .chartCartesian(xScale, yScale)
    .webglPlotArea(webglMulti)
    .svgPlotArea(svgMulti)
    .decorate((sel) => {
      sel.enter().call(specialgrid);
      sel
        .enter()
        .select(".svg-plot-area")
        .call(attr("border-bottom", "1px solid rgba(0, 0, 0, 0.1)"));
      sel.enter().selectAll(".x-axis").call(displayNone);
      sel.enter().selectAll(".top-label").call(displayNone);
      sel.enter().selectAll("svg").call(attr("font-size", "14px"));
      sel.enter().selectAll(".plot-area").call(zoom, xScale);
    });

  const volumeChart = fc
    .chartCartesian({
      xScale,
      yScale: volumeScale,
      yAxis: {
        right: (scale) => fc.axisRight(scale).ticks(3),
      },
    })
    .webglPlotArea(volume)
    .svgPlotArea(noopsvg)
    .decorate((sel) => {
      sel.enter().call(specialgrid);
      sel.enter().selectAll(".plot-area").call(zoom, xScale);
      sel.enter().selectAll(".x-axis").call(zoom, xScale);
      sel.enter().selectAll(".top-label").call(displayNone);
      sel.enter().selectAll("svg").call(attr("font-size", "14px"));
    });

  // The next chunk of code deals with getting the crosshair to work exactly the way I want

  let shiftKeyPressed = false;

  document.addEventListener("keydown", (e) => {
    if (e.key === "Shift") {
      shiftKeyPressed = true;
      updateCrosshair();
    }
  });

  document.addEventListener("mousemove", (e) => {
    if (!e.shiftKey) {
      shiftKeyPressed = false;
    }
  });

  document.addEventListener("keyup", (e) => {
    if (e.key === "Shift") {
      shiftKeyPressed = false;
      updateCrosshair();
    }
  });

  function snapMouseToOHLC(nearest) {
    const openY = yScale(nearest.open);
    const highY = yScale(nearest.high);
    const lowY = yScale(nearest.low);
    const closeY = yScale(nearest.close);

    const ohlcValues = [openY, highY, lowY, closeY];

    // Find the nearest OHLC value to the current mouse Y position
    const nearestValue = ohlcValues.reduce((prev, curr) => {
      return Math.abs(curr - mousePos.y) < Math.abs(prev - mousePos.y)
        ? curr
        : prev;
    });

    if (isDummy(nearest)) {
      return;
    }

    mousePos.x = xScale(nearest.date);
    mousePos.y = nearestValue;

    if (state.mode === modePlaceLineSecondary) {
      updateActiveLine(mousePos.x, mousePos.y);
    }
  }

  function updateCrosshair() {
    if (data.length === 0) {
      return;
    }

    const xValue = xScale.invert(mousePos.x);
    const nearest = data.reduce((prev, curr) => {
      return Math.abs(curr.date - xValue) < Math.abs(prev.date - xValue)
        ? curr
        : prev;
    });

    if (shiftKeyPressed) {
      snapMouseToOHLC(nearest);
    }

    if (!isDummy(nearest)) {
      priceChangeCallbacks.forEach((fn) => fn(nearest));
    }

    renderCrosshair();
  }

  function renderCrosshair() {
    d3.select("#ohlc-chart svg").datum([mousePos]).call(crosshair);

    const ohlcHeight = yScale.range()[0];

    d3.select("#volume-chart svg")
      .datum([{ x: mousePos.x, y: mousePos.y - ohlcHeight }])
      .call(crosshair);

    let heightSoFar = ohlcHeight + volumeScale.range()[0];
    let lowestPaneId = "#volume-chart";
    state.additionalPanes.forEach(({ id, yScale }) => {
      d3.select(`${id} svg`)
        .datum([
          {
            x: mousePos.x,
            y: mousePos.y - heightSoFar,
          },
        ])
        .call(crosshair);
      lowestPaneId = id;
      heightSoFar += yScale.range()[0];
    });

    // Some complicated code follows to make the x and y axis labels work smoothly

    const xLabelText =
      state.currentBar != null ? state.currentBar.date.toLocaleString() : "";
    const xLabel = d3.select("#x-label");

    const activeYScale = getYScaleOfPane(state.currentPaneId);
    const adjustedY = mousePos.y - getHeightOfPanesAbove(state.currentPaneId);
    const yLabelText = activeYScale.invert(adjustedY);
    const yLabel = d3.select("#y-label");

    if (mousePos.x < 0 || mousePos.y < 0) {
      xLabel.remove();
      yLabel.remove();
      return;
    }

    const adjustLabel = (g, rect1, rect2, text) => {
      const label = g.attr("id");
      const transform =
        label === "x-label"
          ? `translate(${mousePos.x},18)`
          : `translate(5,${adjustedY})`;
      g.attr("transform", transform);
      rect1.style("fill", "white");
      rect2.style("fill", "black");
      text
        .text(label === "x-label" ? xLabelText : yLabelText)
        .style("fill", "white");

      const textNode = text.node();
      const bbox = textNode.getBBox();

      rect1
        .attr("x", bbox.x - 5)
        .attr("y", bbox.y - 5)
        .attr("width", bbox.width + 10)
        .attr("height", bbox.height + 10);

      rect2
        .attr("x", bbox.x - 5)
        .attr("y", bbox.y - 5)
        .attr("width", bbox.width + 10)
        .attr("height", bbox.height + 10);

      g.raise();
    };

    if (xLabel.empty()) {
      d3.select(`${lowestPaneId} .bottom-axis svg`).each(function () {
        const self = d3.select(this);
        const g = self.append("g").attr("id", "x-label");
        const rect1 = g.append("rect").attr("id", "rect1");
        const rect2 = g.append("rect").attr("id", "rect2");
        const text = g.append("text");
        adjustLabel(g, rect1, rect2, text);
      });
    } else {
      xLabel.each(function () {
        const g = d3.select(this);
        const rect1 = g.select("rect#rect1");
        const rect2 = g.select("rect#rect2");
        const text = g.select("text");
        adjustLabel(g, rect1, rect2, text);
      });
    }

    if (yLabel.empty()) {
      d3.select(`${state.currentPaneId} .right-axis svg`).each(function () {
        const self = d3.select(this);
        const g = self.append("g").attr("id", "y-label");
        const rect1 = g.append("rect").attr("id", "rect1");
        const rect2 = g.append("rect").attr("id", "rect2");
        const text = g.append("text");
        adjustLabel(g, rect1, rect2, text);
      });
    } else {
      yLabel.each(function () {
        const g = d3.select(this);
        const rect1 = g.select("rect#rect1");
        const rect2 = g.select("rect#rect2");
        const text = g.select("text");
        adjustLabel(g, rect1, rect2, text);
      });
    }
  }

  const updateMouseX = (e) => {
    mousePos.x = e.layerX;

    // TODO: figure out why layerX gets a weirdly small value when you mouse over the y axis labels
    const limitX = xScale.range()[1];
    if (e.layerX > limitX) {
      mousePos.x = limitX;
    }
  };

  function updateCurrentPaneId(newId) {
    if (state.currentPaneId !== newId) {
      d3.select("#y-label").remove();
    }
    state.currentPaneId = newId;
  }

  function getHeightOfPanesAbove(paneId) {
    if (paneId === "#ohlc-chart") {
      return 0;
    } else if (paneId === "#volume-chart") {
      return yScale.range()[0];
    } else {
      let height = yScale.range()[0] + volumeScale.range()[0];
      for (var i = 0; i < state.additionalPanes.length; i++) {
        const { id, yScale } = state.additionalPanes[i];
        if (paneId === id) {
          break;
        }
        height += yScale.range()[0];
      }
      return height;
    }
  }

  function getYScaleOfPane(paneId) {
    if (paneId === "#ohlc-chart") {
      return yScale;
    } else if (paneId === "#volume-chart") {
      return volumeScale;
    } else {
      for (var i = 0; i < state.additionalPanes.length; i++) {
        const { id, yScale } = state.additionalPanes[i];
        if (paneId === id) {
          return yScale;
        }
      }
    }
  }

  d3.select("#ohlc-chart")
    .on("mousemove", (e) => {
      updateCurrentPaneId("#ohlc-chart");
      updateMouseX(e);
      mousePos.y = e.layerY;
      updateCrosshair();
      if (state.mode === modePlaceLineSecondary) {
        updateActiveLine(mousePos.x, mousePos.y);
      } else if (state.mode === modeDragLine) {
        continueDrag(mousePos.x, mousePos.y);
      }
    })
    .on("mouseleave", (e) => {
      if (state.mode === modeDragLine) {
        stopDrag();
      }
    })
    .on("click", (e) => {
      if (state.mode === modePlaceLineInitial) {
        createActiveLine(mousePos.x, mousePos.y);
        switchMode(modePlaceLineSecondary);
        return;
      }
      if (state.mode === modePlaceLineSecondary) {
        const x2 = xScale.invert(mousePos.x);
        const y2 = yScale.invert(mousePos.y);
        addLineDrawing("", state.activeLine.x1, state.activeLine.y1, x2, y2, {
          draggable: true,
        });
        switchMode(modeCursor);
        return;
      }

      for (var i = 0; i < state.drawings.length; i++) {
        if (e.target.id.split("-")[0] === state.drawings[i].id) {
          if (state.mode === modeDragLine) {
            startDrag(e, state.drawings[i]);
          } else {
            stopDrag();
          }
          return;
        }
      }

      if (state.mode === modeDragLine) {
        stopDrag();
        return;
      }
    })
    .on("contextmenu", (e) => {
      e.preventDefault();
      switchMode(modeCursor);
    });

  document.body.addEventListener("keypress", () => {
    switchMode(modeCursor);
  });

  d3.select("#volume-chart").on("mousemove", (e) => {
    updateCurrentPaneId("#volume-chart");
    updateMouseX(e);

    const ohlcHeight = yScale.range()[0];
    mousePos.y = e.layerY;

    const limitY = volumeScale.range()[0];
    if (e.layerY > limitY) {
      mousePos.y = limitY;
    }

    mousePos.y += ohlcHeight;

    updateCrosshair();
  });

  // To close it out, define the charts and render them

  priceChangeCallbacks.forEach((fn) => {
    if (data.length === 0) {
      return;
    }
    fn(data[data.length - 1]);
  });

  function render() {
    d3.select("#ohlc-chart").datum(data).call(ohlcChart);

    d3.select("#volume-chart").datum(data).call(volumeChart);

    state.additionalPanes.forEach(({ id, chart }) => {
      d3.select(id).datum(data).call(chart);
    });

    if (!state.volumeVisible) {
      disablePane("#volume-chart");
    } else {
      enablePane("#volume-chart");
    }

    renderGridline();

    renderCrosshair();
  }

  render();

  // Add persisted indicators from the previous load
  // This goes at the end because it relies on state initialized above
  persistedSettings.forEach((id, state) => {
    if (id === "volume" || id === "ohlcBox") {
      return;
    }
    const i = indicators[state.iName];
    const newIndicator = deepCopy(i);
    newIndicator.iName = state.iName;
    const nameFn = newIndicator.name;
    newIndicator.name = (ind) => {
      return nameFn(ind) + ": ";
    };
    if (state.options) {
      for (const key in state.options) {
        if (state.options.hasOwnProperty(key)) {
          newIndicator.options[key] = state.options[key];
        }
      }
    }
    newIndicator.id = id;
    addIndicator(newIndicator);
  });

  return {
    addTextDrawing,
    addLineDrawing,
    refreshData,
    setScaleExtent,
    getMostCommonDifference: () =>
      getMostCommonDifference(data.map((x) => x.date.getTime())),
  };
}

window.FirChart = FirChart;
