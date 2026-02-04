import App from "./App.vue";
import { createApp } from "vue";
import Vue3TreePlugin from "../src";

const app = createApp(App);
app.use(Vue3TreePlugin);
app.mount("#app");