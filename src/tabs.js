// TabManager.js
// JavaScript class for managing multiple tabs via BroadcastChannel,
// with human-friendly labels, immediate peer discovery, and filtering initial replies.

class TabManager {
  /**
   * @param {string} channelName
   * @param {number} heartbeatInterval
   * @param {number} staleTimeout
   * @param {string} initialLabel
   */
  constructor(
    channelName = 'tab-manager',
    heartbeatInterval = 2000,
    staleTimeout = 5000,
    initialLabel = ''
  ) {
    this.channel = new BroadcastChannel(channelName);
    this.id = (crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
    this.label = initialLabel;
    this.heartbeatInterval = heartbeatInterval;
    this.staleTimeout = staleTimeout;

    // Map<tabId, { label, lastSeen }>
    this.tabs = new Map();
    this.handlers = { join: [], leave: [], message: [], tabsChanged: [] };

    this.channel.onmessage = this._handleMessage.bind(this);
    this._startHeartbeat();
    // Announce presence to existing tabs
    this._announce({ type: 'join', label: this.label });

    window.addEventListener('beforeunload', () => {
      this._announce({ type: 'leave', label: this.label });
    });
  }

  /** Rename current tab */
  setLabel(newLabel) {
    this.label = newLabel;
    this._announce({ type: 'label', label: this.label });
    this._emit('tabsChanged', this.getTabs());
  }

  _startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this._announce({ type: 'heartbeat', label: this.label });
      this._cleanupStale();
    }, this.heartbeatInterval);
  }

  _handleMessage(event) {
    const { type, id, to, payload, label } = event.data;
    if (!id || id === this.id) return;
    const now = Date.now();

    switch (type) {
      case 'join': {
        const isDirected = to === this.id;
        const alreadyKnown = this.tabs.has(id);
        if (!alreadyKnown) {
          this.tabs.set(id, { label: label || '', lastSeen: now });
          // Emit join only for true broadcasts (peer opened after us)
          if (!isDirected) {
            this._emit('join', { id, label });
            this._emit('tabsChanged', this.getTabs());
          }
        } else {
          const info = this.tabs.get(id);
          if (label && info.label !== label) {
            info.label = label;
            this._emit('tabsChanged', this.getTabs());
          }
          info.lastSeen = now;
        }
        // If broadcast, reply directed so new tab learns us instantly
        if (!isDirected) {
          this._announce({ type: 'join', label: this.label, to: id });
        }
        break;
      }

      case 'heartbeat': {
        const alreadyKnown = this.tabs.has(id);
        const isDirected = to === this.id;
        if (!alreadyKnown) {
          this.tabs.set(id, { label: label || '', lastSeen: now });
          this._emit('tabsChanged', this.getTabs());
          // reply directed
          this._announce({ type: 'join', label: this.label, to: id });
        } else {
          this.tabs.get(id).lastSeen = now;
        }
        break;
      }

      case 'leave': {
        if (this.tabs.has(id)) {
          const { label: oldLabel } = this.tabs.get(id);
          this.tabs.delete(id);
          this._emit('leave', { id, label: oldLabel });
          this._emit('tabsChanged', this.getTabs());
        }
        break;
      }

      case 'label': {
        if (this.tabs.has(id)) {
          this.tabs.get(id).label = label || '';
          this._emit('tabsChanged', this.getTabs());
        }
        break;
      }

      case 'message': {
        if (!to || to === this.id) {
          this._emit('message', { from: id, fromLabel: label, payload });
        }
        break;
      }

      default:
        console.warn(`Unknown message type: ${type}`);
    }
  }

  _announce(data) {
    this.channel.postMessage({ ...data, id: this.id, timestamp: Date.now() });
  }

  _cleanupStale() {
    const now = Date.now();
    let changed = false;
    for (const [tid, info] of this.tabs) {
      if (now - info.lastSeen > this.staleTimeout) {
        this.tabs.delete(tid);
        this._emit('leave', { id: tid, label: info.label });
        changed = true;
      }
    }
    if (changed) this._emit('tabsChanged', this.getTabs());
  }

  sendMessage(to, payload) {
    this._announce({ type: 'message', to: to || null, payload, label: this.label });
  }

  getTabs() {
    return [...this.tabs.entries()].map(([id, info]) => ({ id, label: info.label }));
  }

  on(event, handler) {
    if (!this.handlers[event]) throw new Error(`Unknown event '${event}'`);
    this.handlers[event].push(handler);
  }

  _emit(event, data) {
    this.handlers[event].forEach(fn => { try { fn(data); } catch {} });
  }

  destroy() {
    clearInterval(this.heartbeatTimer);
    this.channel.close();
    window.removeEventListener('beforeunload', this._announce);
  }
}

export default TabManager;



// Initialize manager
const manager = new TabManager('collab-channel', 2000, 5000, document.title);

function updateVisibleContent() {
  // Build a sorted list of all active tab IDs (including self)
  const allIds = manager.getTabs().map(t => t.id).concat(manager.id);
  allIds.sort();  // deterministic order across tabs by lexicographic ID

  // Determine 1-based position of this tab
  const myIndex = allIds.indexOf(manager.id) + 1;

  // Show only the matching element, hide others
  document.querySelectorAll('[data-tab]').forEach(el => {
    const target = Number(el.dataset.tab);
    el.classList.toggle('hidden', target !== myIndex);
  });
}

// Bind event and initial run
manager.on('tabsChanged', updateVisibleContent);
updateVisibleContent();
