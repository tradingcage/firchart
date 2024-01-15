export class LocalStorageObject {
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

export class DummyObject {
  set() {}
  setProperty() {}
  setObject() {}
  get() {}
  getProperty() {}
  forEach() {}
  remove() {}
}
