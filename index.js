"use strict";

class StopRetry {
    constructor(payload) {
        this.name = "StopRetry";
        this.payload = payload;
    }
}

let showLogs = false;
const debug = (val) => {
    showLogs = val;
}

const logInfo = (recursionLevel, operationName, message, ...objects) => {
    if (showLogs) {
        const padding = recursionLevel === 0 ? "" : "  ".repeat(recursionLevel);
        if (typeof message === 'string') {
            console.log(`${padding}RETRY OP: ${operationName} - ${message}`, ...objects);
        } else {
            console.log(`${padding}RETRY OP: ${operationName} - `, message, ...objects);
        }
    }
}

const wait = ms => new Promise(r => setTimeout(r, ms));

const stop = (payload) => {
    return new StopRetry(payload);
}

const run = (operation, args, delay, retries, maxRetries = null) => new Promise((resolve, reject) => {
    if (maxRetries == null) {
        maxRetries = retries;
    }

    const rLvl = maxRetries - retries;
    const opName = operation.name;

    return operation(...args)
        .then(payload1 => {
            logInfo(rLvl, opName, "RESOLVED. SUCCESS PAYLOAD: ", payload1);
            resolve(payload1);
        })
        .catch(error1 => {
            logInfo(rLvl, opName, "CATCH. ERROR PAYLOAD: ", error1);
            if (error1 instanceof StopRetry) {
                logInfo(rLvl, opName, "FORCE STOP. ERROR PAYLOAD: ", error1);
                return reject(error1.payload);
            }
            if (retries > 0) {
                logInfo(rLvl, opName, `RETRY - RETRIES: ${retries}, DELAY: ${delay}`);
                return wait(delay)
                    .then(() => {
                        logInfo(rLvl, opName, "RETRY - BIND");
                    })
                    .then(run.bind(null, operation, args, delay, retries - 1, maxRetries))
                    .then(payload2 => {
                        logInfo(rLvl, opName, "RETRY - RESOLVE. SUCCESS PAYLOAD: ", payload2);
                        resolve(payload2);
                    })
                    .catch(error2 => {
                        logInfo(rLvl, opName, "RETRY - CATCH. ERROR PAYLOAD: ", error2);
                        reject(error2);
                    })
            }
            logInfo(rLvl, opName, "OUT OF RETRIES. ERROR PAYLOAD:", error1);
            return reject(error1);
        });
});

module.exports = { run, wait, stop, debug };