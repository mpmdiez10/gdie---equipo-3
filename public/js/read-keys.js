// filepath: /public/js/read-keys.js
import { eventBus } from './event-bus.js';

async function readKeysFile() {
    const response = await fetch('path/to/keys.vtt');
    const text = await response.text();
    eventBus.next({ type: 'keysFileLoaded', data: text });
}

readKeysFile();