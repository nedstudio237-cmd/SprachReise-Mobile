import { Client } from '@stomp/stompjs';
import { API_BASE_URL } from '../constants/config';

// Spring STOMP expose /ws/websocket comme endpoint WebSocket natif
// (compatible Expo Go sans SockJS)
const BROKER_URL = API_BASE_URL
  .replace('/api', '/ws/websocket')
  .replace('http://', 'ws://')
  .replace('https://', 'wss://');

class SocketService {
  _client  = null;
  _subs    = {};
  _ready   = false;
  _queue   = [];
  _token   = null;

  connect(token, onConnected) {
    // Déjà connecté avec le même token → juste appeler le callback
    if (this._client?.active && this._token === token) {
      if (this._ready) onConnected?.();
      else this._queue.push(() => onConnected?.());
      return;
    }

    // Nouveau token ou pas encore connecté → (re)créer le client
    if (this._client?.active) this._client.deactivate();
    this._token = token;
    this._ready = false;

    this._client = new Client({
      brokerURL: BROKER_URL,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        this._ready = true;
        onConnected?.();
        this._queue.forEach(fn => fn());
        this._queue = [];
      },
      onDisconnect:  () => { this._ready = false; },
      onStompError:  (frame) => {
        console.warn('[STOMP] error', frame.headers?.message);
        this._ready = false;
      },
      onWebSocketError: (e) => {
        console.warn('[WS] error', e?.message ?? e);
        this._ready = false;
      },
    });

    this._client.activate();
  }

  subscribe(destination, callback) {
    const doSub = () => {
      if (this._subs[destination]) {
        try { this._subs[destination].unsubscribe(); } catch {}
      }
      if (this._client?.active) {
        this._subs[destination] = this._client.subscribe(destination, callback);
      }
    };

    if (this._ready) doSub();
    else this._queue.push(doSub);
  }

  unsubscribe(destination) {
    if (this._subs[destination]) {
      try { this._subs[destination].unsubscribe(); } catch {}
      delete this._subs[destination];
    }
  }

  disconnect() {
    this._ready = false;
    this._token = null;
    this._queue = [];
    Object.values(this._subs).forEach(s => { try { s.unsubscribe(); } catch {} });
    this._subs = {};
    this._client?.deactivate();
    this._client = null;
  }
}

export default new SocketService();
