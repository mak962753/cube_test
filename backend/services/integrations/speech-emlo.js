import * as io from "socket.io-client";
import timers from "timers";
const OUTPUT_TYPE = 'json';
const ANALYSIS_SERVER_URL = "ws://localhost:2259";

const SAMPLES_NUM_CHANNELS = 1;
const SAMPLES_BIT_RATE = 16;
const SAMPLES_SAMPLE_RATE = 16000;
const SAMPLES_BACKGROUND_NOISE = 1000;


export async function connectEmlo(analysisReadyCallback) {
  return await init(analysisReadyCallback);
}

export async function disconnectEmlo(socket) {
  disconnect(socket);
}

export async function analyzeSpeechChunk(socket, chunkBuffer) {
  if (socket && socket.connected) {
    socket.emit("audio-stream", chunkBuffer);
  }
}

function init(analysisReadyCallback) {

  try {

    const socket = connect(ANALYSIS_SERVER_URL, {
        onConnectionSuccess() {
            handshake(socket, OUTPUT_TYPE);
        },
        async onConnectionError(err) {

        }
    });

    //
    socket.on("audio-analysis-error", (err) => {
      console.log('EMLO: Audio analysis error: ' + err);
      throw err;
    });

    // check for errors
    socket.on("analysis-error", err => {
        console.log('EMLO: Analysis error: ' + err);
        throw err;
    });

    socket.on('audio-analysis', async (r) => {
        console.log('EMLO: Alanysis has been received');

        if (r.success) {
            console.log(`EMLO: Alanysis has been received...`);
            socket._headers = r.data.headers || socket._headers;
            r.data.headers = socket._headers;
            analysisReadyCallback?.(r.data);

        //if (r.data.done) {
        //     console.log('EMLO: Alanysis has been done');
        //     console.log(JSON.stringify(r.data));
        //     analysisReadyCallback?.(r.data);
        //   } else if (r.data.segment && r.data.segment.ready) {
        //     console.log('EMLO: Segment ready');
        //   }
        //   else {
        //     console.log('EMLO: Segment not ready');
        //   }
        } else {
          throw new Error(r.error);
        }
    });



    return socket;

  } catch (err) {
    console.log('EMLO: Error: "' + err + '"');
    throw err;
  }
}

/**
 *
 * @param {string} url
 * @param {Object} params
 * @param {(socket: io.Socket) => void} [params.onConnectionError]
 * @param {(err: Error) => void} [params.onConnectionSuccess]
 * @returns {io.Socket} - socket
 */
function connect(url, {
    onConnectionSuccess,
    onConnectionError,
}) {
    const socket = io.connect(url, {
        transports: ["websocket"]
    });

    socket.on("connect", () => {
        console.log("EMLO: Connection to the EMLO service has been established successfully");
        onConnectionSuccess?.(socket);
    });

    socket.on("connect_error", err => {
        console.log(`EMLO: Connection to the EMLO service has been failed. ${err}`);
        onConnectionError?.(err);
    });

     return socket;
}

async function disconnect(socket) {
  if (!socket) {
    return;
  }

  socket.disconnect();
  socket = undefined;

  console.log("EMLO: Connection to the EMLO service was closed");
}

/**
 *
 * @param {io.Socket} socket
 * @param {string} outputType
 * @returns
 */
function handshake(socket, outputType) {
    console.log("EMLO: Establishing a handshake....");

    if (!socket?.connected) {
        console.error(`EMLO: a handshake could not be established - SOCKET IS CLOSED`);
        return;
    }

    const onHandshakeDone = async r => {
        socket.off("handshake-done", onHandshakeDone);

        if (r.success) {
            console.log("EMLO: the handshake has been established! data: " + JSON.stringify(r.data));
        } else {
            console.error(`EMLO: Handshake could not be stablished has been failed. ${err}`);

            await timers.promises.setTimeout(2000);

            handshake(socket, outputType);
        }
    };

    socket.off("handshake-done", onHandshakeDone);
    socket.on("handshake-done", onHandshakeDone);

    socket.emit("handshake", {
        isPCM: true,
        channels: SAMPLES_NUM_CHANNELS,
        backgroundNoise: SAMPLES_BACKGROUND_NOISE,
        bitRate: SAMPLES_BIT_RATE,
        sampleRate: SAMPLES_SAMPLE_RATE,
        outputType,
    });
}