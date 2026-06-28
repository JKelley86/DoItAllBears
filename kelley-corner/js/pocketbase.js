import PocketBase from 'https://esm.sh/pocketbase';

import { config } from "./config.js";

const pb = new PocketBase(
    config.pocketbaseURL
);

export default pb;
