// @ts-check
import g from "glob";
import { promisify } from "util";
/*
import { emit } from "../dist/compiler/node-emitter.js";
*/
const glob = promisify(g);
const templates = await glob("./tests/file-tests/**/*.template.html");
/*
await Promise.all(templates.map((file) => emit(file)));
*/
