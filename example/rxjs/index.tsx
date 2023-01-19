import "./config-store.js";
import { appendChild } from "hyplate/core";
import { App } from "./components/app/app.js";

const appMountable = <App greet="You"></App>;
const attach = appendChild<HTMLElement>(document.body);
appMountable(attach);
