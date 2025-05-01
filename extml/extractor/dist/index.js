"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//import { extractFromUrl } from "./core";
const server_1 = require("./server");
// const targetUrl = "https://do-doors.ru/";
// const targetUrl = "https://logopolise.ru/";
// const targetUrl = "https://codenrock.com/";
// const targetUrl = "https://govorysha.ru/";
(async () => {
    // await extractFromUrl(targetUrl, 1);
    (0, server_1.startServer)(5500);
})();
