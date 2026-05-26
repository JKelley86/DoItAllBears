import { initArcadeRoom } from './arcadeRoom.js';
import { initEconomy } from './economy.js';
import { initUI } from './ui.js';

import { startWheelGame } from './games/wheel.js';
import { startPinball } from './games/pinball.js';
import { startSkeeBall } from './games/skeeball.js';
import { startAirHockey } from './games/airhockey.js';

window.arcadeGames = {
    wheel: startWheelGame,
    pinball: startPinball,
    skeeball: startSkeeBall,
    airhockey: startAirHockey
};

initEconomy();
initUI();
initArcadeRoom();
