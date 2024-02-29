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
  let emaValue = null;

  for (var i = length - 1; i >= 0; i--) {
    if (bar[i][accessor] == null) {
      continue;
    }
    if (emaValue === null) {
      let smaValue = sma(bar[i], length, accessor);
      emaValue = bar[i][accessor] * k + smaValue * (1 - k);
    } else {
      emaValue = bar[i][accessor] * k + emaValue * (1 - k);
    }
  }
  return emaValue;
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

const simpleMovingAverageIndicator = {
  name: (i) => `SMA (${i.options.length})`,
  type: "line",
  options: {
    color: "#1111AA",
    length: 20,
  },
  fn: (bar, options) => {
    return sma(bar, options.length, "close");
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
    return ema(bar, options.length, "close");
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
    return atr(bar, options.length);
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
      middleLine + range * options.multiplier,
      middleLine,
      middleLine - range * options.multiplier,
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
      middleBand + sd * options.stdev,
      middleBand,
      middleBand - sd * options.stdev,
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
      rsi(bar, options.length, "close"),
      options.lowerLevel,
    ];
  },
};

export const indicators = {
  sma: simpleMovingAverageIndicator,
  ema: exponentialMovingAverageIndicator,
  atr: averageTrueRangeIndicator,
  keltnerChannels: keltnerChannelsIndicator,
  bollingerBands: bollingerBandsIndicator,
  rsi: rsiIndicator,
};
