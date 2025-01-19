<template>
    <template v-if="!isMicrophoneEnabled">
            <div class="flex flex-col items-center gap-4 bg-transparent">
                <AlertError
                    title="Warning!"
                    text="Please allow microphone access."
                />
            </div>
    </template>
    <template v-else>
        <div class="flex flex-col flex-initial items-center justify-center gap-4 mt-8 w-full">
            <div class="flex gap-4">
                <Button @click="start" :disabled="isStarted">Start</Button>
                <Button @click="stop" outline :disabled="!isStarted">Stop</Button>
            </div>
            <div class="flex w-full justify-center gap-4">
                <CubeScene class="justify-center gap-4 items-center" ref="refCube">
                    <div class="grow-1">
                        <div>
                            <Select label="Up" v-model="selectedUp" :options="upOptions" />
                        </div>
                        <div>
                            <Select label="Down" v-model="selectedDown" :options="downOptions" />
                        </div>
                        <div>
                            <Select label="Right" v-model="selectedRight" :options="rightOptions"  />
                        </div>
                        <div>
                            <Select label="Left" v-model="selectedLeft" :options="leftOptions"  />
                        </div>
                    </div>
                </CubeScene>

            </div>
            <div class="max-h-64 h-full overflow-y-scroll w-full p-2 border rounded-md bg-gray-200 border-blue-200 flex flex-col gap-2 max-w-screen-lg">
                <div v-for="l in logLines" :class="l.css">{{l.text}}</div>
            </div>
        </div>
        <div v-if="!connection.socket?.connected"
            class="fixed inset-0 bg-opacity-80 flex flex-col items-center pt-12 gap-4 bg-white">
            <AlertError
                title="Warning!"
                :text="`Connecting to server '${config.WS_BASE_SERVER_URL}'...`"
            />
            <Button @click="refCube?.left(0.5)">left</Button>
            <Button @click="refCube?.right(0.5)">right</Button>
            <Button @click="refCube?.forward(0.5)">forth</Button>
            <Button @click="refCube?.back(0.5)">back</Button>
        </div>
    </template>
</template>


<script lang="ts" setup>

import CubeScene from '@/components/cube-scene.vue';
import Select from '@/components/ui/Select.vue';

import { computed, onMounted, onUnmounted, shallowRef, unref } from 'vue';
import AlertError from '@/components/ui/alert-error.vue';
import Button  from '@/components/ui/button.vue';
import RecordRTC from "recordrtc";
import {io, Socket} from "socket.io-client";
import * as config from "@/services/config";

interface CubeExports {
    back(factor: number): void;
    forward(factor: number): void;
    left(factor: number): void;
    right(factor: number): void;
}
const EMOTION_NAMES = {
    Emotional: 'Emotional',
    Uneasy: 'Uneasy',
    Stressful: 'Stressful',
    Thoughtful: 'Thoughtful',
    Confident: 'Confident',
    Concentrated: 'Concentrated',
    Energetic: 'Energetic',
    Passionate: 'Passionate',
}

const emotionOptions = Object.keys(EMOTION_NAMES).map(key => ({label: key, value: key}));

const isMicrophoneEnabled = shallowRef(false);
const refCube = shallowRef<CubeExports|null>(null);
const isStarted = shallowRef(false);
const selectedUp = shallowRef(EMOTION_NAMES.Energetic);
const selectedDown = shallowRef(EMOTION_NAMES.Thoughtful);
const selectedRight = shallowRef(EMOTION_NAMES.Passionate);
const selectedLeft = shallowRef(EMOTION_NAMES.Concentrated);
const logLines = shallowRef<{css: string, text: string}[]>([]);
let recorder: RecordRTC.StereoAudioRecorder|null = null;
const connection = shallowRef<{socket: Socket | null}>({socket: null});

const COMMANDS = computed<Record<string, (cube: CubeExports, factor: number) => void>>(() => ({
    [selectedUp.value]: (c: CubeExports, factor: number) => c.back(factor),
    [selectedDown.value]: (c: CubeExports, factor: number) => c.forward(factor),
    [selectedLeft.value]: (c: CubeExports, factor: number) => c.left(factor),
    [selectedRight.value]: (c: CubeExports, factor: number) => c.right(factor),
})) ;

