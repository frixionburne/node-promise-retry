const retry = require('./index');
const assert = require("assert");

// retry.debug(true);

const instantResolve = (arg1, arg2, arg3) => {
    return new Promise((resolve, reject) => {
        resolve({ arg1, arg2, arg3 });
    })
}

const instantReject = (arg1, arg2, arg3) => {
    return new Promise((resolve, reject) => {
        reject({ arg1, arg2, arg3 });
    })
}

const instantHardReject = (arg1, arg2, arg3) => {
    return new Promise((resolve, reject) => {
        reject(retry.stop({ arg1, arg2, arg3 }));
    })
}

const someRejectPattern = [true, true, true, false];
let someRejectIndex = 0;

const someRejects = (arg1, arg2, arg3) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (someRejectPattern[someRejectIndex]) {
                someRejectIndex++;
                reject("FAIL");
            } else {
                resolve({ arg1, arg2, arg3 });
            }
        }, 500);
    })
}

const tooManyRetryPattern = [true, true, true, true, true, true, false];
let tooManyRetryIndex = 0;

const tooManyRetries = (arg1, arg2, arg3) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (tooManyRetryPattern[tooManyRetryIndex]) {
                tooManyRetryIndex++;
                reject({ arg1, arg2, arg3 });
            } else {
                resolve("FAIL");
            }
        }, 500);
    })
}

const hardRejectPattern = [true, true, true, true, true, true, false];
let hardRejectIndex = 0;

const hardReject = (arg1, arg2, arg3) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (hardRejectPattern[hardRejectIndex]) {
                if (hardRejectIndex === 3) {
                    reject(retry.stop({ arg1, arg2, arg3 }));
                    return;
                }
                hardRejectIndex++;
                reject("FAIL");
                return;
            }
            else {
                resolve("FAIL");
                return;
            }
        }, 500);
    })
}

const testInstantResolveWithRetry = () => {
    return retry.run(instantResolve, ["one", "two", "three"], 100, 5);
}

const testInstantRejectWithRetry = () => {
    return retry.run(instantReject, ["one", "two", "three"], 100, 5);
}

const testInstantHardRejectWithRetry = () => {
    return retry.run(instantHardReject, ["one", "two", "three"], 100, 5);
}

const testSomeRejectsWithRetry = () => {
    return retry.run(someRejects, ["one", "two", "three"], 100, 5);
}

const testTooManyRetriesWithRetry = () => {
    return retry.run(tooManyRetries, ["one", "two", "three"], 100, 5);
}

const testHardRejectWithRetry = () => {
    return retry.run(hardReject, ["one", "two", "three"], 100, 5);
}

const allPromises = [
    testInstantResolveWithRetry,
    testInstantRejectWithRetry,
    testInstantHardRejectWithRetry,
    testSomeRejectsWithRetry,
    testTooManyRetriesWithRetry,
    testHardRejectWithRetry
];

const fakePromise = Promise.resolve(null);
allPromises.reduce(
    (previous, current) => previous.then(() => current()
        .then((data) => {
            assert.equal(data.arg1, "one");
            console.log(data);
        })
        .catch(error => {
            assert.equal(error.arg1, "one");
            console.error(error);
        })
    ),
    fakePromise
);