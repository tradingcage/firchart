function sma(bar, length, accessor) {
  let sum = 0;
  for (var i = 0; i < length; i++) {
    if (bar[i][accessor] == null) {
      return;
    }
    sum += bar[i][accessor];
  }
  return sum / length;
}

function ema(bar, length, accessor) {
  if (bar.length < length) {
    return;
  }

  let k = 2 / (length + 1); // Weighting multiplier
  let ema = bar[0][accessor]; // Starting with the first data point

  for (var i = 1; i < length; i++) {
    if (bar[i][accessor] == null) {
      return;
    }
    ema = bar[i][accessor] * k + ema * (1 - k);
  }
  return ema;
}

function trueRange(bar, previousClose) {
  if (!previousClose) return bar.high - bar.low;

  return Math.max(
    bar.high - bar.low,
    Math.abs(bar.high - previousClose),
    Math.abs(bar.low - previousClose),
  );
}

function atr(bar, length) {
  let atr = 0;
  let previousClose = null;

  for (let i = 0; i < length; i++) {
    const tr = trueRange(bar[i], previousClose);
    if (i < length) {
      atr += tr;
    } else {
      atr = (atr * (length - 1) + tr) / length;
    }
    previousClose = bar[i].close;
  }

  return atr / length;
}

function stdev(bar, length, accessor) {
  const mean = sma(bar, length, accessor);
  let sumOfSquares = 0;
  for (let i = 0; i < length; i++) {
    sumOfSquares += Math.pow(bar[i][accessor] - mean, 2);
  }
  return Math.sqrt(sumOfSquares / length);
}

function rsi(bar, length, accessor) {
  let gains = 0;
  let losses = 0;

  for (let i = 0; i < length - 1; i++) {
    const difference = bar[i][accessor] - bar[i + 1][accessor];
    if (difference >= 0) {
      gains += difference;
    } else {
      losses -= difference;
    }
  }

  const averageGain = gains / length;
  const averageLoss = losses / length;
  const relativeStrength = averageGain / averageLoss;

  return 100 - 100 / (1 + relativeStrength);
}