const upOptions = computed(() => Object.keys(EMOTION_NAMES).filter(k => k === selectedUp.value || !(k in COMMANDS.value)).map(k => ({label: k, value: k})));
const downOptions = computed(() => Object.keys(EMOTION_NAMES).filter(k => k === selectedDown.value || !(k in COMMANDS.value)).map(k => ({label: k, value: k})));
const leftOptions = computed(() => Object.keys(EMOTION_NAMES).filter(k => k === selectedLeft.value || !(k in COMMANDS.value)).map(k => ({label: k, value: k})));
const rightOptions = computed(() => Object.keys(EMOTION_NAMES).filter(k => k === selectedRight.value || !(k in COMMANDS.value)).map(k => ({label: k, value: k})));

onMounted(() => {
    checkMicAccess();
    connect();
});

onUnmounted(() => {
    stop();
    connection.value.socket?.disconnect();
});


function start() {
    if (isStarted.value)
        return;

    isStarted.value = true;

    navigator.mediaDevices.getUserMedia({audio: true}).then(stream => {
        recorder?.stop(() => {});
        recorder = null;
        recorder = createRecorder(stream);
        recorder.record();
    });
}

function stop() {
    isStarted.value = false;
    recorder?.stop(() => {});
    recorder = null;
}

function connect() {
    if (connection.value.socket) {
        return;
    }

    const s = io(config.WS_BASE_SERVER_URL);

    s.on("connect", async () => {
        log("Socket connected...");
        connection.value = {...(connection.value || {}) }; // just refresh it to update UI
    });

    s.on("disconnect", () => {
        log("Disconnected...")
        stop();
    });

    s.on("analysisReady", data => {

        log(`Socket - analysisReady: ${JSON.stringify(data)}`);
        runEmotions(data);
        //   emloEmotions.value = Object.keys(json).map(key => ({text: key, value: json[key]}));
        //   emloEmotionsSet.push(json);
    });

    connection.value = {socket: s};
}

function checkMicAccess() {
    navigator.permissions.query(
        // { name: 'camera' }
        { name: 'microphone' }
        // { name: 'geolocation' }
        // { name: 'notifications' }
        // { name: 'midi', sysex: false }
        // { name: 'midi', sysex: true }
        // { name: 'push', userVisibleOnly: true }
        // { name: 'push' } // without userVisibleOnly isn't supported in chrome M45, yet
    ).then(function(permissionStatus){
        //console.log(permissionStatus.state); // granted, denied, prompt
        isMicrophoneEnabled.value = "granted" === permissionStatus.state;
        if (!isMicrophoneEnabled.value) {
            navigator.mediaDevices.getUserMedia({audio: true});
        }
        permissionStatus.onchange = function() {
            isMicrophoneEnabled.value = "granted" === permissionStatus.state;
        };
    })
}

/*
navigator.getUserMedia({audio: true}, stream => {

      micMediaRecorder.value = createRecorder(stream);
      micMediaRecorder.value.startRecording();

    }, async err => {

      console.error(JSON.stringify(err));
      await stopMicQuestionStreaming();
    });
*/

function onAudioSliceAvailable(blob: Blob): void {
    new Response(blob)
        .arrayBuffer()
        .then(b => {
            connection.value.socket?.emit("stream", b);
        });
}

function createRecorder (stream: MediaStream) : RecordRTC.StereoAudioRecorder {
    return new RecordRTC.StereoAudioRecorder(stream, {
        type: 'audio',

        mimeType: 'audio/wav',

        recorderType: RecordRTC.StereoAudioRecorder,

        // Dialogflow / STT requires mono audio
        numberOfAudioChannels: 1,

        // get intervals based blobs value in milliseconds
        // as you might not want to make detect calls every seconds
        timeSlice: 200,

        // only for audio track
        // audioBitsPerSecond: 128000,

        // used by StereoAudioRecorder the range 22050 to 96000.
        // let us force 16khz recording:
        desiredSampRate: 16000,
        //sampleRate: AUDIO_SAMPLE_RATE, // this sampleRate should be the same in your server code

        disableLogs: true,

        ondataavailable: onAudioSliceAvailable,
    });


};

function log(text: string) {
    console.log(text);
    logLines.value = [{css: "text-green-500", text}, ...logLines.value];
}

function error(text: string) {
    console.error(text);
    logLines.value = [{css: "text-rose-400", text}, ...logLines.value];
}

function runEmotions(emotions: Record<string, number>) {
    if (!refCube.value)
       return; // cube not ready yet

    const maxEmotion = Object.keys(COMMANDS.value).reduce((a, emotion) => {
        const value = emotions[emotion];
        if (value > a.value) {
            return {emotion, value};
        }

        return a;
    }, {emotion: "", value: 0});
    if (maxEmotion?.emotion) {
        COMMANDS.value[maxEmotion?.emotion]?.(refCube.value, Math.min(maxEmotion.value / 100, 0.9));
    }

}
</script>