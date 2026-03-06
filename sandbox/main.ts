import App from "./App.vue";
import { createApp } from "vue";
import Vue3TreePlugin from "../src";

import "@mdi/font/css/materialdesignicons.css"

import { createVuetify } from "vuetify"

import * as components from "vuetify/components"
import * as directives from "vuetify/directives"
import { aliases, mdi } from "vuetify/iconsets/mdi"

const vuetify = createVuetify({
    components,
    directives,
    icons: {
        defaultSet: "mdi",
        aliases,
        sets: {
            mdi
        }
    }    
})

const app = createApp(App);
app.use(vuetify);
app.use(Vue3TreePlugin);
app.mount("#app");