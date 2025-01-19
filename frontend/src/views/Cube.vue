<template>
    <template v-if="!isSpeechRecognitionAvailable">
        <AlertError
            title="Warning!"
            text="Speech recognition is not available in your browser."
        />
    </template>
    <template v-else-if="!isMicrophoneEnabled">
        <div class="flex flex-col items-center gap-4">
             <AlertError
                title="Warning!"
                text="Please allow microphone access."
            />
        </div>
    </template>
    <template v-else>
        <div class="flex flex-col flex-initial items-center justify-center gap-4 mt-8 w-full">
            <div class="flex w-full justify-center gap-4">
                <Button @click="start" :disabled="isStarted">Start</Button>
                <Button @click="stop" outline :disabled="!isStarted">Stop</Button>
            </div>
            <div class="flex w-full justify-center gap-4">
                <CubeScene class="flex-1 w-full" ref="refCube" />
            </div>
            <div>
                <Textarea :value="transcriptText" class="w-96 h-full" disabled></Textarea>
            </div>
        </div>
    </template>
</template>


<script lang="ts" setup>

import CubeScene from '@/components/cube-scene.vue';
import { computed, onMounted, onUnmounted, shallowRef, unref } from 'vue';
import AlertError from '@/components/ui/alert-error.vue';
import Button  from '@/components/ui/button.vue';
import Textarea from '@/components/ui/textarea.vue';

interface CubeExports {
    back(): void;
    forward(): void;
    left(): void;
    right(): void;
}


const isSpeechRecognitionAvailable = shallowRef(false);
const isMicrophoneEnabled = shallowRef(false);
const refCube = shallowRef<any|null>(null);
const isStarted = shallowRef(false);
const transcriptLines = shallowRef<string[]>([]);
const interimLine = shallowRef<string>("");
const global = <any>window;
const SpeechRecognition = global.SpeechRecognition || global.webkitSpeechRecognition;
const SpeechGrammarList  = global.SpeechGrammarList  || global.webkitSpeechGrammarList ;
const SpeechRecognitionEvent = global.SpeechRecognitionEvent || global.webkitSpeechRecognitionEvent;
let recognition: any;

const transcriptText = computed(() => {
    return transcriptLines.value.join("\n") + "\n" + interimLine.value;
});

const COMMANDS: Record<string, (cube: CubeExports) => void> = {
    "up": c => c.back(),
    "down": c => c.forward(),
    "left": c => c.left(),
    "right": c => c.right(),
};

onMounted(() => {
    // Check if speech recognition is available in the browser.
    isSpeechRecognitionAvailable.value = !!SpeechRecognition && !!SpeechRecognitionEvent && !!SpeechGrammarList;

    if (isSpeechRecognitionAvailable.value) {
        recognition = new SpeechRecognition();
        const speechRecognitionList = new SpeechGrammarList();
        const directions = [
            "up",
            "down",
            "left",
            "right",
        ];

        const grammar = `#JSGF V1.0; grammar directions; public <direction> = ${directions.join(" | ",)};`;
        speechRecognitionList.addFromString(grammar, 1);
        recognition.grammars = speechRecognitionList;
        recognition.continuous = true;
        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.onresult = (event: any) => {
            // console.log(event.results)
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const lines = unref(transcriptLines);
                // If the result item is Final, add it to Final Transcript, Else add it to Interim transcript
                const text = String(event.results[i][0].transcript);
                if (event.results[i].isFinal) {
                    interimLine.value = "";
                    text.split(" ")
                        .map(i => COMMANDS[i.toLowerCase()])
                        .filter(Boolean)
                        .forEach(f => f && f(refCube.value));

                    transcriptLines.value = [...lines, text];
                } else {
                    // interimLine.value += text;

                    // text.split(" ")
                    //     .map(i => COMMANDS[i.toLowerCase()])
                    //     .filter(Boolean)
                    //     .forEach(f => f && f(refCube.value));
                }

            }

        };

        recognition.onspeechend = () => {
            stop();
        };

        checkMicAccess();
    }
});
onUnmounted(() => {
    stop();
});

function handleClick(text: string) {
    alert(text)
}
function start() {
    recognition?.start();
    isStarted.value = true;
}
function stop() {
    recognition?.stop();
    isStarted.value = false;
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
</script>