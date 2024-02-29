export function deepCopy(obj) {
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

  // If it's a export function or other type, return it as is
  return obj;
}

export function generateRandomString(length) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return "x" + result;
}

export function hexToRgba(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const a = 1; // alpha value is 1 for full opacity
  return [r, g, b, a];
}

export function round2(num) {
  return Math.round(num * 100) / 100;
}

export function round4(num) {
  return Math.round(num * 10000) / 10000;
}

export function removeObjectFromArray(array, object) {
  const index = array.indexOf(object);
  if (index > -1) {
    array.splice(index, 1);
  }
}

export function sameSign(a, b) {
  return Math.sign(a) === Math.sign(b);
}

export function getMostCommonDifference(vals) {
  if (vals.length < 2) {
    return 0;
  }

  let mostCommonDifference = 0;
  const differencesMap = { 0: 0 };
  for (var i = 1; i < vals.length; i++) {
    const difference = Math.abs(vals[i] - vals[i - 1]);
    if (differencesMap[difference] !== undefined) {
      differencesMap[difference] = 0;
    }
    differencesMap[difference] += 1;
    if (differencesMap[difference] > differencesMap[mostCommonDifference]) {
      mostCommonDifference = difference;
    }
  }

  return mostCommonDifference;
}
