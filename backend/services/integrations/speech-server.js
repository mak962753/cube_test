
// cors options on this URL: https://github.com/expressjs/cors#configuration-options
import _ from "lodash";
import path from "path";
import { Server } from "socket.io";
import { analyzeSpeechChunk, connectEmlo, disconnectEmlo } from "./speech-emlo.js";

export function initSpeechListener(server) {

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("error", e => {
    console.log(`Socket Server: error happened`);
    console.log(err);
  });

  io.on("connection", async socket => {

    const emloSocket = await connectEmlo(data => {
        console.log(`Socket Server: analysisReady - data: ${JSON.stringify(data)}`);
        const emotions = getEmotionsFromAnalysis(data);
        console.log(`Socket Server: analysisReady - emotions: ${JSON.stringify(emotions)}`);
        if (_.keys(emotions).length)
            socket.emit("analysisReady", emotions);
    });


    socket.on("stream", async (data) => {
        console.log(`Socket Server: Received from client: ${data.byteLength}`);
        speechBufs.push(data);
        await analyzeSpeechChunk(emloSocket, data.slice(44));
    });

    const speechBufs = [];

    const clearSpeechBufs = () => {
        speechBufs.length = 0;
    };

    socket.on("disconnect", async () => {
      disconnectEmlo(emloSocket);
      clearSpeechBufs();
      console.log('Socket Server: client disconnected');
    });

    console.log('Socket Server: client connected');
  });
}

function getEmotionsFromAnalysis(data) {
    if (!data.headers || !data.channels?.length) {
        return {}
    }
    console.log(data)
    const paramMap = {
        Emotional: 'EDP-Emotional',
        Uneasy: 'EDP-Uneasy',
        Stressful: 'EDP-Stressful',
        Thoughtful: 'EDP-Thoughtful',
        Confident: 'EDP-Confident',
        Concentrated: 'EDP-Concentrated',
        Energetic: 'EDP-Energetic',
        Passionate: 'EDP-Passionate',
    };

    return _.mapValues(paramMap, (v, k) => {
        const index = data.headers[v];
        return typeof index === "undefined" ? 0 : data.channels[0][data.headers[v]];
    });
}

function mergeAudioBuffers(buffers) {

  const size = buffers.reduce((a, b) => a + b.byteLength, 0);

  const [, dataArray, dataSize] = buffers.reduce(([ofs, result, totalDataSize], i, j) => {
      i = new Uint8Array(i);
      totalDataSize += new DataView(i.buffer).getUint32(40, true);
      if (j > 0) {
          i = i.slice(44);
      }
      result.set(i, ofs);
      ofs += i.byteLength;
      return [ofs, result, totalDataSize];
  }, [0, new Uint8Array(size), 0]);

  const bv = new DataView(dataArray.buffer);

  bv.setUint32(4, 36 + dataSize, true); // set chunk size (data + chunk header)
  bv.setUint32(40, dataSize, true);     // set audio data size

  return dataArray;
}