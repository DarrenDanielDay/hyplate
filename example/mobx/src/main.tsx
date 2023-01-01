import "./config.js";
import { appendChild, select } from "hyplate/core";
import { App } from "./components/app/app.component.js";

(<App greet="You"></App>)(appendChild(select("div#app")!));