function FirChart(chartContainer, userProvidedData, options) {
  // Define the library of indicators

  const simpleMovingAverageIndicator = {
    name: (i) => `SMA (${i.options.length})`,
    type: "line",
    options: {
      color: "#1111AA",
      length: 20,
    },
    fn: (bar, options) => {
      return round2(sma(bar, options.length, "close"));
    },
  };

  const exponentialMovingAverageIndicator = {
    name: (i) => `EMA (${i.options.length})`,
    type: "line",
    options: {
      color: "#AA1111",
      length: 20,
    },
    fn: (bar, options) => {
      return round2(ema(bar, options.length, "close"));
    },
  };

  const averageTrueRangeIndicator = {
    name: (i) => `ATR (${i.options.length})`,
    type: "line",
    separatePane: true,
    options: {
      color: "#11AA11",
      length: 14,
    },
    fn: (bar, options) => {
      return round2(atr(bar, options.length));
    },
  };

  const keltnerChannelsIndicator = {
    name: () => `KC`,
    type: "band",
    numLines: 3,
    options: {
      color: "#11AA11",
      emaLength: 20,
      multiplier: 2,
      atrLength: 10,
    },
    fn: (bar, options) => {
      const middleLine = ema(bar, options.emaLength, "close");
      const range = atr(bar, options.atrLength);

      return [
        round2(middleLine + range * options.multiplier),
        round2(middleLine),
        round2(middleLine - range * options.multiplier),
      ];
    },
  };

  const bollingerBandsIndicator = {
    name: () => `BB`,
    type: "band",
    numLines: 3,
    options: {
      color: "#1A1AA1",
      smaLength: 20,
      stdev: 2,
    },
    fn: (bar, options) => {
      const middleBand = sma(bar, options.smaLength, "close");
      const sd = stdev(bar, options.smaLength, "close");

      return [
        round2(middleBand + sd * options.stdev),
        round2(middleBand),
        round2(middleBand - sd * options.stdev),
      ];
    },
  };

  const rsiIndicator = {
    name: (i) => `RSI (${i.options.length})`,
    type: "band",
    separatePane: true,
    numLines: 3,
    options: {
      color: "#A1A11A",
      length: 14,
      upperLevel: 70,
      lowerLevel: 30,
    },
    fn: (bar, options) => {
      return [
        options.upperLevel,
        round2(rsi(bar, options.length, "close")),
        options.lowerLevel,
      ];
    },
  };

  const indicatorsByName = {
    sma: simpleMovingAverageIndicator,
    ema: exponentialMovingAverageIndicator,
    atr: averageTrueRangeIndicator,
    keltnerChannels: keltnerChannelsIndicator,
    bollingerBands: bollingerBandsIndicator,
    rsi: rsiIndicator,
  };

  // Helper functions

  function deepCopy(obj) {
    // Handle null, undefined, and non-object values
    if (obj === null || typeof obj !== "object") {
      return obj;
    }

    // Handle Date
    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }

    // Handle Arrays
    if (Array.isArray(obj)) {
      var copiedArray = [];
      for (var i = 0; i < obj.length; i++) {
        copiedArray[i] = deepCopy(obj[i]);
      }
      return copiedArray;
    }

    // Handle Objects
    if (obj instanceof Object) {
      var copiedObj = {};
      for (var key in obj) {
        // Ensure the property belongs to the object, not inherited
        if (obj.hasOwnProperty(key)) {
          copiedObj[key] = deepCopy(obj[key]);
        }
      }
      return copiedObj;
    }

    // If it's a function or other type, return it as is
    return obj;
  }

  function generateRandomString(length) {
    var result = "";
    var characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return "x" + result;
  }

  function hexToRgba(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const a = 1; // alpha value is 1 for full opacity
    return [r, g, b, a];
  }

  function round2(num) {
    return Math.round(num * 100) / 100;
  }

  function removeObjectFromArray(array, object) {
    const index = array.indexOf(object);
    if (index > -1) {
      array.splice(index, 1);
    }
  }

  class LocalStorageObject {
    constructor(storageKey) {
      this.storageKey = storageKey;
      this.loadInitialState();
    }

    loadInitialState() {
      const storedData = localStorage.getItem(this.storageKey);
      this.state = storedData ? JSON.parse(storedData) : {};
    }

    set(key, value) {
      this.state[key] = value;
      this.saveState();
    }

    setProperty(key, prop, value) {
      let v = this.state[key];
      if (v == null) {
        v = {};
      }
      v[prop] = value;
      this.state[key] = v;
      this.saveState();
    }

    setObject(key, obj) {
      const keys = key.split(".");
      let current = this.state;
      while (keys.length > 1) {
        const k = keys.shift();
        current[k] = current[k] || {};
        current = current[k];
      }
      current[keys[0]] = { ...current[keys[0]], ...obj };
      this.saveState();
    }

    get(key) {
      return this.state[key];
    }

    getProperty(key, prop) {
      return this.state[key] && this.state[key][prop];
    }

    forEach(callback) {
      for (const key in this.state) {
        if (this.state.hasOwnProperty(key)) {
          callback(key, this.state[key]);
        }
      }
    }

    remove(key) {
      if (key in this.state) {
        delete this.state[key];
        this.saveState();
      }
    }

    saveState() {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    }
  }

  class DummyObject {
    set() {}
    setProperty() {}
    setObject() {}
    get() {}
    getProperty() {}
    forEach() {}
    remove() {}
  }

  let persistedSettings;
  if (options.persistIndicatorState) {
    persistedSettings = new LocalStorageObject("indicator-settings");
  } else {
    persistedSettings = new DummyObject();
  }

  // Imported icons

  const svgNS = "http://www.w3.org/2000/svg";
  const iconoirEyeSvg =
    '<?xml version="1.0" encoding="UTF-8"?><svg width="24px" height="24px" viewBox="0 0 24 24" stroke-width="1.5" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M3 13C6.6 5 17.4 5 21 13" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 17C10.3431 17 9 15.6569 9 14C9 12.3431 10.3431 11 12 11C13.6569 11 15 12.3431 15 14C15 15.6569 13.6569 17 12 17Z" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
  const iconoirXmarkSvg =
    '<?xml version="1.0" encoding="UTF-8"?><svg width="24px" height="24px" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M6.75827 17.2426L12.0009 12M17.2435 6.75736L12.0009 12M12.0009 12L6.75827 6.75736M12.0009 12L17.2435 17.2426" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
  const iconoirSettingsSvg =
    '<?xml version="1.0" encoding="UTF-8"?><svg width="24px" height="24px" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M19.6224 10.3954L18.5247 7.7448L20 6L18 4L16.2647 5.48295L13.5578 4.36974L12.9353 2H10.981L10.3491 4.40113L7.70441 5.51596L6 4L4 6L5.45337 7.78885L4.3725 10.4463L2 11V13L4.40111 13.6555L5.51575 16.2997L4 18L6 20L7.79116 18.5403L10.397 19.6123L11 22H13L13.6045 19.6132L16.2551 18.5155C16.6969 18.8313 18 20 18 20L20 18L18.5159 16.2494L19.6139 13.598L21.9999 12.9772L22 11L19.6224 10.3954Z" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
  const iconoirNavArrowDownSvg =
    '<?xml version="1.0" encoding="UTF-8"?><svg width="24px" height="24px" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M6 9L12 15L18 9" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
  const iconoirNavArrowUpSvg =
    '<?xml version="1.0" encoding="UTF-8"?><svg width="24px" height="24px" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M6 15L12 9L18 15" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
  const iconoirEditPencilSvg =
    '<?xml version="1.0" encoding="UTF-8"?><svg width="24px" height="24px" viewBox="0 0 24 24" stroke-width="1.5" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M14.3632 5.65156L15.8431 4.17157C16.6242 3.39052 17.8905 3.39052 18.6716 4.17157L20.0858 5.58579C20.8668 6.36683 20.8668 7.63316 20.0858 8.41421L18.6058 9.8942M14.3632 5.65156L4.74749 15.2672C4.41542 15.5993 4.21079 16.0376 4.16947 16.5054L3.92738 19.2459C3.87261 19.8659 4.39148 20.3848 5.0115 20.33L7.75191 20.0879C8.21972 20.0466 8.65806 19.8419 8.99013 19.5099L18.6058 9.8942M14.3632 5.65156L18.6058 9.8942" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>';

  function svgToDataURL(svg) {
    const escapedSvg = svg
      .replace(/"/g, "'")
      .replace(/%/g, "%25")
      .replace(/#/g, "%23")
      .replace(/{/g, "%7B")
      .replace(/}/g, "%7D")
      .replace(/</g, "%3C")
      .replace(/>/g, "%3E");
    return `data:image/svg+xml,${escapedSvg}`;
  }

  // d3fc style helper functions

  const setFillColor = (colors, opacity) => {
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
  function specialgrid(sel) {
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

  function flatgrid(sel) {
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

  function attr(k, v) {
    return function (sel) {
      return sel.each(function () {
        const self = d3.select(this);
        self.style(k, v);
      });
    };
  }

  const displayNone = attr("display", "none");
  const displayBlock = attr("display", "block");

  function disablePane(id) {
    d3.selectAll(`${id} .plot-area`).call(displayNone);
    d3.selectAll(`${id} .cartesian-chart`).call(flatgrid);
    d3.selectAll(`${id}`).call(attr("flex", "0"));
  }

  function enablePane(id) {
    d3.selectAll(`${id} .plot-area`).call(displayBlock);
    d3.selectAll(`${id} .cartesian-chart`).call(specialgrid);
    d3.selectAll(`${id}`).call(attr("flex", "1"));
  }

  // Data helpers

  function createWrappedDatum(datum, index, arr) {
    return new Proxy(datum, {
      get(target, prop) {
        if (typeof prop === "string" && !isNaN(prop)) {
          const value = arr[index - Number(prop)];
          if (value == null) {
            return {};
          }
          return value;
        }
        return target[prop];
      },
    });
  }

  // HTML helpers

  function createFormFromObject(elem, obj, callback) {
    // Create the form element
    var form = document.createElement("form");
    form.style.textAlign = "left";
    form.style.marginTop = "1em";
    form.style.fontSize = "1rem";

    // Function to gather form data and call the callback
    function gatherDataAndCallCallback() {
      var formData = {};
      for (var i = 0; i < form.elements.length; i++) {
        var formElement = form.elements[i];
        if (formElement.name) {
          var value = formElement.value;
          if (formElement.type === "number") {
            value = Number(value);
          }
          formData[formElement.name] = value;
        }
      }
      callback(formData);
    }

    // Iterate over each property in the object
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Create a container for each row
        var row = document.createElement("div");
        row.style.marginBottom = "10px";
        row.style.marginLeft = "0.5em";

        // Create a label for the input
        var label = document.createElement("label");
        label.textContent = key + ": ";
        label.style.marginRight = "10px";
        label.style.display = "inline-block";
        label.style.width = "100px";

        // Create the input element
        var input = document.createElement("input");
        input.name = key;
        input.value = obj[key];

        const styleInput = () => {
          input.style.padding = "0.1rem 0.2rem 0.1em 0.2em";
          input.style.border = "1px solid gray";
          input.style.borderRadius = "3px";
        };

        // Determine the type of the input
        if (typeof obj[key] === "string") {
          if (obj[key].startsWith("#")) {
            input.type = "color";
          } else {
            styleInput();
            input.type = "text";
          }
        } else if (typeof obj[key] === "number") {
          styleInput();
          input.type = "number";
        }

        // Add blur event listener to call callback when input loses focus
        input.addEventListener("blur", gatherDataAndCallCallback);

        // Append the label and input to the row
        row.appendChild(label);
        row.appendChild(input);

        // Append the row to the form
        form.appendChild(row);
      }
    }

    elem.appendChild(form);
  }

  function createPopup(titleText, container) {
    const popupContainer = document.createElement("div");
    popupContainer.style.position = "absolute";
    popupContainer.style.backgroundColor = "rgba(238, 238, 238, 0.5)";
    popupContainer.style.width = "100%";
    popupContainer.style.height = "100%";
    popupContainer.style.display = "none";
    popupContainer.style.userSelect = "none";
    popupContainer.style.zIndex = "1";

    popupContainer.onclick = function (e) {
      if (e.target === popupContainer) {
        popupContainer.style.display = "none";
      }
    };

    const popup = document.createElement("div");
    popup.style.width = "400px";
    popup.style.margin = "100px auto";
    popup.style.backgroundColor = "#fff";
    popup.style.position = "relative";
    popup.style.padding = "15px";
    popup.style.boxShadow = "0px 0px 10px rgba(0,0,0,0.5)";

    const title = document.createElement("div");
    title.innerHTML = titleText;
    title.style.fontSize = "1.5rem";
    title.style.padding = "5px";

    const updateTitle = (newTitle) => {
      title.innerHTML = newTitle;
    };

    const contents = document.createElement("div");

    const closeButton = document.createElement("div");
    closeButton.innerHTML = iconoirXmarkSvg;
    closeButton.style.position = "absolute";
    closeButton.style.top = "20px";
    closeButton.style.right = "15px";
    closeButton.style.cursor = "pointer";

    const hidePopup = function () {
      popupContainer.style.display = "none";
    };
    closeButton.onclick = hidePopup;

    popup.appendChild(title);
    popup.appendChild(closeButton);
    popup.appendChild(contents);
    popupContainer.appendChild(popup);

    container.appendChild(popupContainer);

    return [
      popupContainer,
      contents,
      () => {
        popupContainer.style.display = "block";
      },
      updateTitle,
    ];
  }

  // Now the rest of the library code

  let data = userProvidedData.map((datum, index, arr) =>
    createWrappedDatum(datum, index, arr),
  );

  const isOverlappingAndLater = (d1, d2) => {
    // Determine whether d2 contains overlap with d1, and is later than d1
    if (d1.length < 2 || d2.length < 0) {
      return false;
    }
    const d1Last = d1[d1.length - 1].date.getTime();
    const isLater = d2[d2.length - 1].date.getTime() - d1Last >= 0;
    if (!isLater) {
      return false;
    }
    for (var i = d2.length - 1; i > 0; i--) {
      if (
        d2[i].date.getTime() >= d1Last &&
        d2[i - 1].date.getTime() <= d1Last
      ) {
        return true;
      }
    }
    return false;
  };

  const refreshData = (newData, forceRefresh) => {
    // special case for when the chart should just move to the right instead of resetting the X axis zoom
    let shouldMoveRight = false;
    let step = 0;
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
    ohlcElements.open.innerHTML = round2(bar.open);
    ohlcElements.high.innerHTML = round2(bar.high);
    ohlcElements.low.innerHTML = round2(bar.low);
    ohlcElements.close.innerHTML = round2(bar.close);
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

  infoBoxItems = [];

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
            valueElem.innerHTML = value.join(",");
          } else if (isNaN(value)) {
            valueElem.innerHTML = "...";
          } else {
            valueElem.innerHTML = "" + value;
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
    (bar) => round2(bar.volume),
  );

  // Set up the zooming and scaling

  function paddedAccessors() {
    return [
      (d) => d.high + (d.high - d.low) / 3,
      (d) => d.low - (d.high - d.low) / 3,
    ];
  }

  const xScale = fc
    .scaleDiscontinuous(d3.scaleTime())
    .domain(fc.extentDate().accessors([(d) => d.date])(data));
  const yScale = d3
    .scaleLinear()
    .domain(fc.extentLinear().accessors(paddedAccessors())(data));

  const getSmallestDifference = (vals) => {
    if (vals.length < 2) {
      return 0;
    }
    let smallestDifference = Number.MAX_SAFE_INTEGER;
    for (var i = 1; i < vals.length; i++) {
      if (Math.abs(vals[i] - vals[i - 1]) < smallestDifference) {
        smallestDifference = Math.abs(vals[i] - vals[i - 1]);
      }
    }
    return smallestDifference;
  };

  const getStep = () =>
    getSmallestDifference(data.map((x) => x.date.getTime()));

  const refreshXScaleDiscontinuity = () => {
    if (data.length > 1) {
      let step = getStep();

      const ranges = [];
      for (var i = 1; i < data.length; i++) {
        if (data[i].date.getTime() - data[i - 1].date.getTime() > step) {
          ranges.push([
            data[i - 1].date,
            new Date(data[i].date.getTime() - step),
          ]);
        }
      }
      xScale.discontinuityProvider(fc.discontinuityRange(...ranges));
    }
  };

  const moveChartRight = (step) => {
    const oldDomain = xScale.domain();
    xScale.domain([
      new Date(oldDomain[0].getTime() + step),
      new Date(oldDomain[1].getTime() + step),
    ]);
    refreshXScaleDiscontinuity();
  };

  const refreshXDomain = () => {
    if (data.length === 0) {
      return;
    }
    let last = new Date(data[data.length - 1].date.getTime() + getStep());
    let first = data[0].date;
    if (data.length > 100) {
      first = data[data.length - 100].date;
    }
    refreshXScaleDiscontinuity();
    xScale.domain([first, last]);
  };

  refreshXDomain();

  const refreshYDomain = () => {
    if (data.length === 0) {
      return;
    }
    const visibleData = data.filter(
      (d) =>
        xScale(d.date) >= 0 &&
        xScale(d.date) <= d3.select("#ohlc-chart").node().clientWidth,
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
    yScale.domain([min, max]);
  };

  const zoom = fc
    .zoom()
    .duration(0)
    .scaleExtent([0.3, 5])
    .on("zoom", (e) => {
      mousePos.x = e.sourceEvent.layerX;
      refreshYDomain();

      state.textDrawings.forEach(({ x, y, elem }) => {
        elem.setAttributeNS(null, "x", xScale(x));
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
      if (bar) {
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
    const i = indicatorsByName[iName];
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
      const diff2 = (x2 - bar.date) / oneDayMillis;
      if (diff2 > -1 && diff2 < 0) {
        return x2;
      }
      const diff1 = (x1 - bar.date) / oneDayMillis;
      if ((diff1 > 0 && diff1 < 1) || (diff1 > -1 && diff1 < 0)) {
        return x1;
      }
      if (
        (x1 <= x2 && bar.date >= x1 && bar.date <= x2) ||
        (x2 < x1 && bar.date >= x2 && bar.date <= x1)
      ) {
        return bar.date;
      }
    };
  }

  function getLineMainValueFn(x1, y1, x2, y2) {
    const slope = (y2 - y1) / (x2 - x1);
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
      return y1 + (bar.date.getTime() - x1.getTime()) * slope;
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

  function addTextDrawing(x, y, text) {
    const ohlcSvg = document.querySelector("#ohlc-chart .plot-area svg");
    if (ohlcSvg) {
      const newText = document.createElementNS(svgNS, "text");
      newText.setAttributeNS(null, "x", xScale(x));
      newText.setAttributeNS(null, "y", yScale(y));
      newText.style.textAnchor = "middle";
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
    const volumeValues = data.map((d) => d.volume);
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

    priceChangeCallbacks.forEach((fn) => fn(nearest));

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
    const yLabelText = round2(activeYScale.invert(adjustedY));
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

    renderCrosshair();
  }

  render();

  // Add persisted indicators from the previous load
  // This goes at the end because it relies on state initialized above
  persistedSettings.forEach((id, state) => {
    if (id === "volume" || id === "ohlcBox") {
      return;
    }
    const i = indicatorsByName[state.iName];
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
  };
}

window.FirChart = FirChart;
